"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, isSupportedLanguage, t as translate } from "@/locales/translations";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);
const LANG_STORAGE_KEY = "ancap-lang-v3";
const LANG_COOKIE_KEY = "ancap-lang";

function persistLanguage(lang: Language) {
  safeSetItem(LANG_STORAGE_KEY, lang);
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.cookie = `${LANG_COOKIE_KEY}=${lang}; path=/; max-age=31536000; samesite=lax`;
  }
}

export function LanguageProvider({ children, initialLang = "en" }: { children: React.ReactNode; initialLang?: Language }) {
  const [lang, setLangState] = useState<Language>(initialLang);

  useEffect(() => {
    const stored = safeGetItem(LANG_STORAGE_KEY) as Language;
    if (isSupportedLanguage(stored)) {
      setLangState(stored);
      persistLanguage(stored);
      return;
    }

    persistLanguage(initialLang);
  }, [initialLang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    persistLanguage(newLang);
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
