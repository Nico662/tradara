import { createContext, useContext, useState } from 'react';
import { LANGS } from './i18n';

export const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en');
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