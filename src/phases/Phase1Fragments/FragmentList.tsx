import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFragmentsStore } from '../../store/useFragmentsStore';
import { importMarkdownFiles } from '../../utils/fragmentImport';
import { loadSampleFromUrl } from '../../utils/sampleLoader';

const SAMPLE_URL = `${import.meta.env.BASE_URL}samples/climate-ethnography.json`;

export function FragmentList() {
  const { t } = useTranslation();
  const fragments = useFragmentsStore((s) => s.fragments);
  const activeId = useFragmentsStore((s) => s.activeFragmentId);
  const setActive = useFragmentsStore((s) => s.setActiveFragmentId);
  const createFragment = useFragmentsStore((s) => s.createFragment);
  const deleteFragment = useFragmentsStore((s) => s.deleteFragment);

  const [query, setQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImporting(true);
    try {
      await importMarkdownFiles(files);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleLoadSample = async () => {
    setImporting(true);
    try {
      await loadSampleFromUrl(SAMPLE_URL);
    } catch (err) {
      alert(
        t('dataMenu.toast.loadFail', {
          message: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setImporting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...fragments].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter(
      (f) => f.title.toLowerCase().includes(q) || f.content.toLowerCase().includes(q)
    );
  }, [fragments, query]);

  return (
    <div className="h-full flex flex-col bg-cream-50 dark:bg-dpurple-900/60 border-r border-violet-200/60 dark:border-dpurple-700/60">
      <div className="pt-14 px-3 pb-3 border-b border-violet-200/60 dark:border-dpurple-700/60 space-y-2">
        <button
          onClick={() => createFragment(t('phase1.placeholderTitle'))}
          className="w-full px-3 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-sm active:scale-95 transition-all"
        >
          {t('phase1.newFragment')}
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-dpurple-800 text-violet-700 dark:text-violet-100 border border-violet-200 dark:border-dpurple-600 rounded-lg hover:bg-violet-50 dark:hover:bg-dpurple-700 disabled:opacity-50"
            title={t('phase1.filesTooltip')}
          >
            {t('phase1.files')}
          </button>
          <button
            onClick={() => folderInputRef.current?.click()}
            disabled={importing}
            className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-dpurple-800 text-violet-700 dark:text-violet-100 border border-violet-200 dark:border-dpurple-600 rounded-lg hover:bg-violet-50 dark:hover:bg-dpurple-700 disabled:opacity-50"
            title={t('phase1.folderTooltip')}
          >
            {t('phase1.folder')}
          </button>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('phase1.search')}
          className="w-full px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-dpurple-800 border border-violet-200 dark:border-dpurple-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:text-gray-100"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />
      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        onChange={handleFilesSelected}
        // @ts-expect-error webkitdirectory is non-standard
        webkitdirectory=""
        directory=""
      />

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 && (
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-6 px-2 leading-relaxed whitespace-pre-line">
            {fragments.length === 0 ? (
              <>
                {t('phase1.emptyNoFragments')}
                <br />
                <span className="block mt-2">{t('phase1.emptyHint')}</span>
                <button
                  onClick={handleLoadSample}
                  disabled={importing}
                  className="mt-3 px-3 py-1.5 text-xs bg-violet-100 dark:bg-dpurple-800 text-violet-700 dark:text-violet-100 rounded-lg hover:bg-violet-200 dark:hover:bg-dpurple-700 disabled:opacity-50"
                >
                  {t('phase1.emptyLoadSample')}
                </button>
              </>
            ) : (
              t('phase1.noResults')
            )}
          </div>
        )}
        {filtered.map((f) => {
          const active = f.id === activeId;
          const preview = f.content.replace(/[#*_`>\n]/g, ' ').trim().slice(0, 60);
          return (
            <div
              key={f.id}
              onClick={() => setActive(f.id)}
              className={[
                'group cursor-pointer rounded-lg px-3 py-2 transition-colors',
                active
                  ? 'bg-violet-100 dark:bg-dpurple-700 ring-1 ring-violet-300 dark:ring-dpurple-500'
                  : 'hover:bg-violet-50 dark:hover:bg-dpurple-800/60',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-violet-900 dark:text-violet-50 truncate">
                    {f.title}
                  </div>
                  {preview && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {preview}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t('phase1.deleteConfirm', { title: f.title }))) deleteFragment(f.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-xs text-rose-500 hover:text-rose-600 shrink-0 px-1"
                  aria-label={t('phase1.delete')}
                  title={t('phase1.delete')}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
