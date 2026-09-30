type Language = "en" | "ru" | "uk" | "de" | "zh-Hant";
type Tree = { [key: string]: string | Tree };

export const marketRateBarByLang: Record<Language, Tree> = {
  en: {
    label: "Live spot",
    oneToOne: "1:1 wACP",
    gecko: "GeckoTerminal",
    legal: "Disclosure",
  },
  ru: {
    label: "Живой курс",
    oneToOne: "1:1 wACP",
    gecko: "GeckoTerminal",
    legal: "Раскрытие",
  },
  uk: {
    label: "Живий курс",
    oneToOne: "1:1 wACP",
    gecko: "GeckoTerminal",
    legal: "Розкриття",
  },
  de: {
    label: "Live-Kurs",
    oneToOne: "1:1 wACP",
    gecko: "GeckoTerminal",
    legal: "Hinweis",
  },
  "zh-Hant": {
    label: "即時匯率",
    oneToOne: "1:1 wACP",
    gecko: "GeckoTerminal",
    legal: "揭露",
  },
};
