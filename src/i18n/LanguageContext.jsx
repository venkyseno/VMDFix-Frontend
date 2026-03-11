import { createContext, useContext, useState, useCallback } from "react";
import en from "./en.json";
import te from "./te.json";

const translations = { en, te };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("app_lang") || "en");

  const switchLang = useCallback((code) => {
    setLang(code);
    localStorage.setItem("app_lang", code);
  }, []);

  const t = useCallback(
    (key, fallback) => {
      const dict = translations[lang] || translations.en;
      return dict[key] ?? fallback ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used inside LanguageProvider");
  return ctx;
}
