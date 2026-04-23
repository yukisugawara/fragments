import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';

export function TopRightCluster() {
  const { i18n } = useTranslation();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ja' ? 'en' : 'ja');
  };

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-2 py-1 bg-white/90 dark:bg-dpurple-900/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.05)] ring-[0.5px] ring-black/10 dark:ring-white/10 rounded-full select-none">
      <button
        type="button"
        onClick={toggleTheme}
        className="w-7 h-7 flex items-center justify-center rounded-full text-[13px] text-gray-700 dark:text-gray-100 hover:bg-violet-100 dark:hover:bg-dpurple-700 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        title={theme === 'light' ? 'ダークモード' : 'ライトモード'}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? '☽' : '☀'}
      </button>
      <button
        type="button"
        onClick={toggleLanguage}
        className="px-2 h-7 flex items-center justify-center rounded-full text-[11px] font-bold text-violet-700 dark:text-violet-200 bg-violet-50 dark:bg-dpurple-800 hover:bg-violet-100 dark:hover:bg-dpurple-700 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        title={i18n.language === 'ja' ? 'Switch to English' : '日本語に切り替え'}
        aria-label={i18n.language === 'ja' ? 'Switch to English' : 'Switch to Japanese'}
      >
        {i18n.language === 'ja' ? 'EN' : 'JA'}
      </button>
    </div>
  );
}
