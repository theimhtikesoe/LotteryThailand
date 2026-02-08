import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import th from './locales/th.json';
import my from './locales/my.json';

// Get stored language or default to Thai
const storedLang = typeof window !== 'undefined' ? localStorage.getItem('language') : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      th: { translation: th },
      my: { translation: my }
    },
    lng: storedLang || 'th',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;