type Language = "en" | "ru" | "uk" | "de" | "zh-Hant";
type Tree = { [key: string]: string | Tree };

export const entertainmentByLang: Record<Language, Tree> = {
  en: {
    heroKicker: "Legal entertainment desk",
    heroTitle: "ANCAP",
    heroLead: "Legal entertainment worldwide — venues, festivals, and regulated play that publish a license.",
    heroBody:
      "One map for culture, sport, tourism, and on-platform Arena. Grey-market books and unlicensed gambling are out of scope.",
    browseRegions: "Browse by region",
    openArena: "Open Arena",
    legalHub: "Legal hub",
    mapKicker: "Region filter",
    mapTitle: "Pick a geography, keep the license trail",
    complianceTitle: "Compliance posture",
    complianceBody:
      "This desk is a discovery map, not legal advice. Operators must hold a local license where required; players must meet age and residency rules. ANCAP does not broker illegal wagering or unlicensed offshore books. On-platform play settles in ACP via Arena under published house rules.",
    arenaGames: "Arena games",
    complianceCta: "Compliance",
    eventCover: "Event cover desk",
    tcpKicker: "Featured · Tesla coil · licensed venue",
    tcpTitle: "Tesla-coil party with complimentary Jack Daniel's hospitality literacy",
    tcpPrice: "8,900 ACP",
    tcpLead:
      "ACP-settled brief for a licensed entertainment venue: high-voltage Tesla-coil spectacle literacy plus complimentary whiskey hospitality framing where the partner holds a liquor licence. Jurisdiction-permitted adult substances only — never grey-market supply.",
    tcpDisclaimer:
      "Not affiliated with Jack Daniel's or Brown-Forman. ANCAP does not sell alcohol or controlled substances and does not hold a liquor licence. Age/ID gates (18+/21+ by jurisdiction) apply. Tesla coil HV is operated only by a licensed venue partner — not a DIY kit and not a guaranteed show outcome. Free whiskey copy is venue hospitality literacy where licensed, not an ANCAP bar.",
    tcpCta: "Open Tesla-coil party brief",
    tcpLegalCta: "Tesla-coil party legal notice",
  },
  ru: {
    heroKicker: "Стол легальных развлечений",
    heroTitle: "ANCAP",
    heroLead: "Легальные развлечения по миру — площадки, фестивали и регулируемая игра с опубликованной лицензией.",
    heroBody:
      "Одна карта культуры, спорта, туризма и on-platform Arena. Серые букмекеры и безлицензионный гемблинг вне скоупа.",
    browseRegions: "Смотреть по регионам",
    openArena: "Открыть Arena",
    legalHub: "Юр. центр",
    mapKicker: "Фильтр региона",
    mapTitle: "Выберите географию, сохраните след лицензии",
    complianceTitle: "Комплаенс-поза",
    complianceBody:
      "Этот стол — карта discovery, не юрсовет. Операторы должны иметь местную лицензию; игроки — возраст и резиденцию. ANCAP не брокер незаконных ставок. On-platform play в ACP через Arena.",
    arenaGames: "Игры Arena",
    complianceCta: "Комплаенс",
    eventCover: "Страхование событий",
    tcpKicker: "Избранное · катушка Теслы · лицензированная площадка",
    tcpTitle: "Вечеринка с катушкой Теслы и бесплатным Jack Daniel's (hospitality площадки)",
    tcpPrice: "8 900 ACP",
    tcpLead:
      "ACP-бриф для лицензированной развлекательной площадки: грамотность HV-шоу катушки Теслы и complimentary whiskey там, где у партнёра есть алкогольная лицензия. Только вещества, разрешённые для взрослых в юрисдикции.",
    tcpDisclaimer:
      "Не аффилировано с Jack Daniel's / Brown-Forman. ANCAP не продаёт алкоголь и контролируемые вещества и не имеет алкогольной лицензии. Возраст/ID 18+/21+. HV катушки — только у лицензированного партнёра. Бесплатный виски — hospitality literacy площадки, не бар ANCAP.",
    tcpCta: "Открыть бриф пати с катушкой Теслы",
    tcpLegalCta: "Юр. текст: пати с катушкой Теслы",
  },
  uk: {
    heroKicker: "Стіл легальних розваг",
    heroTitle: "ANCAP",
    heroLead: "Легальні розваги світом — майданчики, фестивалі й регульована гра з опублікованою ліцензією.",
    heroBody:
      "Одна мапа культури, спорту, туризму та on-platform Arena. Сірі букмекери поза скоупом.",
    browseRegions: "Дивитися за регіонами",
    openArena: "Відкрити Arena",
    legalHub: "Юр. центр",
    mapKicker: "Фільтр регіону",
    mapTitle: "Оберіть географію, збережіть слід ліцензії",
    complianceTitle: "Комплаєнс-позиція",
    complianceBody:
      "Цей стіл — карта discovery, не юрпорада. Оператори мають місцеву ліцензію; гравці — вік і резиденцію. ANCAP не брокер незаконних ставок.",
    arenaGames: "Ігри Arena",
    complianceCta: "Комплаєнс",
    eventCover: "Страхування подій",
    tcpKicker: "Обране · котушка Тесли · ліцензований майданчик",
    tcpTitle: "Вечірка з котушкою Тесли та безкоштовним Jack Daniel's (hospitality майданчика)",
    tcpPrice: "8 900 ACP",
    tcpLead:
      "ACP-бріф для ліцензованого розважального майданчика: грамотність HV-шоу та whiskey hospitality там, де партнер має алкогольну ліцензію. Лише речовини, дозволені для дорослих у юрисдикції.",
    tcpDisclaimer:
      "Не афілійовано з Jack Daniel's / Brown-Forman. ANCAP не продає алкоголь і контрольовані речовини. Вік/ID 18+/21+. HV — лише у ліцензованого партнера. Безкоштовний віскі — hospitality literacy майданчика.",
    tcpCta: "Відкрити бріф паті з котушкою Тесли",
    tcpLegalCta: "Юр. текст: паті з котушкою Тесли",
  },
  de: {
    heroKicker: "Legal-Entertainment-Desk",
    heroTitle: "ANCAP",
    heroLead: "Legale Unterhaltung weltweit — Venues, Festivals und reguliertes Play mit veröffentlichter Lizenz.",
    heroBody:
      "Eine Karte für Kultur, Sport, Tourismus und on-platform Arena. Graue Bücher und unlizenzierte Wetten sind out of scope.",
    browseRegions: "Nach Region browsen",
    openArena: "Arena öffnen",
    legalHub: "Legal-Hub",
    mapKicker: "Regionsfilter",
    mapTitle: "Geografie wählen, Lizenzspur behalten",
    complianceTitle: "Compliance-Haltung",
    complianceBody:
      "Dieser Desk ist eine Discovery-Karte, keine Rechtsberatung. Betreiber brauchen lokale Lizenzen; Spieler Alter/Residenz. ANCAP vermittelt keine illegalen Wetten.",
    arenaGames: "Arena-Spiele",
    complianceCta: "Compliance",
    eventCover: "Event-Cover-Desk",
    tcpKicker: "Featured · Teslaspule · lizenziertes Venue",
    tcpTitle: "Teslaspulen-Party mit complimentary Jack Daniel's Hospitality-Literacy",
    tcpPrice: "8.900 ACP",
    tcpLead:
      "ACP-Brief für ein lizenziertes Entertainment-Venue: HV-Teslaspulen-Show-Literacy plus complimentary Whiskey-Hospitality, wo der Partner eine Schanklizenz hat. Nur jurisdiction-permitted adult substances.",
    tcpDisclaimer:
      "Nicht affiliated mit Jack Daniel's / Brown-Forman. ANCAP verkauft keinen Alkohol und keine kontrollierten Substanzen und hält keine Schanklizenz. Alters-/ID-Gates 18+/21+. HV nur durch lizenzierten Venue-Partner. Free whiskey = Venue-Hospitality-Literacy.",
    tcpCta: "Teslaspulen-Party-Brief öffnen",
    tcpLegalCta: "Rechtshinweis Teslaspulen-Party",
  },
  "zh-Hant": {
    heroKicker: "合法娛樂服務台",
    heroTitle: "ANCAP",
    heroLead: "全球合法娛樂——公布執照的場館、節慶與受監管遊樂。",
    heroBody: "文化、運動、旅遊與平台 Arena 一圖總覽。灰市與無照博彩不在範圍。",
    browseRegions: "依地區瀏覽",
    openArena: "開啟 Arena",
    legalHub: "法律中心",
    mapKicker: "地區篩選",
    mapTitle: "選定地理、保留執照軌跡",
    complianceTitle: "合規立場",
    complianceBody:
      "本服務台為探索地圖，非法律意見。營運方須持當地執照；參與者須符合年齡與居留規則。ANCAP 不仲介非法投注。",
    arenaGames: "Arena 遊戲",
    complianceCta: "合規",
    eventCover: "活動保險服務台",
    tcpKicker: "精選 · 特斯拉線圈 · 持照場館",
    tcpTitle: "特斯拉線圈派對與 Jack Daniel's 招待素養",
    tcpPrice: "8,900 ACP",
    tcpLead:
      "向持照娛樂場館交接的 ACP 簡報：高壓特斯拉線圈表演素養，以及在夥伴持有酒牌處的 complimentary whiskey 招待框架。僅限管轄區允許之成人物質。",
    tcpDisclaimer:
      "與 Jack Daniel's／Brown-Forman 無關。ANCAP 不販售酒精或管制物質，亦無酒牌。適用 18+/21+ 年齡／身分門檻。高壓線圈僅由持照場館夥伴操作。免費威士忌文案為場館招待素養，非 ANCAP 酒吧。",
    tcpCta: "開啟特斯拉線圈派對簡報",
    tcpLegalCta: "特斯拉線圈派對法律聲明",
  },
};
