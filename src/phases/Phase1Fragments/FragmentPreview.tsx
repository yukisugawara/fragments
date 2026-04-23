import { useMemo, useRef } from 'react';
import { useFragmentsStore } from '../../store/useFragmentsStore';
import { parseWikilinks } from '../../utils/wikilinks';
import { renderObsidianMarkdown } from '../../utils/obsidianMarkdown';

export function FragmentPreview() {
  const activeId = useFragmentsStore((s) => s.activeFragmentId);
  const fragment = useFragmentsStore((s) =>
    s.fragments.find((f) => f.id === activeId) ?? null
  );
  const fragments = useFragmentsStore((s) => s.fragments);
  const images = useFragmentsStore((s) => s.images);
  const setActive = useFragmentsStore((s) => s.setActiveFragmentId);
  const ensureByTitle = useFragmentsStore((s) => s.ensureFragmentByTitle);

  const backlinks = useMemo(() => {
    if (!fragment) return [];
    const out: { id: string; title: string }[] = [];
    for (const other of fragments) {
      if (other.id === fragment.id) continue;
      const links = parseWikilinks(other.content);
      if (links.some((l) => l.target.toLowerCase() === fragment.title.toLowerCase())) {
        out.push({ id: other.id, title: other.title });
      }
    }
    return out;
  }, [fragment, fragments]);

  const html = useMemo(() => {
    if (!fragment) return '';
    return renderObsidianMarkdown(fragment.content, fragments, images);
  }, [fragment, fragments, images]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!fragment) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm bg-cream-50 dark:bg-dpurple-900/40">
        プレビュー
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    const footnote = target.closest('a[href^="#fn-"], a[href^="#fnref-"]') as HTMLAnchorElement | null;
    if (footnote) {
      e.preventDefault();
      const href = footnote.getAttribute('href') ?? '';
      const id = href.slice(1);
      const el = containerRef.current?.querySelector(`#${CSS.escape(id)}`);
      if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const tagAnchor = target.closest('a[data-tag]') as HTMLAnchorElement | null;
    if (tagAnchor) {
      e.preventDefault();
      return;
    }

    const embedBlock = target.closest('.md-embed[data-wikilink-target]') as HTMLElement | null;
    const wikiAnchor = target.closest('a[data-wikilink-target]') as HTMLAnchorElement | null;
    const source = wikiAnchor ?? embedBlock;
    if (!source) return;
    e.preventDefault();
    const title = source.getAttribute('data-wikilink-target') ?? '';
    if (!title) return;
    const f = ensureByTitle(title);
    setActive(f.id);
  };

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-cream-50 dark:bg-dpurple-900/40">
      <div className="px-6 pt-16 pb-6">
        <h1 className="text-xl font-bold text-violet-900 dark:text-violet-50 mb-4">
          {fragment.title}
        </h1>
        <div
          className="prose-fragments"
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {backlinks.length > 0 && (
          <div className="mt-10 pt-4 border-t border-violet-200/60 dark:border-dpurple-700">
            <div className="text-xs uppercase tracking-widest text-violet-500 font-semibold mb-2">
              この断片へのリンク元 ({backlinks.length})
            </div>
            <ul className="space-y-1">
              {backlinks.map((b) => (
                <li key={b.id}>
                  <button
                    onClick={() => setActive(b.id)}
                    className="text-sm text-violet-700 dark:text-violet-200 hover:underline"
                  >
                    ← {b.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
