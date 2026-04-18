import { createContext, useContext, useState, useEffect } from 'react';
import id from './translations/id.js';
import en from './translations/en.js';

const translations = { id, en };
const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'id');

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (key) => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) {
      val = val?.[k];
    }
    return val || key;
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLang: changeLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
