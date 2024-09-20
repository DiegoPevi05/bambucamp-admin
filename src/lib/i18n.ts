// src/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi) // Load translations using http
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/translation.json'  // Path to load translations
    },
    fallbackLng: 'es', // Fallback language if detection fails
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
