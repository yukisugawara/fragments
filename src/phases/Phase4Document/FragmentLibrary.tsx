import { useMemo, useState } from 'react';
import { useFragmentsStore, type DocumentProject, type DocumentSection } from '../../store/useFragmentsStore';
import { insertAtCursor } from './SectionEditor';

interface Props {
  doc: DocumentProject;
  section: DocumentSection | null;
}

export function FragmentLibrary({ doc, section }: Props) {
  const fragments = useFragmentsStore((s) => s.fragments);
  const updateSection = useFragmentsStore((s) => s.updateSection);
  const setActiveFragmentId = useFragmentsStore((s) => s.setActiveFragmentId);
  const setPhase = useFragmentsStore((s) => s.setActivePhase);

  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...fragments].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter(
      (f) => f.title.toLowerCase().includes(q) || f.content.toLowerCase().includes(q)
    );
  }, [fragments, query]);

  const findTextarea = (): HTMLTextAreaElement | null => {
    const el = document.querySelector(
      '.phase4-section-editor textarea'
    ) as HTMLTextAreaElement | null;
    return el;
  };

  const insertContent = (fragmentId: string) => {
    if (!section) return;
    const fragment = fragments.find((f) => f.id === fragmentId);
    if (!fragment) return;
    const ta = findTextarea();
    const insertion = `> **${fragment.title}**\n> \n` +
      fragment.content.split('\n').map((l) => `> ${l}`).join('\n');
    const { next, nextCursor } = insertAtCursor(ta, section.content, insertion);
    updateSection(doc.id, section.id, {
      content: next,
      fragmentIds: section.fragmentIds.includes(fragmentId)
        ? section.fragmentIds
        : [...section.fragmentIds, fragmentId],
    });
    queueMicrotask(() => {
      if (ta) {
        ta.focus();
        ta.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  const insertWikilink = (fragmentId: string) => {
    if (!section) return;
    const fragment = fragments.find((f) => f.id === fragmentId);
    if (!fragment) return;
    const ta = findTextarea();
    const insertion = `[[${fragment.title}]]`;
    // Inline insertion — no forced line breaks
    const start = ta?.selectionStart ?? section.content.length;
    const end = ta?.selectionEnd ?? section.content.length;
    const next =
      section.content.slice(0, start) + insertion + section.content.slice(end);
    updateSection(doc.id, section.id, {
      content: next,
      fragmentIds: section.fragmentIds.includes(fragmentId)
        ? section.fragmentIds
        : [...section.fragmentIds, fragmentId],
    });
    queueMicrotask(() => {
      if (ta) {
        ta.focus();
        const pos = start + insertion.length;
        ta.setSelectionRange(pos, pos);
      }
    });
  };

  return (
    <div className="h-full flex flex-col border-l border-violet-200/60 dark:border-dpurple-700/60 bg-cream-50 dark:bg-dpurple-900/60">
      <div className="px-3 py-2 border-b border-violet-200/60 dark:border-dpurple-700/60">
        <div className="text-xs uppercase tracking-widest text-violet-500 font-semibold mb-1.5">
          断片ライブラリ
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="検索..."
          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white dark:bg-dpurple-800 border border-violet-200 dark:border-dpurple-700 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:text-gray-100"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-6 leading-relaxed">
            {fragments.length === 0
              ? 'フェーズ1で断片をつくると\nここに並びます'
              : '該当する断片がありません'}
          </div>
        )}
        {filtered.map((f) => (
          <div
            key={f.id}
            className="group bg-white dark:bg-dpurple-800 rounded-lg border border-violet-200/60 dark:border-dpurple-700 p-2.5 hover:border-violet-400 dark:hover:border-dpurple-500 transition-colors"
          >
            <div
              className="text-sm font-semibold text-violet-900 dark:text-violet-50 truncate cursor-pointer hover:underline"
              onClick={() => {
                setActiveFragmentId(f.id);
                setPhase(1);
              }}
              title="フェーズ1で開く"
            >
              {f.title}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
              {f.content.replace(/[#*_`>\n]/g, ' ').trim().slice(0, 80) || '（空）'}
            </div>
            <div className="mt-2 flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => insertContent(f.id)}
                disabled={!section}
                className="flex-1 px-2 py-1 text-[10px] font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded disabled:opacity-40 disabled:cursor-not-allowed"
                title="本文を引用として挿入"
              >
                本文を挿入
              </button>
              <button
                onClick={() => insertWikilink(f.id)}
                disabled={!section}
                className="px-2 py-1 text-[10px] font-semibold border border-violet-300 dark:border-dpurple-600 text-violet-700 dark:text-violet-100 hover:bg-violet-50 dark:hover:bg-dpurple-700 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                title="[[リンク]]として挿入"
              >
                リンク
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
