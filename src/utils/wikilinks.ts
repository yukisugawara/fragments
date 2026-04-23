export interface WikilinkMatch {
  raw: string;
  target: string;
  alias: string | null;
  start: number;
  end: number;
}

const WIKILINK_RE = /\[\[([^\[\]\n|#]+)(?:#[^\[\]\n|]+)?(?:\|([^\[\]\n]+))?\]\]/g;

export function parseWikilinks(text: string): WikilinkMatch[] {
  const matches: WikilinkMatch[] = [];
  let m: RegExpExecArray | null;
  WIKILINK_RE.lastIndex = 0;
  while ((m = WIKILINK_RE.exec(text)) !== null) {
    matches.push({
      raw: m[0],
      target: m[1].trim(),
      alias: m[2]?.trim() ?? null,
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return matches;
}

export function replaceWikilinks(
  text: string,
  replace: (match: WikilinkMatch) => string
): string {
  const parts: string[] = [];
  let cursor = 0;
  for (const m of parseWikilinks(text)) {
    parts.push(text.slice(cursor, m.start));
    parts.push(replace(m));
    cursor = m.end;
  }
  parts.push(text.slice(cursor));
  return parts.join('');
}

export function extractTitlesFromContent(content: string): string[] {
  const titles = new Set<string>();
  for (const m of parseWikilinks(content)) {
    titles.add(m.target.toLowerCase());
  }
  return Array.from(titles);
}

/**
 * Append a [[title]] wikilink to the content if it isn't already present.
 * Used by Phase 2 when the user draws a new edge.
 */
export function appendWikilink(content: string, title: string): string {
  const link = `[[${title}]]`;
  const existing = parseWikilinks(content);
  if (existing.some((m) => m.target.toLowerCase() === title.toLowerCase())) {
    return content;
  }
  const trimmed = content.replace(/\s+$/, '');
  if (!trimmed) return link;
  return `${trimmed}\n\n${link}`;
}
