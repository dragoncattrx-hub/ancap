import { Language } from "@/locales/translations";

const COUNTRY_TO_LANG: Record<string, Language> = {
  RU: "ru",
  BY: "ru",
  KZ: "ru",
  KG: "ru",
  TJ: "ru",
  UZ: "ru",
  AM: "ru",
  AZ: "ru",
  DE: "de",
  AT: "de",
  CH: "de",
  LI: "de",
  LU: "de",
  UA: "uk",
  TW: "zh-Hant",
  HK: "zh-Hant",
  MO: "zh-Hant",
};

const ACCEPT_LANGUAGE_TO_LANG: Array<{ prefix: string; lang: Language }> = [
  { prefix: "zh-hant", lang: "zh-Hant" },
  { prefix: "zh-tw", lang: "zh-Hant" },
  { prefix: "zh-hk", lang: "zh-Hant" },
  { prefix: "zh-mo", lang: "zh-Hant" },
  { prefix: "ru", lang: "ru" },
  { prefix: "uk", lang: "uk" },
  { prefix: "de", lang: "de" },
  { prefix: "en", lang: "en" },
];

function normalizeLanguageTag(value: string): Language | null {
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  if (normalized === "en" || normalized === "ru" || normalized === "uk" || normalized === "de") {
    return normalized;
  }
  if (
    normalized === "zh-hant" ||
    normalized === "zh-tw" ||
    normalized === "zh-hk" ||
    normalized === "zh-mo" ||
    normalized === "zh-hant-tw" ||
    normalized === "zh-hant-hk"
  ) {
    return "zh-Hant";
  }
  return null;
}

export function detectPreferredLanguage(input: {
  cookieLang?: string | null;
  countryCode?: string | null;
  acceptLanguage?: string | null;
}): Language {
  const fromCookie = normalizeLanguageTag(input.cookieLang || "");
  if (fromCookie) {
    return fromCookie;
  }

  const countryCode = (input.countryCode || "").trim().toUpperCase();
  if (countryCode && COUNTRY_TO_LANG[countryCode]) {
    return COUNTRY_TO_LANG[countryCode];
  }

  const acceptLanguage = (input.acceptLanguage || "").toLowerCase().replace(/_/g, "-");
  for (const candidate of ACCEPT_LANGUAGE_TO_LANG) {
    if (acceptLanguage.includes(candidate.prefix)) {
      return candidate.lang;
    }
  }

  return "en";
}
