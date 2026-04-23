import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadSampleFromUrl, clearAllData } from '../utils/sampleLoader';
import { importMarkdownFiles, type ImportReport } from '../utils/fragmentImport';
import { downloadProjectFile, importProjectFile, projectSummary } from '../utils/projectIO';
import { useFragmentsStore } from '../store/useFragmentsStore';
import { setLanguage, SUPPORTED_LANGUAGES, type SupportedLang } from '../i18n';

const SAMPLE_URL = `${import.meta.env.BASE_URL}samples/climate-ethnography.json`;

export function DataMenu() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const setActivePhase = useFragmentsStore((s) => s.setActivePhase);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const closeMenu = () => setOpen(false);

  const loadSample = async () => {
    closeMenu();
    setBusy(t('dataMenu.items.loadSample'));
    try {
      const bundle = await loadSampleFromUrl(SAMPLE_URL);
      setToast(
        t('dataMenu.toast.sampleLoaded', { title: bundle.title, count: bundle.fragments.length })
      );
      setActivePhase(1);
    } catch (e) {
      setToast(t('dataMenu.toast.loadFail', { message: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusy(null);
    }
  };

  const clearAll = () => {
    closeMenu();
    if (!confirm(t('dataMenu.confirm.clear'))) return;
    clearAllData();
    setToast(t('dataMenu.toast.cleared'));
  };

  const pickFiles = () => {
    closeMenu();
    fileInputRef.current?.click();
  };

  const pickFolder = () => {
    closeMenu();
    folderInputRef.current?.click();
  };

  const saveProject = () => {
    closeMenu();
    const name = prompt(t('dataMenu.prompt.saveName'), 'fragments-project');
    if (name === null) return;
    const fileName = downloadProjectFile(name);
    setToast(t('dataMenu.toast.projectSaved', { name: fileName }));
  };

  const pickProject = () => {
    closeMenu();
    projectInputRef.current?.click();
  };

  const onProjectFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!confirm(t('dataMenu.confirm.loadProject', { name: file.name }))) {
      e.target.value = '';
      return;
    }
    setBusy(t('dataMenu.items.loadProject'));
    try {
      const bundle = await importProjectFile(file);
      setToast(
        t('dataMenu.toast.projectLoaded', { summary: projectSummary(bundle) })
      );
      setActivePhase(1);
    } catch (err) {
      setToast(t('dataMenu.toast.loadFail', { message: err instanceof Error ? err.message : String(err) }));
    } finally {
      setBusy(null);
      e.target.value = '';
    }
  };

  const onFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBusy(t('dataMenu.items.importFiles'));
    try {
      const report = await importMarkdownFiles(files);
      setToast(summarizeReport(report, t));
      setActivePhase(1);
    } catch (err) {
      setToast(t('dataMenu.toast.loadFail', { message: err instanceof Error ? err.message : String(err) }));
    } finally {
      setBusy(null);
      e.target.value = '';
    }
  };

  const currentLang = i18n.language as SupportedLang;

  return (
    <>
      <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/90 dark:bg-dpurple-900/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.05)] ring-[0.5px] ring-black/10 dark:ring-white/10 rounded-full text-[13px] font-medium text-gray-800 dark:text-gray-100 hover:bg-white dark:hover:bg-dpurple-800 transition-colors"
            aria-haspopup="menu"
            aria-expanded={open}
            title={t('dataMenu.button')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 3.5h10M3 8h10M3 12.5h10" />
            </svg>
            {t('dataMenu.button')}
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={closeMenu} aria-hidden />
              <div
                role="menu"
                className="absolute top-[110%] left-0 w-72 bg-white/95 dark:bg-dpurple-900/95 backdrop-blur-xl rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.12)] ring-[0.5px] ring-black/10 dark:ring-white/10 py-1 animate-fade-in"
              >
                <MenuSection label={t('dataMenu.sections.project')}>
                  <MenuItem onClick={saveProject} icon="💾" title={t('dataMenu.items.saveProject')}
                    description={t('dataMenu.items.saveProjectDesc')} />
                  <MenuItem onClick={pickProject} icon="📦" title={t('dataMenu.items.loadProject')}
                    description={t('dataMenu.items.loadProjectDesc')} />
                </MenuSection>
                <MenuSection label={t('dataMenu.sections.sample')}>
                  <MenuItem onClick={loadSample} icon="📚" title={t('dataMenu.items.loadSample')}
                    description={t('dataMenu.items.loadSampleDesc')} />
                </MenuSection>
                <MenuSection label={t('dataMenu.sections.import')}>
                  <MenuItem onClick={pickFiles} icon="📄" title={t('dataMenu.items.importFiles')} />
                  <MenuItem onClick={pickFolder} icon="📁" title={t('dataMenu.items.importFolder')} />
                </MenuSection>
                <MenuSection label={t('dataMenu.sections.language')}>
                  <div className="px-3 py-1.5 flex gap-1">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const active = currentLang === lang || currentLang.startsWith(lang);
                      return (
                        <button
                          key={lang}
                          onClick={() => {
                            setLanguage(lang);
                            closeMenu();
                          }}
                          className={[
                            'flex-1 px-2 py-1.5 text-xs rounded-md transition-colors',
                            active
                              ? 'bg-violet-600 text-white'
                              : 'bg-cream-50 dark:bg-dpurple-800 text-violet-700 dark:text-violet-100 hover:bg-violet-100 dark:hover:bg-dpurple-700',
                          ].join(' ')}
                        >
                          {t(`dataMenu.${lang}`)}
                        </button>
                      );
                    })}
                  </div>
                </MenuSection>
                <MenuSection label={t('dataMenu.sections.other')}>
                  <MenuItem onClick={clearAll} icon="🗑" danger title={t('dataMenu.items.clear')} />
                </MenuSection>
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          multiple
          className="hidden"
          onChange={onFilesSelected}
        />
        <input
          ref={folderInputRef}
          type="file"
          className="hidden"
          onChange={onFilesSelected}
          // @ts-expect-error non-standard attributes for folder picker
          webkitdirectory=""
          directory=""
        />
        <input
          ref={projectInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onProjectFileSelected}
        />

      {busy && (
        <div className="fixed top-16 left-3 z-50 bg-violet-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg animate-fade-in">
          {busy}
        </div>
      )}
      {toast && !busy && (
        <div className="fixed top-16 left-3 z-50 bg-white dark:bg-dpurple-900 text-sm px-3 py-2 rounded-lg shadow-lg ring-1 ring-violet-200 dark:ring-dpurple-600 text-violet-900 dark:text-violet-50 animate-fade-in max-w-[360px]">
          {toast}
        </div>
      )}
    </>
  );
}

