import type { DocumentProject, Fragment } from '../../store/useFragmentsStore';
import { replaceWikilinks } from '../../utils/wikilinks';

interface CompileOptions {
  /** Strip [[wikilink]] brackets in output (keep alias/title as plain text) */
  stripWikilinks?: boolean;
  /** Include the document title as top-level H1 */
  includeTitle?: boolean;
}

export function compileDocument(
  doc: DocumentProject,
  _fragments: Fragment[],
  opts: CompileOptions = {}
): string {
  const { stripWikilinks = true, includeTitle = true } = opts;

  const parts: string[] = [];
  if (includeTitle) {
    parts.push(`# ${doc.title}\n`);
  }

  const sorted = [...doc.sections].sort((a, b) => a.order - b.order);
  for (const section of sorted) {
    parts.push(`## ${section.title}\n`);
    let body = section.content;
    if (stripWikilinks) {
      body = replaceWikilinks(body, (m) => m.alias ?? m.target);
    }
    parts.push(body.trim());
    parts.push('');
  }

  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export function downloadMarkdown(fileName: string, content: string) {
  const safeName = fileName.replace(/[\\/:*?"<>|]/g, '_') + '.md';
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
