type Language = "en" | "ru" | "uk" | "de" | "zh-Hant";
type Tree = { [key: string]: string | Tree };

export const counselByLang: Record<Language, Tree> = {
  en: {
    kicker: "COUNSEL · WORLDWIDE · ACP",
    title: "Legal services in any country",
    lead: "ACP-settled briefs that match you to licensed counsel worldwide — entity, contracts, crypto, immigration, IP, disputes, and tax counsel matching.",
    compliance:
      "ANCAP is not a law firm and does not practice law. Paying ACP does not create an attorney–client relationship with ANCAP.",
    servicesCta: "Browse legal briefs",
    legalCta: "Legal notice",
    regionsTitle: "Coverage regions",
    allRegions: "All regions",
    servicesTitle: "Legal service briefs",
    servicesLead: "Each SKU is an intake brief + licensed counsel handoff. Local counsel remain independent.",
    from: "from",
    buyCta: "Buy brief",
    emptyFilter: "No briefs for this region filter.",
    footerNote:
      "Engagement letters, ongoing fees, and advice are between you and the matched licensed counsel under local professional rules.",
    loadError: "Could not load the counsel desk",
  },
  ru: {
    kicker: "ЮРИСТЫ · ВЕСЬ МИР · ACP",
    title: "Юридические услуги в любой точке мира",
    lead: "Брифы с расчётом в ACP и подбор лицензированного юриста по всему миру — компании, договоры, крипто, иммиграция, IP, споры и налоговый counsel-match.",
    compliance:
      "ANCAP не является юридической фирмой и не занимается адвокатской практикой. Оплата ACP не создаёт отношений адвокат–клиент с ANCAP.",
    servicesCta: "Смотреть юр. брифы",
    legalCta: "Юридическое уведомление",
    regionsTitle: "Регионы покрытия",
    allRegions: "Все регионы",
    servicesTitle: "Юридические брифы",
    servicesLead: "Каждый SKU — intake-бриф и handoff лицензированному юристу. Местные юристы остаются независимыми.",
    from: "от",
    buyCta: "Купить бриф",
    emptyFilter: "Нет брифов для этого фильтра региона.",
    footerNote:
      "Договор поручения, дальнейшие гонорары и советы — между вами и подобранным лицензированным юристом по местным правилам профессии.",
    loadError: "Не удалось загрузить desk юристов",
  },
  uk: {
    kicker: "ЮРИСТИ · ВЕСЬ СВІТ · ACP",
    title: "Юридичні послуги в будь-якій точці світу",
    lead: "Брифи з розрахунком в ACP і підбір ліцензованого юриста по всьому світу — компанії, договори, крипто, імміграція, IP, спори та податковий counsel-match.",
    compliance:
      "ANCAP не є юридичною фірмою і не займається адвокатською практикою. Оплата ACP не створює відносин адвокат–клієнт з ANCAP.",
    servicesCta: "Дивитися юр. брифи",
    legalCta: "Юридичне повідомлення",
    regionsTitle: "Регіони покриття",
    allRegions: "Усі регіони",
    servicesTitle: "Юридичні брифи",
    servicesLead: "Кожен SKU — intake-бриф і handoff ліцензованому юристу. Місцеві юристи залишаються незалежними.",
    from: "від",
    buyCta: "Купити бриф",
    emptyFilter: "Немає брифіф для цього фільтра регіону.",
    footerNote:
      "Договір доручення, подальші гонорари і поради — між вами та підібраним ліцензованим юристом за місцевими правилами професії.",
    loadError: "Не вдалося завантажити desk юристів",
  },
  de: {
    kicker: "COUNSEL · WELTWEIT · ACP",
    title: "Rechtsdienstleistungen in jedem Land",
    lead: "ACP-abgerechnete Briefs mit Matching zu lizenzierten Anwaelten weltweit — Gesellschaften, Vertraege, Krypto, Immigration, IP, Streitigkeiten und Steuer-Counsel-Match.",
    compliance:
      "ANCAP ist keine Anwaltskanzlei und praktiziert kein Recht. ACP-Zahlung begruendet kein Anwalt-Mandanten-Verhaeltnis mit ANCAP.",
    servicesCta: "Rechts-Briefs ansehen",
    legalCta: "Rechtshinweis",
    regionsTitle: "Abdeckungsregionen",
    allRegions: "Alle Regionen",
    servicesTitle: "Rechts-Service-Briefs",
    servicesLead: "Jedes SKU ist Intake-Brief + Handoff an lizenzierten Counsel. Lokale Anwaelte bleiben unabhaengig.",
    from: "ab",
    buyCta: "Brief kaufen",
    emptyFilter: "Keine Briefs fuer diesen Regionsfilter.",
    footerNote:
      "Mandatsvertraege, laufende Honorare und Beratung liegen zwischen Ihnen und dem gematchten lizenzierten Counsel.",
    loadError: "Counsel-Desk konnte nicht geladen werden",
  },
  "zh-Hant": {
    kicker: "法律顧問 · 全球 · ACP",
    title: "全球任一地點的法律服務",
    lead: "以 ACP 結算的法律簡報，並媒合持照律師——公司設立、合約、加密資產、移民、智財、爭議與稅務顧問媒合。",
    compliance:
      "ANCAP 不是律師事務所，亦不在任何司法管轄區執業。支付 ACP 不會與 ANCAP 形成律師—客戶關係。",
    servicesCta: "瀏覽法律簡報",
    legalCta: "法律聲明",
    regionsTitle: "覆蓋地區",
    allRegions: "全部地區",
    servicesTitle: "法律服務簡報",
    servicesLead: "每個 SKU 為 intake 簡報 + 持照律師交接。當地律師保持獨立。",
    from: "起",
    buyCta: "購買簡報",
    emptyFilter: "此地區篩選無簡報。",
    footerNote: "委任書、後續費用與法律意見由您與媒合的持照律師依當地職業規範處理。",
    loadError: "無法載入法律顧問 desk",
  },
};