function summarizeReport(r: ImportReport, t: (k: string, opts?: Record<string, unknown>) => string): string {
  const parts: string[] = [];
  if (r.imported > 0) parts.push(t('dataMenu.toast.importDone', { imported: r.imported }));
  if (r.skipped > 0) parts.push(t('dataMenu.toast.importSkipped', { count: r.skipped }));
  if (r.errors.length > 0) parts.push(t('dataMenu.toast.importErrors', { count: r.errors.length }));
  if (parts.length === 0) return t('dataMenu.toast.importEmpty');
  return parts.join(' / ');
}

function MenuSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-400 dark:text-violet-300/60">
        {label}
      </div>
      {children}
    </div>
  );
}

function MenuItem({
  onClick,
  title,
  description,
  icon,
  danger,
}: {
  onClick: () => void;
  title: string;
  description?: string;
  icon?: string;
  danger?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={[
        'w-full text-left px-3 py-2 text-sm flex items-start gap-2 transition-colors',
        danger
          ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-dpurple-800'
          : 'text-gray-800 dark:text-gray-100 hover:bg-violet-50 dark:hover:bg-dpurple-800',
      ].join(' ')}
    >
      {icon && <span className="shrink-0 w-5 text-center">{icon}</span>}
      <span className="flex-1">
        {title}
        {description && (
          <span className="block text-[10px] text-gray-500 dark:text-gray-400">{description}</span>
        )}
      </span>
    </button>
  );
}
