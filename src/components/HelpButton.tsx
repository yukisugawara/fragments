import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpOverlay } from './HelpOverlay';

export function HelpButton() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const lang = i18n.language.startsWith('ja') ? 'ja' : 'en';
  const label = lang === 'ja' ? 'ヘルプ／設計思想' : 'Manual / Philosophy';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-9 h-9 bg-white/90 dark:bg-dpurple-900/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.05)] ring-[0.5px] ring-black/10 dark:ring-white/10 rounded-full text-gray-700 dark:text-gray-100 hover:bg-white dark:hover:bg-dpurple-800 transition-colors font-semibold text-[15px]"
        title={label}
        aria-label={label}
      >
        ?
      </button>
      {open && <HelpOverlay onClose={() => setOpen(false)} />}
    </>
  );
}
