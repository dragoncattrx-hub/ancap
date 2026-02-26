"use client";

import { useLanguage } from "./LanguageProvider";

export function LanguageSwitcher() {
  const { language, switchLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => switchLanguage("en")}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          language === "en"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchLanguage("ru")}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          language === "ru"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`}
      >
        RU
      </button>
    </div>
  );
}
