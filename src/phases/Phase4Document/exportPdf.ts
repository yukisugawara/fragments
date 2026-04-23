import { marked } from 'marked';
import type { DocumentProject, Fragment, FragmentImage } from '../../store/useFragmentsStore';
import { replaceWikilinks } from '../../utils/wikilinks';
import { renderObsidianMarkdown } from '../../utils/obsidianMarkdown';

marked.setOptions({ breaks: true, gfm: true });

export interface RenderOptions {
  /** Whether to expand [[links]] into plain text (alias or title) */
  stripWikilinks?: boolean;
  /** Include a decorative title block as a cover/first-page header */
  includeTitleBlock?: boolean;
  /** Generate a table of contents from level-2 headings */
  includeToc?: boolean;
  /** Author or attribution shown under the title */
  author?: string;
  /** ISO date, defaults to today */
  date?: string;
}

export interface RenderedDocument {
  html: string;
  css: string;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'
  );
}

function formatDateISO(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return iso ?? '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function slug(s: string, idx: number): string {
  const base = s
    .toLowerCase()
    .replace(/[^\w\u3040-\u30ff\u4e00-\u9fff\u3400-\u4dbf]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base ? `sec-${idx}-${base.slice(0, 40)}` : `sec-${idx}`;
}

/** Render the compiled document as beautifully-typeset HTML (body only). */
export function renderDocumentBody(
  doc: DocumentProject,
  fragments: Fragment[],
  opts: RenderOptions = {},
  images: FragmentImage[] = [],
): string {
  const { stripWikilinks = true, includeTitleBlock = true, includeToc = true, author, date } = opts;

  const sorted = [...doc.sections].sort((a, b) => a.order - b.order);

  // Pre-compute section ids for ToC
  const sectionIds = sorted.map((s, i) => slug(s.title, i));

  const parts: string[] = [];

  if (includeTitleBlock) {
    parts.push(`<header class="doc-title-block">`);
    parts.push(`<h1 class="doc-title">${escapeHtml(doc.title)}</h1>`);
    const meta: string[] = [];
    if (author) meta.push(escapeHtml(author));
    meta.push(formatDateISO(date));
    parts.push(`<div class="doc-meta">${meta.join('  ·  ')}</div>`);
    parts.push(`</header>`);
  }

  if (includeToc && sorted.length > 1) {
    parts.push(`<nav class="doc-toc" aria-label="Table of contents">`);
    parts.push(`<div class="doc-toc-title">目次 / Contents</div>`);
    parts.push(`<ol>`);
    sorted.forEach((s, i) => {
      parts.push(`<li><a href="#${sectionIds[i]}">${escapeHtml(s.title)}</a></li>`);
    });
    parts.push(`</ol>`);
    parts.push(`</nav>`);
    parts.push(`<div class="doc-page-break"></div>`);
  }

  sorted.forEach((section, i) => {
    parts.push(`<section class="doc-section" id="${sectionIds[i]}">`);
    parts.push(`<h2 class="doc-section-title">${escapeHtml(section.title)}</h2>`);
    let body = section.content;
    if (stripWikilinks) {
      // Preserve image embeds (![[image.png]]); only strip plain [[wikilinks]].
      body = replaceWikilinks(body, (m) => m.alias ?? m.target);
    }
    // Render markdown with Obsidian extensions (image embeds, callouts, highlights, …)
    const bodyHtml = renderObsidianMarkdown(body.trim(), fragments, images);
    parts.push(`<div class="doc-body">${bodyHtml}</div>`);
    parts.push(`</section>`);
  });

  return parts.join('\n');
}

/** Returns stylesheet tuned for both on-screen preview and print. */
export function documentCss(): string {
  return `
:root {
  --serif: "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP",
    "MS P Mincho", "Times New Roman", Georgia, serif;
  --sans: -apple-system, BlinkMacSystemFont, "SF Pro Text",
    "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Yu Gothic",
    "Noto Sans JP", "Helvetica Neue", Arial, sans-serif;
  --mono: "SF Mono", "Menlo", "Consolas", ui-monospace, monospace;
  --ink: #1a1a1a;
  --ink-soft: #4a4a4a;
  --ink-mute: #888;
  --hair: rgba(0, 0, 0, 0.14);
  --rule: rgba(0, 0, 0, 0.08);
}

.doc-root {
  font-family: var(--serif);
  font-size: 11pt;
  line-height: 1.88;
  color: var(--ink);
  max-width: 36em;
  margin: 0 auto;
  padding: 0;
  hanging-punctuation: allow-end last;
}

/* --- Title block --- */
.doc-title-block {
  text-align: center;
  padding: 3.5em 0 2.5em;
  border-bottom: 0.5pt solid var(--rule);
  margin-bottom: 2.5em;
}
.doc-title {
  font-family: var(--sans);
  font-size: 22pt;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
  margin: 0 0 1em 0;
  color: var(--ink);
}
.doc-meta {
  font-family: var(--sans);
  font-size: 10pt;
  color: var(--ink-mute);
  letter-spacing: 0.04em;
}

/* --- ToC --- */
.doc-toc {
  margin: 0 auto 2.5em;
  padding: 1.2em 1.6em;
  border: 0.5pt solid var(--rule);
  border-radius: 4pt;
  background: rgba(0, 0, 0, 0.015);
}
.doc-toc-title {
  font-family: var(--sans);
  font-size: 9pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--ink-mute);
  margin-bottom: 0.8em;
}
.doc-toc ol {
  list-style: none;
  counter-reset: toc;
  padding: 0;
  margin: 0;
}
.doc-toc li {
  counter-increment: toc;
  font-family: var(--sans);
  font-size: 10.5pt;
  margin: 0.35em 0;
  padding-left: 1.7em;
  position: relative;
  color: var(--ink);
}
.doc-toc li::before {
  content: counter(toc, decimal-leading-zero);
  position: absolute;
  left: 0;
  color: var(--ink-mute);
  font-variant-numeric: tabular-nums;
  font-size: 9.5pt;
}
.doc-toc a { color: inherit; text-decoration: none; }
.doc-toc a:hover { text-decoration: underline; text-decoration-color: var(--hair); }

/* --- Sections --- */
.doc-section { margin-bottom: 2.5em; }
.doc-section-title {
  font-family: var(--sans);
  font-size: 15pt;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.005em;
  margin: 2.4em 0 1em;
  padding-bottom: 0.35em;
  border-bottom: 0.5pt solid var(--rule);
  color: var(--ink);
  page-break-after: avoid;
  break-after: avoid-page;
}
.doc-section:first-of-type .doc-section-title { margin-top: 0; }

.doc-body {
  font-family: var(--serif);
}

.doc-body h1,
.doc-body h2,
.doc-body h3,
.doc-body h4 {
  font-family: var(--sans);
  color: var(--ink);
  margin-top: 1.6em;
  margin-bottom: 0.6em;
  line-height: 1.4;
  page-break-after: avoid;
  break-after: avoid-page;
}
.doc-body h1 { font-size: 14pt; font-weight: 700; }
.doc-body h2 { font-size: 12.5pt; font-weight: 700; }
.doc-body h3 { font-size: 11.5pt; font-weight: 600; }
.doc-body h4 { font-size: 11pt; font-weight: 600; color: var(--ink-soft); }

.doc-body p {
  margin: 0 0 1em 0;
  text-align: justify;
  text-justify: inter-ideograph;
  widows: 2;
  orphans: 2;
  word-break: normal;
  overflow-wrap: anywhere;
}
.doc-body p + p { text-indent: 1em; }

.doc-body blockquote {
  margin: 1.2em 1em;
  padding: 0.1em 0 0.1em 1.1em;
  border-left: 2pt solid var(--ink-mute);
  color: var(--ink-soft);
  font-size: 10.5pt;
  line-height: 1.8;
  font-style: normal;
}
.doc-body blockquote strong { color: var(--ink); font-weight: 600; }
.doc-body blockquote p { margin: 0.35em 0; text-indent: 0; }

.doc-body ul,
.doc-body ol { margin: 0.7em 0 0.7em 0; padding-left: 1.8em; }
.doc-body li { margin: 0.3em 0; }
.doc-body ul { list-style-type: disc; }

.doc-body code {
  font-family: var(--mono);
  font-size: 0.92em;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.06em 0.35em;
  border-radius: 3px;
}
.doc-body pre {
  font-family: var(--mono);
  background: rgba(0, 0, 0, 0.04);
  padding: 0.9em 1em;
  border-radius: 4pt;
  overflow-x: auto;
  font-size: 9.5pt;
  line-height: 1.6;
  margin: 1em 0;
  page-break-inside: avoid;
  break-inside: avoid;
}
.doc-body pre code { background: transparent; padding: 0; }

.doc-body a {
  color: var(--ink);
  text-decoration: none;
  border-bottom: 0.4pt solid var(--ink-mute);
}

.doc-body hr {
  border: none;
  border-top: 0.5pt solid var(--rule);
  margin: 2em auto;
  width: 40%;
}

.doc-body img {
  max-width: 100%;
  height: auto;
  margin: 1em 0;
  page-break-inside: avoid;
  break-inside: avoid;
}

.doc-body table {
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 10pt;
  width: 100%;
}
.doc-body th,
.doc-body td {
  border: 0.3pt solid var(--hair);
  padding: 0.5em 0.7em;
  text-align: left;
}
.doc-body th {
  background: rgba(0, 0, 0, 0.03);
  font-family: var(--sans);
  font-weight: 600;
}

.doc-page-break { page-break-after: always; break-after: page; }

/* --- Screen preview tweaks --- */
.doc-preview-surface {
  background: #FDFDFD;
  padding: 3.5em 2.5em 4em;
  border-radius: 6px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.05);
}

/* --- Print-only rules --- */
@media print {
  @page {
    size: A4;
    margin: 22mm 20mm 24mm 20mm;
    @bottom-center {
      content: counter(page) " / " counter(pages);
      font-family: var(--sans);
      font-size: 9pt;
      color: #888;
    }
  }
  html, body { background: #fff; }
  .doc-preview-surface {
    box-shadow: none;
    padding: 0;
    border-radius: 0;
    background: transparent;
  }
  .doc-root {
    max-width: none;
  }
  .doc-title-block { page-break-after: always; break-after: page; }
  .doc-toc { page-break-after: always; break-after: page; }
  .doc-section {
    page-break-inside: auto;
  }
}
`;
}

/**
 * Render a standalone printable HTML document.
 * Suitable for injection into a new window for printing / saving as PDF.
 */
export function renderStandaloneDocument(
  doc: DocumentProject,
  fragments: Fragment[],
  opts: RenderOptions = {},
  images: FragmentImage[] = [],
): string {
  const body = renderDocumentBody(doc, fragments, opts, images);
  const css = documentCss();
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(doc.title)}</title>
  <style>${css}
html, body { margin: 0; padding: 0; background: #f5f5f7; }
body { padding: 40px 20px; }
@media print {
  body { padding: 0; }
}
  </style>
</head>
<body>
  <article class="doc-root doc-preview-surface">
    ${body}
  </article>
</body>
</html>`;
}

/**
 * Open a new window containing the printable document and trigger the
 * browser's print dialog — the user saves as PDF from there. This approach
 * uses the browser's native text rendering, which keeps typography crisp.
 */
export function openPdfPrintWindow(
  doc: DocumentProject,
  fragments: Fragment[],
  opts: RenderOptions = {},
  images: FragmentImage[] = [],
): boolean {
  const html = renderStandaloneDocument(doc, fragments, opts, images);
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    alert(
      'ポップアップがブロックされました。ブラウザのポップアップ設定を確認してください。'
    );
    return false;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Wait for fonts and layout to settle before printing
  const trigger = () => {
    try {
      win.focus();
      win.print();
    } catch {
      // ignore — user can invoke print manually
    }
  };
  if (win.document.readyState === 'complete') {
    setTimeout(trigger, 400);
  } else {
    win.addEventListener('load', () => setTimeout(trigger, 400));
  }
  return true;
}
