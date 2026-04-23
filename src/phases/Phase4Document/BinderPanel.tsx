import { useFragmentsStore, type DocumentProject } from '../../store/useFragmentsStore';
import { useState } from 'react';

interface Props {
  doc: DocumentProject;
  activeSectionId: string | null;
  onSelectSection: (id: string) => void;
}

export function BinderPanel({ doc, activeSectionId, onSelectSection }: Props) {
  const addSection = useFragmentsStore((s) => s.addSection);
  const removeSection = useFragmentsStore((s) => s.removeSection);
  const moveSection = useFragmentsStore((s) => s.moveSection);
  const updateSection = useFragmentsStore((s) => s.updateSection);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const sorted = [...doc.sections].sort((a, b) => a.order - b.order);

  const handleAdd = () => {
    const section = addSection(doc.id, { title: '新しいセクション' });
    onSelectSection(section.id);
  };

  const startRename = (sectionId: string, currentTitle: string) => {
    setRenamingId(sectionId);
    setRenameValue(currentTitle);
  };

  const commitRename = () => {
    if (renamingId) {
      updateSection(doc.id, renamingId, { title: renameValue.trim() || 'Untitled' });
    }
    setRenamingId(null);
  };

  return (
    <div className="h-full flex flex-col border-r border-violet-200/60 dark:border-dpurple-700/60 bg-cream-50 dark:bg-dpurple-900/60">
      <div className="px-3 py-2 border-b border-violet-200/60 dark:border-dpurple-700/60 flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-violet-500 font-semibold">
          バインダー
        </div>
        <button
          onClick={handleAdd}
          className="text-xs px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded"
          title="セクションを追加"
        >
          + 節
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sorted.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-8 px-2 leading-relaxed">
            セクションがありません。<br />
            「+ 節」で追加しましょう。
          </div>
        ) : (
          <ul className="space-y-1">
            {sorted.map((s, i) => {
              const active = s.id === activeSectionId;
              const refCount = s.fragmentIds.length;
              return (
                <li key={s.id}>
                  <div
                    className={[
                      'group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
                      active
                        ? 'bg-violet-100 dark:bg-dpurple-700 ring-1 ring-violet-300 dark:ring-dpurple-500'
                        : 'hover:bg-violet-50 dark:hover:bg-dpurple-800',
                    ].join(' ')}
                    onClick={() => onSelectSection(s.id)}
                  >
                    <span className="text-[10px] text-gray-400 w-5 text-right shrink-0">
                      {i + 1}
                    </span>
                    {renamingId === s.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 text-sm px-1.5 py-0.5 bg-white dark:bg-dpurple-900 border border-violet-300 rounded focus:outline-none focus:ring-1 focus:ring-violet-400"
                      />
                    ) : (
                      <span
                        className="flex-1 min-w-0 text-sm font-medium text-violet-900 dark:text-violet-50 truncate"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startRename(s.id, s.title);
                        }}
                      >
                        {s.title}
                      </span>
                    )}
                    {refCount > 0 && (
                      <span className="text-[10px] text-violet-500 bg-violet-50 dark:bg-dpurple-800 px-1.5 py-0.5 rounded shrink-0" title="参照している断片の数">
                        {refCount}
                      </span>
                    )}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (i > 0) moveSection(doc.id, s.id, i - 1);
                        }}
                        disabled={i === 0}
                        className="px-1 text-gray-500 hover:text-violet-700 disabled:opacity-30 text-xs"
                        title="上へ"
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (i < sorted.length - 1) moveSection(doc.id, s.id, i + 1);
                        }}
                        disabled={i === sorted.length - 1}
                        className="px-1 text-gray-500 hover:text-violet-700 disabled:opacity-30 text-xs"
                        title="下へ"
                      >
                        ↓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`セクション「${s.title}」を削除しますか？`)) {
                            removeSection(doc.id, s.id);
                          }
                        }}
                        className="px-1 text-rose-500 hover:text-rose-600 text-xs"
                        title="削除"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="px-3 py-2 text-[10px] text-gray-400 border-t border-violet-200/40 dark:border-dpurple-700/40 leading-relaxed">
        ダブルクリックで改名<br />
        セクション名: ↑↓で並べ替え
      </div>
    </div>
  );
}
