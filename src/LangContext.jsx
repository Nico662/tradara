import { createContext, useContext, useState } from 'react';
import { LANGS } from './i18n';

export const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('tradara_lang');
    if (saved && LANGS[saved]) return saved;
    const browser = navigator.language?.slice(0, 2).toLowerCase();
    return browser === 'es' ? 'es' : 'en';
  });

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem('tradara_lang', l);
  };

  const t = LANGS[lang];
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}