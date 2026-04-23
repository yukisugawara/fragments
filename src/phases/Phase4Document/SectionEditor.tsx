import { useRef } from 'react';
import { useFragmentsStore, type DocumentProject, type DocumentSection } from '../../store/useFragmentsStore';

interface Props {
  doc: DocumentProject;
  section: DocumentSection | null;
}

export function SectionEditor({ doc, section }: Props) {
  const updateSection = useFragmentsStore((s) => s.updateSection);
  const fragments = useFragmentsStore((s) => s.fragments);
  const setPhase = useFragmentsStore((s) => s.setActivePhase);
  const setActiveFragmentId = useFragmentsStore((s) => s.setActiveFragmentId);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  if (!section) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-white dark:bg-dpurple-950">
        左のバインダーからセクションを選んでください
      </div>
    );
  }

  const referenced = section.fragmentIds
    .map((id) => fragments.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => !!f);

  const removeReference = (fragmentId: string) => {
    updateSection(doc.id, section.id, {
      fragmentIds: section.fragmentIds.filter((id) => id !== fragmentId),
    });
  };

  const openInPhase1 = (fragmentId: string) => {
    setActiveFragmentId(fragmentId);
    setPhase(1);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dpurple-950">
      <div className="px-6 py-3 border-b border-violet-200/60 dark:border-dpurple-700/60">
        <input
          type="text"
          value={section.title}
          onChange={(e) => updateSection(doc.id, section.id, { title: e.target.value })}
          className="w-full text-xl font-bold bg-transparent focus:outline-none text-violet-900 dark:text-violet-50"
          placeholder="セクション名"
        />
      </div>
      <div className="flex-1 overflow-hidden relative">
        <textarea
          ref={textareaRef}
          value={section.content}
          onChange={(e) => updateSection(doc.id, section.id, { content: e.target.value })}
          placeholder={'このセクションの本文を書く...\n\n右の断片ライブラリから本文を差し込んだり、\n[[タイトル]] 形式で断片への参照を埋め込めます。'}
          className="absolute inset-0 w-full h-full px-6 py-6 resize-none bg-transparent focus:outline-none text-[15px] leading-relaxed text-gray-800 dark:text-gray-100 font-sans"
          spellCheck={false}
        />
      </div>
      {referenced.length > 0 && (
        <div className="border-t border-violet-200/60 dark:border-dpurple-700/60 bg-cream-50 dark:bg-dpurple-900/50 max-h-[38%] overflow-y-auto">
          <div className="px-6 py-2 text-[10px] uppercase tracking-widest text-violet-500 font-semibold sticky top-0 bg-cream-50/95 dark:bg-dpurple-900/95 backdrop-blur border-b border-violet-100 dark:border-dpurple-800">
            参照している断片（{referenced.length}）
          </div>
          <ul className="px-6 py-3 space-y-3">
            {referenced.map((f) => (
              <li
                key={f.id}
                className="text-xs bg-white dark:bg-dpurple-800 rounded-lg p-3 border border-violet-200/60 dark:border-dpurple-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => openInPhase1(f.id)}
                    className="text-sm font-semibold text-violet-700 dark:text-violet-200 hover:underline text-left"
                  >
                    {f.title}
                  </button>
                  <button
                    onClick={() => removeReference(f.id)}
                    className="text-rose-400 hover:text-rose-600 text-xs"
                    title="この参照を外す"
                  >
                    × 外す
                  </button>
                </div>
                <div className="mt-1 text-gray-600 dark:text-gray-300 leading-relaxed max-h-20 overflow-hidden">
                  {f.content.trim().slice(0, 200) || '（空の断片）'}
                  {f.content.length > 200 && '…'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function insertAtCursor(
  textarea: HTMLTextAreaElement | null,
  current: string,
  insertion: string
): { next: string; nextCursor: number } {
  if (!textarea) {
    return { next: current + '\n\n' + insertion, nextCursor: current.length + 2 + insertion.length };
  }
  const start = textarea.selectionStart ?? current.length;
  const end = textarea.selectionEnd ?? current.length;
  const before = current.slice(0, start);
  const after = current.slice(end);
  // Add surrounding newlines if needed to keep markdown block structure intact
  const needLeadingBreak = before.length > 0 && !before.endsWith('\n\n');
  const leading = needLeadingBreak ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
  const needTrailingBreak = after.length > 0 && !after.startsWith('\n');
  const trailing = needTrailingBreak ? '\n\n' : '\n';
  const next = before + leading + insertion + trailing + after;
  const nextCursor = before.length + leading.length + insertion.length + trailing.length;
  return { next, nextCursor };
}
