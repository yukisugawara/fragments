import { useMemo, useState } from 'react';
import { useFragmentsStore, type FragmentImage } from '../store/useFragmentsStore';
import { useAppStore } from '../store/useAppStore';

interface Props {
  onClose: () => void;
}

const IMAGE_EMBED_RE = /!\[\[([^\[\]\n|]+?\.(?:png|jpe?g|gif|webp|svg|bmp|avif))(?:\|[^\[\]\n]+)?\]\]/gi;

function extFromName(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? 'png';
}

function fileIdForImage(imageId: string): string {
  return `fragimg-${imageId}`;
}

function collectImageRefs(content: string, imageMap: Map<string, FragmentImage>): FragmentImage[] {
  const found = new Map<string, FragmentImage>();
  for (const m of content.matchAll(IMAGE_EMBED_RE)) {
    const name = m[1].trim().toLowerCase();
    const img = imageMap.get(name);
    if (img && !found.has(img.id)) found.set(img.id, img);
  }
  return Array.from(found.values());
}

export function FragmentImportModal({ onClose }: Props) {
  const fragments = useFragmentsStore((s) => s.fragments);
  const images = useFragmentsStore((s) => s.images);
  const files = useAppStore((s) => s.files);
  const addFile = useAppStore((s) => s.addFile);

  const imageMap = useMemo(
    () => new Map(images.map((i) => [i.name.toLowerCase(), i])),
    [images],
  );

  const alreadyImportedIds = useMemo(
    () =>
      new Set(
        files
          .map((f) => f.id)
          .filter((id) => id.startsWith('frag-')) // fragment-sourced files share the fragment id prefix
      ),
    [files]
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...fragments].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter(
      (f) => f.title.toLowerCase().includes(q) || f.content.toLowerCase().includes(q)
    );
  }, [fragments, query]);

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const existingFileIds = useMemo(() => new Set(files.map((f) => f.id)), [files]);

  const importFragment = (fragmentId: string) => {
    const f = fragments.find((x) => x.id === fragmentId);
    if (!f) return;
    if (!existingFileIds.has(f.id)) {
      addFile({
        id: f.id,
        fileName: `${f.title}.md`,
        fileContent: f.content,
        fileType: 'md',
        fileDataUrl: null,
      });
    }
    // Also bring in any images referenced via ![[image.png]]
    for (const img of collectImageRefs(f.content, imageMap)) {
      const fid = fileIdForImage(img.id);
      if (existingFileIds.has(fid)) continue;
      addFile({
        id: fid,
        fileName: img.name,
        fileContent: `[Image] ${img.name}`,
        fileType: extFromName(img.name),
        fileDataUrl: img.dataUrl,
      });
    }
  };

  const importSelected = () => {
    for (const id of selected) importFragment(id);
    onClose();
  };

  const importAll = () => {
    const unimported = fragments.filter((f) => !alreadyImportedIds.has(f.id));
    for (const f of unimported) importFragment(f.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-dpurple-900 rounded-2xl shadow-2xl w-[560px] max-h-[80vh] flex flex-col overflow-hidden animate-scale-in"
      >
        <div className="px-5 py-3 border-b border-violet-200 dark:border-dpurple-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-violet-900 dark:text-violet-50">
              断片をQDA分析に取り込む
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              選択した断片を分析対象ファイルとして追加します
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 text-xl leading-none px-2"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-2 border-b border-violet-100 dark:border-dpurple-700">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="検索..."
            className="w-full px-3 py-1.5 text-sm rounded-lg bg-cream-50 dark:bg-dpurple-800 border border-violet-200 dark:border-dpurple-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:text-gray-100"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-8">
              {fragments.length === 0
                ? 'フェーズ1でまず断片をつくってください'
                : '該当する断片がありません'}
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((f) => {
                const imported = alreadyImportedIds.has(f.id);
                const checked = selected.has(f.id);
                return (
                  <li key={f.id}>
                    <label
                      className={[
                        'flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                        imported
                          ? 'bg-cream-100 dark:bg-dpurple-800/50 opacity-60 cursor-not-allowed'
                          : checked
                          ? 'bg-violet-100 dark:bg-dpurple-700'
                          : 'hover:bg-violet-50 dark:hover:bg-dpurple-800',
                      ].join(' ')}
                    >
                      <input
                        type="checkbox"
                        disabled={imported}
                        checked={checked}
                        onChange={() => toggle(f.id)}
                        className="mt-1 accent-violet-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-violet-900 dark:text-violet-50 truncate">
                          {f.title}
                          {imported && (
                            <span className="ml-2 text-[10px] text-gray-500 font-normal">
                              （取り込み済み）
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {f.content.replace(/[#*_`>\n]/g, ' ').trim().slice(0, 80) || '（空）'}
                        </div>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 border-t border-violet-200 dark:border-dpurple-700 flex items-center justify-between bg-cream-50 dark:bg-dpurple-900/60">
          <button
            onClick={importAll}
            className="text-xs text-violet-700 dark:text-violet-200 hover:underline"
            disabled={fragments.length === 0}
          >
            すべて取り込む（未取込のみ）
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dpurple-700 rounded-lg"
            >
              キャンセル
            </button>
            <button
              onClick={importSelected}
              disabled={selected.size === 0}
              className="px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              選択した {selected.size} 件を取り込む
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

