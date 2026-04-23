import { useEffect, useRef, useState } from 'react';
import { useFragmentsStore } from '../../store/useFragmentsStore';

export function FragmentEditor() {
  const activeId = useFragmentsStore((s) => s.activeFragmentId);
  const fragment = useFragmentsStore((s) =>
    s.fragments.find((f) => f.id === activeId) ?? null
  );
  const fragments = useFragmentsStore((s) => s.fragments);
  const updateFragment = useFragmentsStore((s) => s.updateFragment);
  const addImage = useFragmentsStore((s) => s.addImage);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Wikilink autocomplete state
  const [suggest, setSuggest] = useState<{
    open: boolean;
    query: string;
    start: number;
    items: string[];
    index: number;
  }>({ open: false, query: '', start: -1, items: [], index: 0 });

  useEffect(() => {
    setSuggest((s) => ({ ...s, open: false }));
  }, [activeId]);

  if (!fragment) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm bg-white dark:bg-dpurple-950">
        左のリストから断片を選ぶか、新規作成してください
      </div>
    );
  }

  const detectWikilinkContext = (value: string, caret: number) => {
    // Find the last "[[" before caret that isn't already closed by "]]"
    const before = value.slice(0, caret);
    const open = before.lastIndexOf('[[');
    if (open < 0) return null;
    const between = before.slice(open + 2);
    if (between.includes(']]') || between.includes('\n')) return null;
    return { start: open, query: between };
  };

  const updateSuggest = (value: string, caret: number) => {
    const ctx = detectWikilinkContext(value, caret);
    if (!ctx) {
      setSuggest((s) => (s.open ? { ...s, open: false } : s));
      return;
    }
    const q = ctx.query.toLowerCase();
    const items = fragments
      .map((f) => f.title)
      .filter((t) => t.toLowerCase() !== fragment.title.toLowerCase())
      .filter((t) => !q || t.toLowerCase().includes(q))
      .slice(0, 8);
    setSuggest({ open: true, query: ctx.query, start: ctx.start, items, index: 0 });
  };

  const insertSuggestion = (title: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const value = fragment.content;
    const caret = ta.selectionStart ?? 0;
    const ctx = detectWikilinkContext(value, caret);
    if (!ctx) return;
    const replacement = `[[${title}]]`;
    const next = value.slice(0, ctx.start) + replacement + value.slice(caret);
    updateFragment(fragment.id, { content: next });
    setSuggest((s) => ({ ...s, open: false }));
    // Restore cursor
    queueMicrotask(() => {
      const pos = ctx.start + replacement.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta || !fragment) return;
    const value = fragment.content;
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    updateFragment(fragment.id, { content: next });
    queueMicrotask(() => {
      const pos = start + text.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleFilesInsert = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) return;
    for (const file of arr) {
      const img = await addImage(file, file.name || undefined);
      insertAtCursor(`\n\n![[${img.name}]]\n\n`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dpurple-950">
      <div className="border-b border-violet-200/60 dark:border-dpurple-700/60 pt-14 px-4 pb-2 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={fragment.title}
            onChange={(e) => updateFragment(fragment.id, { title: e.target.value })}
            className="w-full text-lg font-bold bg-transparent focus:outline-none text-violet-900 dark:text-violet-50 placeholder-gray-400"
            placeholder="タイトル"
          />
          <div className="text-[10px] text-gray-400 mt-0.5">
            {new Date(fragment.updatedAt).toLocaleString('ja-JP')}
          </div>
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFilesInsert(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="shrink-0 mt-1 px-2 py-1 text-xs rounded-lg border border-violet-200 dark:border-dpurple-600 text-violet-700 dark:text-violet-200 hover:bg-violet-50 dark:hover:bg-dpurple-800"
          title="画像を挿入（ドラッグ＆ドロップ・ペーストでも可）"
        >
          🖼 画像
        </button>
      </div>
      <div
        className={`relative flex-1 overflow-hidden ${dragOver ? 'ring-2 ring-violet-400 ring-inset' : ''}`}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (e.dataTransfer.files?.length) {
            e.preventDefault();
            setDragOver(false);
            handleFilesInsert(e.dataTransfer.files);
          }
        }}
      >
        <textarea
          ref={textareaRef}
          value={fragment.content}
          onChange={(e) => {
            updateFragment(fragment.id, { content: e.target.value });
            updateSuggest(e.target.value, e.target.selectionStart ?? 0);
          }}
          onPaste={(e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            const files: File[] = [];
            for (const it of Array.from(items)) {
              if (it.kind === 'file' && it.type.startsWith('image/')) {
                const f = it.getAsFile();
                if (f) files.push(f);
              }
            }
            if (files.length > 0) {
              e.preventDefault();
              handleFilesInsert(files);
            }
          }}
          onKeyDown={(e) => {
            if (suggest.open) {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSuggest((s) => ({ ...s, index: (s.index + 1) % Math.max(s.items.length, 1) }));
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggest((s) => ({
                  ...s,
                  index: (s.index - 1 + Math.max(s.items.length, 1)) % Math.max(s.items.length, 1),
                }));
                return;
              }
              if (e.key === 'Enter' || e.key === 'Tab') {
                if (suggest.items.length > 0) {
                  e.preventDefault();
                  insertSuggestion(suggest.items[suggest.index]);
                  return;
                }
                if (suggest.query.trim()) {
                  e.preventDefault();
                  insertSuggestion(suggest.query.trim());
                  return;
                }
              }
              if (e.key === 'Escape') {
                setSuggest((s) => ({ ...s, open: false }));
                return;
              }
            }
          }}
          onKeyUp={(e) => {
            const ta = e.currentTarget;
            updateSuggest(ta.value, ta.selectionStart ?? 0);
          }}
          onClick={(e) => {
            const ta = e.currentTarget;
            updateSuggest(ta.value, ta.selectionStart ?? 0);
          }}
          onBlur={() => setTimeout(() => setSuggest((s) => ({ ...s, open: false })), 150)}
          placeholder={'断片を書く…\n\nMarkdown記法が使えます。\n[[他の断片のタイトル]] で断片どうしをリンク、![[タイトル]] で埋め込み。\n==ハイライト== / #タグ / %%コメント%% / [^1] 脚注 も使えます。\n> [!note] でノート/warning/tip 等のCallout。'}
          className="absolute inset-0 w-full h-full p-6 resize-none bg-transparent focus:outline-none text-[15px] leading-relaxed text-gray-800 dark:text-gray-100 font-sans"
          spellCheck={false}
        />
        {suggest.open && (
          <div className="absolute left-6 bottom-4 min-w-[240px] bg-white dark:bg-dpurple-800 border border-violet-200 dark:border-dpurple-600 rounded-lg shadow-xl overflow-hidden z-10">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-violet-500 bg-violet-50 dark:bg-dpurple-900 dark:text-violet-300 border-b border-violet-100 dark:border-dpurple-700">
              リンク先の候補
            </div>
            {suggest.items.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Enter で「{suggest.query || '新しい断片'}」を作成
              </div>
            ) : (
              <ul className="max-h-56 overflow-y-auto">
                {suggest.items.map((t, i) => (
                  <li
                    key={t}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertSuggestion(t);
                    }}
                    className={[
                      'px-3 py-1.5 text-sm cursor-pointer',
                      i === suggest.index
                        ? 'bg-violet-100 dark:bg-dpurple-700 text-violet-900 dark:text-violet-50'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-dpurple-700',
                    ].join(' ')}
                  >
                    {t}
                  </li>
                ))}
                {suggest.query.trim() &&
                  !suggest.items.some((t) => t.toLowerCase() === suggest.query.trim().toLowerCase()) && (
                    <li
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertSuggestion(suggest.query.trim());
                      }}
                      className="px-3 py-1.5 text-sm cursor-pointer border-t border-violet-100 dark:border-dpurple-700 text-violet-700 dark:text-violet-200 hover:bg-violet-50 dark:hover:bg-dpurple-700 italic"
                    >
                      + 「{suggest.query.trim()}」を新規作成
                    </li>
                  )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
