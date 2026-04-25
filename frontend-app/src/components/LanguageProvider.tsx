"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, t as translate } from "@/locales/translations";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);
const LANG_STORAGE_KEY = "ancap-lang-v2";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const stored = safeGetItem(LANG_STORAGE_KEY) as Language;
    if (stored === "en" || stored === "ru" || stored === "uk") {
      setLangState(stored);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    safeSetItem(LANG_STORAGE_KEY, newLang);
  };

  const t = (key: string) => translate(lang, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}