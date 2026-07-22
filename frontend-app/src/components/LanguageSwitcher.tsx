"use client";

import { useLanguage } from "./LanguageProvider";
import { useEffect, useState } from "react";
import type { Language } from "@/locales/translations";

const LANG_BUTTONS: ReadonlyArray<{ code: Language; label: string }> = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "uk", label: "UK" },
  { code: "de", label: "DE" },
  { code: "zh-Hant", label: "繁中" },
];

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
      {LANG_BUTTONS.map((opt, idx) => (
        <span key={opt.code} className="inline-flex items-center gap-1">
          {idx > 0 ? <span>/</span> : null}
          <button
            type="button"
            onClick={() => setLang(opt.code)}
            className={mounted && lang === opt.code ? "active" : ""}
          >
            {opt.label}
          </button>
        </span>
      ))}
    </div>
  );
}
