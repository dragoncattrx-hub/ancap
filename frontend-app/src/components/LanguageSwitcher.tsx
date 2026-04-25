"use client";

import { useLanguage } from "./LanguageProvider";
import { useEffect, useState } from "react";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show active state during SSR/hydration to avoid mismatch
  // After hydration completes, show the correct active state
  return (
    <div className="lang-toggle">
      <button
        onClick={() => setLang("en")}
        className={mounted && lang === "en" ? "active" : ""}
      >
        EN
      </button>
      <span>/</span>
      <button
        onClick={() => setLang("ru")}
        className={mounted && lang === "ru" ? "active" : ""}
      >
        RU
      </button>
      <span>/</span>
      <button
        onClick={() => setLang("uk")}
        className={mounted && lang === "uk" ? "active" : ""}
      >
        UK
      </button>
    </div>
  );
}
