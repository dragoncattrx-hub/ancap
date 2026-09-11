export type ProjectNewsItem = {
  id: string;
  date: string;
  title: string;
  summary: string;
  href: string;
};

/** Последние новости проекта ANCAP (RU). */
export const PROJECT_NEWS_RU: ProjectNewsItem[] = [
  {
    id: "dna-rna-bank",
    date: "2026-09-11",
    title: "Цифровой банк ДНК и РНК",
    summary:
      "Отдельный сейф /dna-bank: метаданные ДНК/РНК at-rest AES-256-GCM + HKDF-SHA384 (v1). Полные геномы не принимаются.",
    href: "/dna-bank",
  },
  {
    id: "ancap-ai-agency",
    date: "2026-09-11",
    title: "ANCAP AI Agency",
    summary:
      "Отдельное рекламное агентство для ИИ-сектора: кампании, креативы, Telegram/X/email и proof-backed spend. Блок на главной и /agency.",
    href: "/agency",
  },
  {
    id: "ancap-promo-2026-09",
    date: "2026-09-11",
    title: "ANCAP: AI-native capital allocation",
    summary:
      "Платные AI-workflow, ACP wallet, Digital Passport, bridge wACP/sACP. Старт: token snapshot, каталог workflows, /passport.",
    href: "/",
  },
  {
    id: "passport-education-docs",
    date: "2026-09-11",
    title: "Паспорт: документы об образовании",
    summary:
      "Дипломы и сертификаты в Digital Passport — at-rest ChaCha20-Poly1305 (v2). UI /passport, API education-docs.",
    href: "/passport",
  },
  {
    id: "crypto-benchmark",
    date: "2026-09-10",
    title: "Crypto Benchmark Scorecard",
    summary:
      "Открытый QOBLIB-стиль scorecard для ACP/wACP/sACP: публичные baselines и live-измерения на /reserves.",
    href: "/reserves",
  },
  {
    id: "embodied-security",
    date: "2026-09-10",
    title: "Безопасность embodied AI",
    summary:
      "Адаптеры UnifoLM выключены по умолчанию. Реестр моделей и политика изоляции от ключей ACP.",
    href: "/reserves",
  },
  {
    id: "lunar-desk",
    date: "2026-09-10",
    title: "Lunar Land desk",
    summary:
      "Каталог селенографических участков с научными темами NASA–IBM LFM и ACP interest desk.",
    href: "/lunar",
  },
  {
    id: "bridge-deposit-scan",
    date: "2026-09-10",
    title: "Мост ACP→wACP: депозиты",
    summary:
      "Инкрементальный сканер депозитов ускоряет выход из PENDING_DEPOSIT и догоняет tip цепочки.",
    href: "/bridge/acp-bsc",
  },
  {
    id: "bridge-cancel-requeue",
    date: "2026-09-10",
    title: "Отмена и requeue mint",
    summary:
      "Пользователи могут отменить неоплаченные intents; операторы — requeue FAILED mint.",
    href: "/bridge/acp-bsc",
  },
  {
    id: "markets-matrix",
    date: "2026-09-09",
    title: "Матрица листингов wACP",
    summary:
      "Опубликована полная free-placement матрица для wACP на рынках и агрегаторах.",
    href: "/markets",
  },
  {
    id: "coingecko-ticker",
    date: "2026-09-09",
    title: "CoinGecko маркет-тикер",
    summary:
      "На главной — живая лента цен через CoinGecko рядом с рельсами ACP/wACP.",
    href: "/",
  },
  {
    id: "dextools-live",
    date: "2026-09-09",
    title: "DexTools и контракт",
    summary:
      "DexTools отмечен live; задокументирован CA для Coin/DexTools форм и доверия к адресу.",
    href: "/docs/wacp/contracts",
  },
];
