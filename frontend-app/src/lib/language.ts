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
};

const ACCEPT_LANGUAGE_TO_LANG: Array<{ prefix: string; lang: Language }> = [
  { prefix: "ru", lang: "ru" },
  { prefix: "uk", lang: "uk" },
  { prefix: "de", lang: "de" },
  { prefix: "en", lang: "en" },
];

export function detectPreferredLanguage(input: {
  cookieLang?: string | null;
  countryCode?: string | null;
  acceptLanguage?: string | null;
}): Language {
  const cookieLang = (input.cookieLang || "").trim().toLowerCase();
  if (cookieLang === "ru" || cookieLang === "uk" || cookieLang === "de" || cookieLang === "en") {
    return cookieLang;
  }

  const countryCode = (input.countryCode || "").trim().toUpperCase();
  if (countryCode && COUNTRY_TO_LANG[countryCode]) {
    return COUNTRY_TO_LANG[countryCode];
  }

  const acceptLanguage = (input.acceptLanguage || "").toLowerCase();
  for (const candidate of ACCEPT_LANGUAGE_TO_LANG) {
    if (acceptLanguage.includes(candidate.prefix)) {
      return candidate.lang;
    }
  }

  return "en";
}
