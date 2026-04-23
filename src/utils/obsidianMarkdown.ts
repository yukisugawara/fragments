import { marked } from 'marked';
import type { Fragment, FragmentImage } from '../store/useFragmentsStore';

marked.setOptions({ breaks: true, gfm: true });

interface RenderContext {
  fragments: Fragment[];
  titleMap: Map<string, Fragment>;
  imageMap: Map<string, FragmentImage>;
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;

const CALLOUT_ICONS: Record<string, string> = {
  note: '📝',
  info: 'ℹ️',
  tip: '💡',
  hint: '💡',
  important: '❗',
  warning: '⚠️',
  caution: '⚠️',
  danger: '🔥',
  error: '🔥',
  success: '✅',
  check: '✅',
  done: '✅',
  question: '❓',
  quote: '❝',
  cite: '❝',
  summary: '📘',
  abstract: '📘',
  todo: '☑️',
  example: '📎',
};

const CALLOUT_DEFAULT_TITLE: Record<string, string> = {
  note: 'ノート',
  info: '情報',
  tip: 'ヒント',
  hint: 'ヒント',
  important: '重要',
  warning: '注意',
  caution: '注意',
  danger: '危険',
  error: 'エラー',
  success: '成功',
  check: '成功',
  done: '完了',
  question: '疑問',
  quote: '引用',
  cite: '引用',
  summary: '要約',
  abstract: '要約',
  todo: 'TODO',
  example: '例',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return c;
    }
  });
}

function stripComments(md: string): string {
  return md.replace(/%%[\s\S]*?%%/g, '');
}

function transformCallouts(
  md: string,
  ctx: RenderContext,
  embedStack: Set<string>,
): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const head = /^>[ \t]*\[!([a-zA-Z]+)\](?:[ \t]+(.*))?$/.exec(line);
    if (head) {
      const type = head[1].toLowerCase();
      const titleRaw = head[2]?.trim() ?? '';
      const title = titleRaw || CALLOUT_DEFAULT_TITLE[type] || type;
      const body: string[] = [];
      i++;
      while (i < lines.length && /^>/.test(lines[i])) {
        body.push(lines[i].replace(/^>[ \t]?/, ''));
        i++;
      }
      const innerHtml = renderInner(body.join('\n'), ctx, embedStack);
      const icon = CALLOUT_ICONS[type] ?? '•';
      out.push('');
      out.push(
        `<div class="md-callout md-callout-${escapeHtml(type)}">` +
          `<div class="md-callout-title"><span class="md-callout-icon">${icon}</span>${escapeHtml(title)}</div>` +
          `<div class="md-callout-body">${innerHtml}</div>` +
        `</div>`,
      );
      out.push('');
    } else {
      out.push(line);
      i++;
    }
  }
  return out.join('\n');
}

function extractHeadingSection(content: string, heading: string): string | null {
  const lines = content.split('\n');
  const target = heading.toLowerCase();
  let startIdx = -1;
  let startLevel = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.*)$/.exec(lines[i]);
    if (m && m[2].trim().toLowerCase() === target) {
      startIdx = i + 1;
      startLevel = m[1].length;
      break;
    }
  }
  if (startIdx < 0) return null;
  const buf: string[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const m = /^(#{1,6})\s/.exec(lines[i]);
    if (m && m[1].length <= startLevel) break;
    buf.push(lines[i]);
  }
  return buf.join('\n');
}

function transformEmbeds(
  md: string,
  ctx: RenderContext,
  embedStack: Set<string>,
): string {
  return md.replace(/!\[\[([^\[\]\n|]+)(?:\|([^\[\]\n]+))?\]\]/g, (_, raw: string, alias?: string) => {
    const [namePart, headingPart] = raw.split('#');
    const name = namePart.trim();
    const heading = headingPart?.trim();

    // Image embed: ![[image.png]] or ![[image.png|200]]
    if (IMAGE_EXT_RE.test(name)) {
      const img = ctx.imageMap.get(name.toLowerCase());
      if (!img) {
        return `\n<div class="md-embed md-embed-missing">画像が見つかりません: <code>${escapeHtml(raw)}</code></div>\n`;
      }
      // alias can be a width in px (Obsidian convention) e.g. ![[img.png|400]]
      const widthAttr = alias && /^\d+$/.test(alias.trim())
        ? ` style="max-width:${Number(alias)}px"`
        : '';
      return `<img class="md-image" src="${img.dataUrl}" alt="${escapeHtml(name)}" data-image-name="${escapeHtml(name)}"${widthAttr} />`;
    }

    // Fragment embed
    const f = ctx.titleMap.get(name.toLowerCase());
    if (!f) {
      return `\n<div class="md-embed md-embed-missing">埋め込み先が見つかりません: <code>${escapeHtml(raw)}</code></div>\n`;
    }
    if (embedStack.has(f.id)) {
      return `\n<div class="md-embed md-embed-loop">循環埋め込みのためスキップ: <code>${escapeHtml(f.title)}</code></div>\n`;
    }
    let content = f.content;
    if (heading) {
      content = extractHeadingSection(content, heading) ?? content;
    }
    const nextStack = new Set(embedStack);
    nextStack.add(f.id);
    const innerHtml = renderInner(content, ctx, nextStack);
    const titleLabel = heading ? `${f.title} § ${heading}` : f.title;
    return (
      `\n<div class="md-embed" data-wikilink-target="${escapeHtml(f.title)}">` +
        `<div class="md-embed-title">${escapeHtml(titleLabel)}</div>` +
        `<div class="md-embed-body">${innerHtml}</div>` +
      `</div>\n`
    );
  });
}

