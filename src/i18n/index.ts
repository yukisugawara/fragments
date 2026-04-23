import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ja from './ja.json';
import fragmentsEn from './fragments.en.json';
import fragmentsJa from './fragments.ja.json';

export const SUPPORTED_LANGUAGES = ['ja', 'en'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'fragments.lang';

function resolveInitialLanguage(): SupportedLang {
  // Always default to English. Only honour an explicit user choice saved
  // previously; browser locale is intentionally ignored so first-time
  // visitors land in the same (English) experience regardless of locale.
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
      return saved as SupportedLang;
    }
  } catch {
    // ignore (private mode / disabled storage)
  }
  return 'en';
}

// Merge the fragments-specific strings into each locale so components can
// use either namespace freely.
const merged = {
  en: { ...en, ...fragmentsEn },
  ja: { ...ja, ...fragmentsJa },
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: merged.en },
    ja: { translation: merged.ja },
  },
  lng: resolveInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function setLanguage(lang: SupportedLang) {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

export default i18n;