function transformWikilinks(md: string, ctx: RenderContext): string {
  return md.replace(
    /\[\[([^\[\]\n|#]+)(?:#([^\[\]\n|]+))?(?:\|([^\[\]\n]+))?\]\]/g,
    (_, target: string, heading?: string, alias?: string) => {
      const t = target.trim();
      const h = heading?.trim();
      const label = alias?.trim() ?? (h ? `${t} § ${h}` : t);
      const exists = ctx.titleMap.has(t.toLowerCase());
      const cls = exists ? 'wikilink' : 'wikilink wikilink-new';
      const headingAttr = h ? ` data-wikilink-heading="${escapeHtml(h)}"` : '';
      return `<a href="#" class="${cls}" data-wikilink-target="${escapeHtml(t)}"${headingAttr}>${escapeHtml(label)}</a>`;
    },
  );
}

function transformHighlights(md: string): string {
  return md.replace(/==([^=\n]+?)==/g, (_, inner: string) => `<mark class="md-highlight">${inner}</mark>`);
}

function transformTags(md: string): string {
  return md.replace(
    /(^|[\s(\[])#([\p{L}\p{N}_][\p{L}\p{N}_/-]*)/gu,
    (_, pre: string, tag: string) =>
      `${pre}<a class="md-tag" data-tag="${escapeHtml(tag)}" href="#">#${escapeHtml(tag)}</a>`,
  );
}

interface FootnoteDef {
  id: string;
  num: number;
  body: string;
}

function processFootnotes(md: string): { md: string; defs: FootnoteDef[] } {
  const bodies = new Map<string, string>();
  const stripped = md.replace(/^\[\^([^\]\n]+)\]:[ \t]*(.*)$/gm, (_, id: string, body: string) => {
    bodies.set(id.trim(), body.trim());
    return '';
  });
  if (bodies.size === 0) return { md: stripped, defs: [] };

  const numMap = new Map<string, number>();
  const order: string[] = [];
  let next = 1;
  const replaced = stripped.replace(/\[\^([^\]\n]+)\]/g, (match, id: string) => {
    const key = id.trim();
    if (!bodies.has(key)) return match;
    if (!numMap.has(key)) {
      numMap.set(key, next++);
      order.push(key);
    }
    const n = numMap.get(key)!;
    return `<sup class="md-footnote-ref"><a href="#fn-${escapeHtml(key)}" id="fnref-${escapeHtml(key)}">${n}</a></sup>`;
  });

  const defs: FootnoteDef[] = order.map((id) => ({
    id,
    num: numMap.get(id)!,
    body: bodies.get(id) ?? '',
  }));
  return { md: replaced, defs };
}

function renderFootnoteList(defs: FootnoteDef[], ctx: RenderContext): string {
  const items = defs
    .map((d) => {
      const bodyHtml = renderInner(d.body, ctx, new Set()).trim()
        // unwrap a single <p>...</p> so the footnote renders inline
        .replace(/^<p>([\s\S]*?)<\/p>$/, '$1');
      return (
        `<li id="fn-${escapeHtml(d.id)}" class="md-footnote">` +
          `<span class="md-footnote-num">${d.num}.</span> ${bodyHtml} ` +
          `<a href="#fnref-${escapeHtml(d.id)}" class="md-footnote-backref" title="参照元に戻る">↩</a>` +
        `</li>`
      );
    })
    .join('');
  return `\n<hr class="md-footnote-sep"/><ol class="md-footnotes">${items}</ol>\n`;
}

function renderInner(md: string, ctx: RenderContext, embedStack: Set<string>): string {
  md = transformCallouts(md, ctx, embedStack);
  md = transformEmbeds(md, ctx, embedStack);
  md = transformHighlights(md);
  md = transformWikilinks(md, ctx);
  md = transformTags(md);
  return marked.parse(md) as string;
}

export function renderObsidianMarkdown(
  md: string,
  fragments: Fragment[],
  images: FragmentImage[] = [],
): string {
  const ctx: RenderContext = {
    fragments,
    titleMap: new Map(fragments.map((f) => [f.title.toLowerCase(), f])),
    imageMap: new Map(images.map((i) => [i.name.toLowerCase(), i])),
  };
  const cleaned = stripComments(md);
  const { md: withRefs, defs } = processFootnotes(cleaned);
  let html = renderInner(withRefs, ctx, new Set());
  if (defs.length > 0) {
    html += renderFootnoteList(defs, ctx);
  }
  return html;
}
