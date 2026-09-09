type Language = "en" | "ru" | "uk" | "de" | "zh-Hant";
type Tree = { [key: string]: string | Tree };

export const whitepaperByLang: Record<Language, Tree> = {
  en: {
    kicker: "Project whitepaper",
    title: "ANCAP: AI Native Capital Allocation Platform",
    lead:
      "ANCAP combines smart payments, ACP-settled execution, AI-assisted payment decoding, and verifiable crypto-native workflow flows. The goal is a practical layer where users and agents can understand what to pay, where capital should move, and how to verify the result after execution.",
    openStore: "Open workflow store",
    readAcp: "Read ACP paper",
    userAgreement: "User agreement",
    buyersTitle: "Buyers",
    buyersBody: "Buy launch, listing, campaign, bounty, risk, and governance deliverables for ACP.",
    creatorsTitle: "Creators",
    creatorsBody: "Publish paid workflow offers and earn from completed runs with proof receipts.",
    agentsTitle: "Agents",
    agentsBody: "Use AI-readable catalogs, paid API, spend caps, and machine-readable receipts.",
    s1Title: "1. Purpose",
    s1Body:
      "ANCAP stands for AI Native Capital Allocation Platform. It is being built as a practical crypto payment and execution layer where users, merchants, operators, and AI agents can understand payment requests, prepare safe payment intents, allocate capital with clearer intent, settle through ACP-aware rails, and receive proof-backed execution artifacts instead of vague chatbot output.",
    s2Title: "2. Problem",
    s2Body:
      "Crypto teams lose time on repeated operational work: exchange listing materials, campaign drafts, bounty coordination, risk summaries, wallet checks, API docs, compliance evidence, and partner reporting. AI agents also need machine-readable services they can pay for and verify without sales calls or manual invoices.",
    s3Title: "3. Solution",
    s3Body:
      "ANCAP packages repeatable AI work as paid workflow SKUs and extends that logic into smart payments. A buyer can choose a workflow, receive a quoted ACP price, pay through the platform wallet or checkout intent, track run status, and receive a result with receipt metadata and proof links. The roadmap also includes planned AI Payment Scanner flows where a photo, QR code, invoice, receipt, or payment screen can be decoded into a safe payment intent before user confirmation, but that scanner layer is not shipped today.",
    s4Title: "4. Core Architecture",
    s4Body:
      "The platform combines FastAPI services, PostgreSQL, Redis, Next.js, ACP wallet/billing, paid API metering, LLM execution, search, receipts, and public proof surfaces. The catalog is designed for both humans and AI agents through the web UI, OpenAPI docs, llms.txt, and agent-products.json.",
    s5Title: "5. Trust Model",
    s5Body:
      "ANCAP sells execution artifacts, not investment advice or guaranteed outcomes. Every paid workflow should expose the template used, input hash, price snapshot, status timeline, LLM usage metadata where applicable, and proof receipt. Fallback or degraded execution must be marked clearly and should not be presented as a full premium result.",
    s6Title: "6. Creator Economy",
    s6Body:
      "Human creators and AI-agent creators can turn specialized workflows into paid listings. A creator defines the title, category, ACP price, input schema, output items, proof policy, and publish status. ANCAP can apply review, validation, ranking, referral, and take-rate logic before listings receive distribution.",
    s7Title: "7. Monetization",
    s7Body:
      "Primary revenue comes from pay-per-run workflows, bundles, paid API calls, credit packages, creator marketplace take rates, referral-attributed paid runs, smart payment service fees, future voucher or claim-code issuance/redeem fees, and enterprise/API agreements. ACP remains the primary accounting currency and fee utility layer for the platform.",
    s8Title: "8. Governance and Compliance Direction",
    s8Body:
      "The project roadmap includes AI governance controls, ISO-style operational evidence, provider reliability diagnostics, audit logs, data protection pages, cookie preferences, and legal terms. These controls make the platform easier to inspect by buyers, partners, agents, and operators.",
    roadmapKicker: "Implementation roadmap",
    roadmapTitle: "What ANCAP is building next",
    r1: "Production LLM execution with provider health, retry/backoff, usage events, and clear degraded-mode receipts.",
    r2: "ACP checkout with invoice state, payment reference, polling, proof receipt, revenue metrics, and creator earnings.",
    r3: "Public trust layer: proof center, sample reports, project whitepaper, ACP crypto-asset paper, terms, privacy, and cookies.",
    r4: "Growth funnels for buyers, creators, and developers: sample reports, free token snapshot, paid upsell, API keys, spend caps.",
    r5: "AI Payment Scanner (planned, not shipped yet): photo upload, QR decode, OCR for receipts and invoices, payment preview, smart swap, and ACP fee rails.",
    r6: "ANCAP Claim Codes (planned, not shipped yet): lock crypto, generate redeemable codes, redeem in wallet or web, and use proof-backed voucher flows for growth and distribution.",
    r7: "B2B layer: organizations, webhooks, audit log, role-based access, exportable evidence, and partner dashboards.",
    noticeTitle: "Important notice",
    noticeBody:
      "This whitepaper is product documentation. It is not an investment prospectus, legal opinion, tax advice, securities offering, or promise of profit. ACP utility, legal treatment, and availability can vary by jurisdiction and must be reviewed before regulated distribution.",
  },
  ru: {
    kicker: "Белая книга проекта",
    title: "ANCAP: AI Native Capital Allocation Platform",
    lead:
      "ANCAP объединяет умные платежи, исполнение с расчётом в ACP, ИИ-декодирование платежей и проверяемые крипто-нативные workflow. Цель — практический слой, где пользователи и агенты понимают, что платить, куда движется капитал и как проверить результат после исполнения.",
    openStore: "Открыть магазин workflow",
    readAcp: "Читать документ ACP",
    userAgreement: "Пользовательское соглашение",
    buyersTitle: "Покупатели",
    buyersBody: "Покупайте deliverables для листинга, кампаний, bounty, риска и governance за ACP.",
    creatorsTitle: "Создатели",
    creatorsBody: "Публикуйте платные workflow-офферы и зарабатывайте с завершённых запусков с proof-чеками.",
    agentsTitle: "Агенты",
    agentsBody: "Используйте ИИ-читаемые каталоги, платный API, лимиты расходов и машиночитаемые чеки.",
    s1Title: "1. Цель",
    s1Body:
      "ANCAP означает AI Native Capital Allocation Platform. Это практический слой крипто-платежей и исполнения, где пользователи, мерчанты, операторы и ИИ-агенты понимают платёжные запросы, готовят безопасные payment intents, распределяют капитал с ясным намерением, рассчитываются через ACP-рейлы и получают проверяемые артефакты исполнения вместо размытого ответа чатбота.",
    s2Title: "2. Проблема",
    s2Body:
      "Крипто-команды теряют время на повторяющуюся операционку: материалы листинга, черновики кампаний, координация bounty, риск-сводки, проверки кошельков, API-документация, compliance-доказательства и отчёты партнёрам. ИИ-агентам также нужны машиночитаемые сервисы, которые можно оплатить и проверить без звонков и ручных счетов.",
    s3Title: "3. Решение",
    s3Body:
      "ANCAP упаковывает повторяемую ИИ-работу в платные SKU workflow и расширяет эту логику на умные платежи. Покупатель выбирает workflow, получает котировку в ACP, платит через кошелёк платформы или checkout intent, отслеживает статус и получает результат с метаданными чека и ссылками на proof. В roadmap также запланирован AI Payment Scanner (фото, QR, счёт, чек или экран оплаты → безопасный payment intent до подтверждения), но этот слой ещё не поставлен.",
    s4Title: "4. Архитектура",
    s4Body:
      "Платформа сочетает FastAPI, PostgreSQL, Redis, Next.js, ACP-кошелёк/биллинг, тарификацию API, LLM-исполнение, поиск, чеки и публичные proof-поверхности. Каталог рассчитан на людей и ИИ-агентов через веб-UI, OpenAPI, llms.txt и agent-products.json.",
    s5Title: "5. Модель доверия",
    s5Body:
      "ANCAP продаёт артефакты исполнения, а не инвестиционные советы и не гарантированные исходы. Каждый платный workflow должен раскрывать шаблон, хеш входа, снимок цены, таймлайн статуса, метаданные LLM (где применимо) и proof-чек. Fallback или деградированное исполнение должно быть явно помечено и не выдаваться за полный premium-результат.",
    s6Title: "6. Экономика создателей",
    s6Body:
      "Люди и ИИ-агенты могут превращать специализированные workflow в платные листинги. Создатель задаёт название, категорию, цену в ACP, схему входа, выходные элементы, политику proof и статус публикации. ANCAP может применять review, валидацию, ранжирование, рефералы и take-rate до дистрибуции.",
    s7Title: "7. Монетизация",
    s7Body:
      "Основная выручка — pay-per-run workflow, бандлы, платные API-вызовы, пакеты кредитов, take-rate маркетплейса, реферальные платные запуски, комиссии smart payment, будущие voucher/claim-code и enterprise/API-соглашения. ACP остаётся основной учётной валютой и utility-слоем комиссий.",
    s8Title: "8. Governance и compliance",
    s8Body:
      "Roadmap включает ИИ-governance, ISO-подобные operational evidence, диагностику провайдеров, audit log, страницы защиты данных, cookie-предпочтения и правовые условия. Это упрощает проверку платформы покупателями, партнёрами, агентами и операторами.",
    roadmapKicker: "Roadmap реализации",
    roadmapTitle: "Что ANCAP строит дальше",
    r1: "Продакшен LLM-исполнение со здоровьем провайдера, retry/backoff, usage events и ясными чеками degraded-mode.",
    r2: "ACP checkout со статусом инвойса, payment reference, polling, proof-чеком, метриками выручки и earnings создателей.",
    r3: "Публичный trust-слой: proof center, sample reports, whitepaper проекта, crypto-asset paper ACP, terms, privacy и cookies.",
    r4: "Growth-воронки для покупателей, создателей и разработчиков: sample reports, бесплатный token snapshot, платный upsell, API-ключи, spend caps.",
    r5: "AI Payment Scanner (planned, ещё не shipped): загрузка фото, QR decode, OCR чеков и счетов, preview платежа, smart swap и ACP fee rails.",
    r6: "ANCAP Claim Codes (planned, ещё не shipped): lock crypto, redeemable codes, redeem в кошельке или вебе, proof-backed voucher flows.",
    r7: "B2B-слой: организации, webhooks, audit log, RBAC, экспортируемые evidence и партнёрские дашборды.",
    noticeTitle: "Важное замечание",
    noticeBody:
      "Эта белая книга — продуктовая документация. Это не инвестиционный проспект, не юридическое заключение, не налоговый совет, не оферта ценных бумаг и не обещание прибыли. Utility ACP, правовой режим и доступность зависят от юрисдикции и требуют проверки перед регулируемым распространением.",
  },
  uk: {
    kicker: "Біла книга проєкту",
    title: "ANCAP: AI Native Capital Allocation Platform",
    lead:
      "ANCAP поєднує розумні платежі, виконання з розрахунком в ACP, ІІ-декодування платежів і перевірювані крипто-нативні workflow. Мета — практичний шар, де користувачі й агенти розуміють, що платити, куди рухається капітал і як перевірити результат після виконання.",
    openStore: "Відкрити магазин workflow",
    readAcp: "Читати документ ACP",
    userAgreement: "Угода користувача",
    buyersTitle: "Покупці",
    buyersBody: "Купуйте deliverables для лістингу, кампаній, bounty, ризику та governance за ACP.",
    creatorsTitle: "Творці",
    creatorsBody: "Публікуйте платні workflow-офери й заробляйте з завершених запусків із proof-чеками.",
    agentsTitle: "Агенти",
    agentsBody: "Використовуйте ІІ-читабельні каталоги, платний API, ліміти витрат і машиночитані чеки.",
    s1Title: "1. Мета",
    s1Body:
      "ANCAP означає AI Native Capital Allocation Platform. Це практичний шар крипто-платежів і виконання, де користувачі, мерчанти, оператори та ІІ-агенти розуміють платіжні запити, готують безпечні payment intents, розподіляють капітал із ясним наміром, розраховуються через ACP-рейли й отримують перевірювані артефакти виконання замість розмитої відповіді чатбота.",
    s2Title: "2. Проблема",
    s2Body:
      "Крипто-команди втрачають час на повторювану операційку: матеріали лістингу, чернетки кампаній, координація bounty, ризик-зведення, перевірки гаманців, API-документація, compliance-докази й звіти партнерам. ІІ-агентам також потрібні машиночитані сервіси, які можна оплатити й перевірити без дзвінків і ручних рахунків.",
    s3Title: "3. Рішення",
    s3Body:
      "ANCAP пакує повторювану ІІ-роботу в платні SKU workflow і розширює цю логіку на розумні платежі. Покупець обирає workflow, отримує котирування в ACP, платить через гаманець платформи або checkout intent, відстежує статус і отримує результат із метаданими чека та посиланнями на proof. У roadmap також заплановано AI Payment Scanner, але цей шар ще не поставлено.",
    s4Title: "4. Архітектура",
    s4Body:
      "Платформа поєднує FastAPI, PostgreSQL, Redis, Next.js, ACP-гаманець/білінг, тарифікацію API, LLM-виконання, пошук, чеки та публічні proof-поверхні. Каталог розрахований на людей і ІІ-агентів через веб-UI, OpenAPI, llms.txt і agent-products.json.",
    s5Title: "5. Модель довіри",
    s5Body:
      "ANCAP продає артефакти виконання, а не інвестиційні поради й не гарантовані результати. Кожен платний workflow має розкривати шаблон, хеш входу, знімок ціни, таймлайн статусу, метадані LLM (де застосовно) і proof-чек. Fallback або деградоване виконання має бути явно позначене.",
    s6Title: "6. Економіка творців",
    s6Body:
      "Люди та ІІ-агенти можуть перетворювати спеціалізовані workflow на платні лістинги. Творець задає назву, категорію, ціну в ACP, схему входу, вихідні елементи, політику proof і статус публікації. ANCAP може застосовувати review, валідацію, ранжування, реферали та take-rate до дистрибуції.",
    s7Title: "7. Монетизація",
    s7Body:
      "Основний дохід — pay-per-run workflow, бандли, платні API-виклики, пакети кредитів, take-rate маркетплейсу, реферальні платні запуски, комісії smart payment, майбутні voucher/claim-code та enterprise/API-угоди. ACP лишається основною обліковою валютою й utility-шаром комісій.",
    s8Title: "8. Governance і compliance",
    s8Body:
      "Roadmap включає ІІ-governance, ISO-подібні operational evidence, діагностику провайдерів, audit log, сторінки захисту даних, cookie-уподобання та правові умови. Це спрощує перевірку платформи покупцями, партнерами, агентами й операторами.",
    roadmapKicker: "Roadmap реалізації",
    roadmapTitle: "Що ANCAP будує далі",
    r1: "Продакшен LLM-виконання зі здоров’ям провайдера, retry/backoff, usage events і чіткими чеками degraded-mode.",
    r2: "ACP checkout зі статусом інвойсу, payment reference, polling, proof-чеком, метриками виручки та earnings творців.",
    r3: "Публічний trust-шар: proof center, sample reports, whitepaper проєкту, crypto-asset paper ACP, terms, privacy і cookies.",
    r4: "Growth-воронки для покупців, творців і розробників: sample reports, безкоштовний token snapshot, платний upsell, API-ключі, spend caps.",
    r5: "AI Payment Scanner (planned, ще не shipped): завантаження фото, QR decode, OCR чеків і рахунків, preview платежу, smart swap і ACP fee rails.",
    r6: "ANCAP Claim Codes (planned, ще не shipped): lock crypto, redeemable codes, redeem у гаманці або вебі, proof-backed voucher flows.",
    r7: "B2B-шар: організації, webhooks, audit log, RBAC, експортовані evidence і партнерські дашборди.",
    noticeTitle: "Важливе зауваження",
    noticeBody:
      "Ця біла книга — продуктова документація. Це не інвестиційний проспект, не юридичний висновок, не податкова порада, не оферта цінних паперів і не обіцянка прибутку. Utility ACP, правовий режим і доступність залежать від юрисдикції й потребують перевірки перед регульованим поширенням.",
  },
  de: {
    kicker: "Projekt-Whitepaper",
    title: "ANCAP: AI Native Capital Allocation Platform",
    lead:
      "ANCAP kombiniert Smart Payments, ACP-abgewickelte Ausführung, KI-gestützte Zahlungsdekodierung und überprüfbare crypto-native Workflows. Ziel ist eine praktische Schicht, in der Nutzer und Agenten verstehen, was zu zahlen ist, wohin Kapital fließt und wie das Ergebnis nach der Ausführung geprüft wird.",
    openStore: "Workflow-Store öffnen",
    readAcp: "ACP-Papier lesen",
    userAgreement: "Nutzungsvereinbarung",
    buyersTitle: "Käufer",
    buyersBody: "Kaufen Sie Launch-, Listing-, Kampagnen-, Bounty-, Risiko- und Governance-Deliverables für ACP.",
    creatorsTitle: "Creator",
    creatorsBody: "Veröffentlichen Sie bezahlte Workflow-Angebote und verdienen Sie an abgeschlossenen Runs mit Proof-Belegen.",
    agentsTitle: "Agenten",
    agentsBody: "Nutzen Sie KI-lesbare Kataloge, bezahlte API, Spend Caps und maschinenlesbare Belege.",
    s1Title: "1. Zweck",
    s1Body:
      "ANCAP steht für AI Native Capital Allocation Platform. Es wird als praktische Crypto-Zahlungs- und Ausführungsschicht gebaut, in der Nutzer, Händler, Betreiber und KI-Agenten Zahlungsanfragen verstehen, sichere Payment Intents vorbereiten, Kapital mit klarerer Absicht zuweisen, über ACP-Rails abwickeln und proof-gestützte Ausführungsartefakte erhalten statt vager Chatbot-Ausgabe.",
    s2Title: "2. Problem",
    s2Body:
      "Crypto-Teams verlieren Zeit mit wiederkehrender Betriebsarbeit: Listing-Materialien, Kampagnenentwürfe, Bounty-Koordination, Risikozusammenfassungen, Wallet-Checks, API-Docs, Compliance-Nachweise und Partnerberichte. KI-Agenten brauchen außerdem maschinenlesbare Dienste, die sie bezahlen und prüfen können — ohne Verkaufsgespräche oder manuelle Rechnungen.",
    s3Title: "3. Lösung",
    s3Body:
      "ANCAP verpackt wiederholbare KI-Arbeit als bezahlte Workflow-SKUs und erweitert diese Logik auf Smart Payments. Ein Käufer wählt einen Workflow, erhält einen ACP-Preis, zahlt über Plattform-Wallet oder Checkout Intent, verfolgt den Run-Status und erhält ein Ergebnis mit Beleg-Metadaten und Proof-Links. Die Roadmap umfasst auch geplante AI Payment Scanner Flows; dieser Scanner ist heute noch nicht ausgeliefert.",
    s4Title: "4. Kernarchitektur",
    s4Body:
      "Die Plattform kombiniert FastAPI-Dienste, PostgreSQL, Redis, Next.js, ACP-Wallet/Billing, bezahlte API-Messung, LLM-Ausführung, Suche, Belege und öffentliche Proof-Oberflächen. Der Katalog ist für Menschen und KI-Agenten über Web-UI, OpenAPI, llms.txt und agent-products.json ausgelegt.",
    s5Title: "5. Vertrauensmodell",
    s5Body:
      "ANCAP verkauft Ausführungsartefakte, keine Anlageberatung und keine garantierten Ergebnisse. Jeder bezahlte Workflow sollte Template, Input-Hash, Preissnapshot, Status-Timeline, LLM-Nutzungsmetadaten (falls zutreffend) und Proof-Beleg offenlegen. Fallback oder degradierte Ausführung muss klar markiert sein.",
    s6Title: "6. Creator Economy",
    s6Body:
      "Menschliche Creator und KI-Agent-Creator können spezialisierte Workflows in bezahlte Listings verwandeln. Ein Creator definiert Titel, Kategorie, ACP-Preis, Input-Schema, Output-Items, Proof-Policy und Publish-Status. ANCAP kann Review, Validierung, Ranking, Referral und Take-Rate anwenden.",
    s7Title: "7. Monetarisierung",
    s7Body:
      "Primäre Einnahmen kommen aus Pay-per-Run-Workflows, Bundles, bezahlten API-Calls, Credit-Paketen, Marketplace-Take-Rates, referral-attributierten Paid Runs, Smart-Payment-Gebühren, künftigen Voucher/Claim-Code-Gebühren und Enterprise/API-Vereinbarungen. ACP bleibt die primäre Rechnungswährung und Gebühren-Utility-Schicht.",
    s8Title: "8. Governance und Compliance",
    s8Body:
      "Die Roadmap umfasst KI-Governance-Kontrollen, ISO-artige Betriebsnachweise, Provider-Diagnostik, Audit-Logs, Datenschutzseiten, Cookie-Präferenzen und rechtliche Bedingungen. Diese Kontrollen erleichtern die Prüfung durch Käufer, Partner, Agenten und Betreiber.",
    roadmapKicker: "Umsetzungs-Roadmap",
    roadmapTitle: "Was ANCAP als Nächstes baut",
    r1: "Produktions-LLM-Ausführung mit Provider-Health, Retry/Backoff, Usage Events und klaren Degraded-Mode-Belegen.",
    r2: "ACP-Checkout mit Rechnungsstatus, Payment Reference, Polling, Proof-Beleg, Umsatzmetriken und Creator-Earnings.",
    r3: "Öffentliche Trust-Schicht: Proof Center, Sample Reports, Projekt-Whitepaper, ACP Crypto-Asset-Papier, Terms, Privacy und Cookies.",
    r4: "Growth-Funnels für Käufer, Creator und Entwickler: Sample Reports, kostenloser Token-Snapshot, Paid Upsell, API-Keys, Spend Caps.",
    r5: "AI Payment Scanner (geplant, noch nicht ausgeliefert): Foto-Upload, QR-Decode, OCR für Belege und Rechnungen, Zahlungsvorschau, Smart Swap und ACP-Fee-Rails.",
    r6: "ANCAP Claim Codes (geplant, noch nicht ausgeliefert): Crypto sperren, einlösbare Codes erzeugen, in Wallet oder Web einlösen, proof-gestützte Voucher-Flows.",
    r7: "B2B-Schicht: Organisationen, Webhooks, Audit-Log, rollenbasierter Zugriff, exportierbare Nachweise und Partner-Dashboards.",
    noticeTitle: "Wichtiger Hinweis",
    noticeBody:
      "Dieses Whitepaper ist Produktdokumentation. Es ist kein Anlageprospekt, keine Rechtsmeinung, keine Steuerberatung, kein Wertpapierangebot und kein Gewinnversprechen. ACP-Utility, rechtliche Behandlung und Verfügbarkeit können je nach Jurisdiktion variieren und müssen vor regulierter Distribution geprüft werden.",
  },
  "zh-Hant": {
    kicker: "專案白皮書",
    title: "ANCAP：AI Native Capital Allocation Platform",
    lead:
      "ANCAP 結合智慧付款、ACP 結算執行、AI 輔助付款解碼，以及可驗證的加密原生工作流程。目標是實用層：使用者與代理能理解應付什麼、資金應往何處移動，以及執行後如何驗證結果。",
    openStore: "開啟工作流程商店",
    readAcp: "閱讀 ACP 文件",
    userAgreement: "使用者協議",
    buyersTitle: "買家",
    buyersBody: "以 ACP 購買上架、活動、賞金、風險與治理交付物。",
    creatorsTitle: "創作者",
    creatorsBody: "發布付費工作流程報價，並從附證明收據的完成執行中獲利。",
    agentsTitle: "代理",
    agentsBody: "使用 AI 可讀目錄、付費 API、支出上限與機器可讀收據。",
    s1Title: "1. 目的",
    s1Body:
      "ANCAP 代表 AI Native Capital Allocation Platform。它作為實用的加密付款與執行層，讓使用者、商家、營運者與 AI 代理能理解付款請求、準備安全付款意圖、以更清晰意圖配置資本、透過 ACP 相關軌道結算，並取得有證明的執行產物，而非模糊聊天回覆。",
    s2Title: "2. 問題",
    s2Body:
      "加密團隊在重複營運工作上耗時：交易所上架材料、活動草稿、賞金協調、風險摘要、錢包檢查、API 文件、合規證據與合作夥伴報告。AI 代理也需要可付費、可驗證的機器可讀服務，而無須銷售通話或手動發票。",
    s3Title: "3. 解決方案",
    s3Body:
      "ANCAP 將可重複的 AI 工作打包為付費工作流程 SKU，並延伸到智慧付款。買家可選擇工作流程、取得 ACP 報價、透過平台錢包或結帳意圖付款、追蹤執行狀態，並取得含收據中繼資料與證明連結的結果。路線圖亦包含規劃中的 AI Payment Scanner；該層目前尚未出貨。",
    s4Title: "4. 核心架構",
    s4Body:
      "平台結合 FastAPI、PostgreSQL、Redis、Next.js、ACP 錢包／帳單、付費 API 計量、LLM 執行、搜尋、收據與公開證明介面。目錄透過網頁 UI、OpenAPI、llms.txt 與 agent-products.json 同時服務人類與 AI 代理。",
    s5Title: "5. 信任模型",
    s5Body:
      "ANCAP 販售執行產物，而非投資建議或保證結果。每個付費工作流程應揭露所用範本、輸入雜湊、價格快照、狀態時間軸、適用的 LLM 使用中繼資料與證明收據。降級或備援執行必須清楚標示。",
    s6Title: "6. 創作者經濟",
    s6Body:
      "人類與 AI 代理創作者可將專業工作流程變成付費上架。創作者定義標題、類別、ACP 價格、輸入結構、輸出項目、證明政策與發布狀態。ANCAP 可在分發前套用審核、驗證、排名、推薦與抽成邏輯。",
    s7Title: "7. 變現",
    s7Body:
      "主要收入來自按次付費工作流程、方案包、付費 API 呼叫、點數包、市集抽成、推薦歸因的付費執行、智慧付款服務費、未來憑證／兌換碼費用，以及企業／API 協議。ACP 仍是平台主要記帳貨幣與手續費效用層。",
    s8Title: "8. 治理與合規方向",
    s8Body:
      "專案路線圖包含 AI 治理控制、ISO 風格營運證據、供應商可靠度診斷、稽核日誌、資料保護頁面、Cookie 偏好與法律條款。這些控制讓買家、合作夥伴、代理與營運者更容易檢視平台。",
    roadmapKicker: "實作路線圖",
    roadmapTitle: "ANCAP 接下來要建什麼",
    r1: "生產級 LLM 執行：供應商健康、重試／退避、用量事件與清楚的降級模式收據。",
    r2: "ACP 結帳：發票狀態、付款參考、輪詢、證明收據、營收指標與創作者收益。",
    r3: "公開信任層：證明中心、範例報告、專案白皮書、ACP 加密資產文件、條款、隱私與 Cookie。",
    r4: "買家、創作者與開發者成長漏斗：範例報告、免費代幣快照、付費升級、API 金鑰、支出上限。",
    r5: "AI Payment Scanner（規劃中，尚未出貨）：照片上傳、QR 解碼、收據／發票 OCR、付款預覽、智慧兌換與 ACP 手續費軌道。",
    r6: "ANCAP Claim Codes（規劃中，尚未出貨）：鎖定加密資產、產生可兌換碼、在錢包或網頁兌換，以及有證明的憑證成長流程。",
    r7: "B2B 層：組織、Webhook、稽核日誌、角色存取、可匯出證據與合作夥伴儀表板。",
    noticeTitle: "重要聲明",
    noticeBody:
      "本白皮書為產品文件。它不是投資說明書、法律意見、稅務建議、證券要約或獲利承諾。ACP 效用、法律待遇與可用性因管轄區而異，在受監管發行前必須審查。",
  },
};

export const acpWhitepaperByLang: Record<Language, Tree> = {
  en: {
    kicker: "Crypto-asset whitepaper",
    title: "ACP: utility asset for ANCAP workflow commerce",
    lead:
      "ACP is designed as the primary platform asset for paid AI-workflow execution, credits, receipts, creator payouts, and agent/API commerce inside ANCAP. This document explains intended utility, accounting treatment, user risks, and compliance boundaries.",
    openWallet: "Open ACP wallet",
    viewPricing: "View ACP pricing",
    projectPaper: "Project whitepaper",
    assetRoleTitle: "Asset role",
    assetRoleBody:
      "ACP is a platform utility and accounting asset for ANCAP services. It is used to express workflow prices, run credits, creator revenue, paid API spend, and proof receipt amounts. ACP is not described by ANCAP as equity, debt, a deposit, a stablecoin, a claim on company revenue, or a guaranteed right to profit.",
    supplyTitle: "Supply and technical details",
    supplyBody:
      "The live implementation may include native ACP, wrapped ACP, custodial wallet balances, and bridge components. Before external distribution, token supply, contract addresses, chain identifiers, mint/burn controls, treasury policy, bridge limits, and audit reports must be published from the production deployment and verified by the operator.",
    utilityTitle: "Utility inside ANCAP",
    u1Title: "Workflow settlement",
    u1Body: "ACP is the primary unit used to quote, pay for, and receipt workflow runs.",
    u2Title: "Paid API metering",
    u2Body: "API products can debit ACP credits per call and return machine-readable receipt metadata.",
    u3Title: "Creator earnings",
    u3Body: "Creators can price listings in ACP and receive earnings from completed runs after platform rules and reviews.",
    u4Title: "Proof receipts",
    u4Body: "Receipts may include ACP amount, workflow slug, run status, input hash, output manifest, and proof link.",
    u5Title: "Platform accounting",
    u5Body: "For platform pricing, 1 ACP is treated as 1 internal accounting unit. This is not a fiat peg or redemption promise.",
    risksTitle: "Risk factors",
    risk1: "ACP may have limited liquidity and utility outside the ANCAP ecosystem.",
    risk2: "Crypto assets can be volatile and may lose value.",
    risk3: "Network, bridge, wallet, smart-contract, custody, or key-management failures can cause loss or delay.",
    risk4: "Regulatory treatment can change and may restrict access in some jurisdictions.",
    risk5: "AI workflow outputs can be incomplete or wrong and must be reviewed before business, legal, or financial use.",
    regulatoryTitle: "Regulatory references",
    regulatoryBody:
      "Crypto-asset rules differ by country. In the European Union, Regulation (EU) 2023/1114 on Markets in Crypto-assets (MiCA) creates a framework for crypto-asset issuers and service providers. ANCAP should obtain jurisdiction-specific legal review before any public token offer, exchange listing, custody, promotion, or cross-border service launch.",
    eurLex: "EUR-Lex: Regulation (EU) 2023/1114",
    ecMica: "European Commission: Markets in Crypto-assets Regulation",
    noPromiseTitle: "No investment promise",
    noPromiseBody:
      "ACP is described here for platform utility. ANCAP does not promise income, yield, buybacks, market value, redemption, appreciation, or investment returns. Users should buy ACP only for permitted platform use and only after understanding wallet, network, legal, tax, and operational risks.",
  },
  ru: {
    kicker: "Белая книга криптоактива",
    title: "ACP: utility-актив для commerce workflow ANCAP",
    lead:
      "ACP задуман как основной платформенный актив для платного AI-workflow, кредитов, чеков, выплат создателям и agent/API-commerce внутри ANCAP. Документ объясняет intended utility, учёт, риски пользователей и границы compliance.",
    openWallet: "Открыть кошелёк ACP",
    viewPricing: "Смотреть цены ACP",
    projectPaper: "Белая книга проекта",
    assetRoleTitle: "Роль актива",
    assetRoleBody:
      "ACP — платформенный utility и учётный актив сервисов ANCAP. Им выражают цены workflow, кредиты запусков, выручку создателей, spend платного API и суммы proof-чеков. ANCAP не описывает ACP как equity, долг, депозит, стейблкоин, претензию на выручку компании или гарантированное право на прибыль.",
    supplyTitle: "Эмиссия и технические детали",
    supplyBody:
      "Живая реализация может включать native ACP, wrapped ACP, кастодиальные балансы и bridge-компоненты. Перед внешним распространением эмиссия, адреса контрактов, идентификаторы сетей, mint/burn, treasury policy, лимиты моста и аудиты должны быть опубликованы из продакшена и проверены оператором.",
    utilityTitle: "Utility внутри ANCAP",
    u1Title: "Расчёт workflow",
    u1Body: "ACP — основная единица для котировки, оплаты и чеков запусков workflow.",
    u2Title: "Тарификация платного API",
    u2Body: "API-продукты могут списывать ACP-кредиты за вызов и возвращать машиночитаемые метаданные чека.",
    u3Title: "Доход создателей",
    u3Body: "Создатели могут ценить листинги в ACP и получать earnings с завершённых запусков после правил и review платформы.",
    u4Title: "Proof-чеки",
    u4Body: "Чеки могут включать сумму ACP, slug workflow, статус запуска, хеш входа, манифест выхода и ссылку на proof.",
    u5Title: "Платформенный учёт",
    u5Body: "Для цен платформы 1 ACP = 1 внутренняя учётная единица. Это не фиатный пег и не обещание redemption.",
    risksTitle: "Факторы риска",
    risk1: "У ACP может быть ограниченная ликвидность и utility вне экосистемы ANCAP.",
    risk2: "Криптоактивы волатильны и могут терять стоимость.",
    risk3: "Сбои сети, моста, кошелька, смарт-контракта, кастоди или управления ключами могут привести к потере или задержке.",
    risk4: "Регуляторный режим может меняться и ограничивать доступ в отдельных юрисдикциях.",
    risk5: "Выходы AI-workflow могут быть неполными или неверными и требуют проверки перед бизнес-, юридическим или финансовым использованием.",
    regulatoryTitle: "Регуляторные ссылки",
    regulatoryBody:
      "Правила криптоактивов различаются по странам. В ЕС Регламент (EU) 2023/1114 о рынках криптоактивов (MiCA) задаёт рамки для эмитентов и провайдеров. ANCAP должен получить юрисдикционный legal review до публичного предложения токена, листинга, кастоди, продвижения или кросс-бордер запуска.",
    eurLex: "EUR-Lex: Regulation (EU) 2023/1114",
    ecMica: "European Commission: Markets in Crypto-assets Regulation",
    noPromiseTitle: "Без инвестиционного обещания",
    noPromiseBody:
      "ACP описан здесь для платформенного utility. ANCAP не обещает доход, yield, buybacks, рыночную стоимость, redemption, рост или инвестиционную доходность. Покупайте ACP только для разрешённого использования платформы и после понимания рисков кошелька, сети, права, налогов и операций.",
  },
  uk: {
    kicker: "Біла книга криптоактиву",
    title: "ACP: utility-актив для commerce workflow ANCAP",
    lead:
      "ACP задуманий як основний платформений актив для платного AI-workflow, кредитів, чеків, виплат творцям і agent/API-commerce всередині ANCAP. Документ пояснює intended utility, облік, ризики користувачів і межі compliance.",
    openWallet: "Відкрити гаманець ACP",
    viewPricing: "Дивитися ціни ACP",
    projectPaper: "Біла книга проєкту",
    assetRoleTitle: "Роль активу",
    assetRoleBody:
      "ACP — платформений utility і обліковий актив сервісів ANCAP. Ним виражають ціни workflow, кредити запусків, виручку творців, spend платного API й суми proof-чеків. ANCAP не описує ACP як equity, борг, депозит, стейблкоїн, претензію на виручку компанії чи гарантоване право на прибуток.",
    supplyTitle: "Емісія та технічні деталі",
    supplyBody:
      "Жива реалізація може включати native ACP, wrapped ACP, кастодіальні баланси та bridge-компоненти. Перед зовнішнім поширенням емісія, адреси контрактів, ідентифікатори мереж, mint/burn, treasury policy, ліміти мосту й аудити мають бути опубліковані з продакшену й перевірені оператором.",
    utilityTitle: "Utility всередині ANCAP",
    u1Title: "Розрахунок workflow",
    u1Body: "ACP — основна одиниця для котирування, оплати й чеків запусків workflow.",
    u2Title: "Тарифікація платного API",
    u2Body: "API-продукти можуть списувати ACP-кредити за виклик і повертати машиночитані метадані чека.",
    u3Title: "Дохід творців",
    u3Body: "Творці можуть цінувати лістинги в ACP і отримувати earnings із завершених запусків після правил і review платформи.",
    u4Title: "Proof-чеки",
    u4Body: "Чеки можуть включати суму ACP, slug workflow, статус запуску, хеш входу, маніфест виходу й посилання на proof.",
    u5Title: "Платформений облік",
    u5Body: "Для цін платформи 1 ACP = 1 внутрішня облікова одиниця. Це не фіатний пег і не обіцянка redemption.",
    risksTitle: "Фактори ризику",
    risk1: "У ACP може бути обмежена ліквідність і utility поза екосистемою ANCAP.",
    risk2: "Криптоактиви волатильні й можуть втрачати вартість.",
    risk3: "Збої мережі, мосту, гаманця, смарт-контракту, кастоді чи керування ключами можуть спричинити втрату або затримку.",
    risk4: "Регуляторний режим може змінюватися й обмежувати доступ у окремих юрисдикціях.",
    risk5: "Виходи AI-workflow можуть бути неповними або хибними й потребують перевірки перед бізнес-, юридичним чи фінансовим використанням.",
    regulatoryTitle: "Регуляторні посилання",
    regulatoryBody:
      "Правила криптоактивів різняться за країнами. В ЄС Регламент (EU) 2023/1114 про ринки криптоактивів (MiCA) задає рамки для емітентів і провайдерів. ANCAP має отримати юрисдикційний legal review до публічної пропозиції токена, лістингу, кастоді, просування чи крос-бордер запуску.",
    eurLex: "EUR-Lex: Regulation (EU) 2023/1114",
    ecMica: "European Commission: Markets in Crypto-assets Regulation",
    noPromiseTitle: "Без інвестиційної обіцянки",
    noPromiseBody:
      "ACP описано тут для платформенного utility. ANCAP не обіцяє дохід, yield, buybacks, ринкову вартість, redemption, зростання чи інвестиційну дохідність. Купуйте ACP лише для дозволеного використання платформи й після розуміння ризиків гаманця, мережі, права, податків і операцій.",
  },
  de: {
    kicker: "Krypto-Asset-Whitepaper",
    title: "ACP: Utility-Asset für ANCAP-Workflow-Commerce",
    lead:
      "ACP ist als primäres Plattform-Asset für bezahlte AI-Workflow-Ausführung, Credits, Belege, Creator-Auszahlungen und Agent/API-Commerce in ANCAP ausgelegt. Dieses Dokument erklärt intended Utility, Buchungsbehandlung, Nutzerrisiken und Compliance-Grenzen.",
    openWallet: "ACP-Wallet öffnen",
    viewPricing: "ACP-Preise ansehen",
    projectPaper: "Projekt-Whitepaper",
    assetRoleTitle: "Asset-Rolle",
    assetRoleBody:
      "ACP ist ein Plattform-Utility- und Buchungsasset für ANCAP-Dienste. Es dient der Darstellung von Workflow-Preisen, Run-Credits, Creator-Umsatz, bezahltem API-Spend und Proof-Belegebeträgen. ANCAP beschreibt ACP nicht als Equity, Schuld, Einlage, Stablecoin, Anspruch auf Unternehmensumsatz oder garantiertes Gewinnrecht.",
    supplyTitle: "Supply und technische Details",
    supplyBody:
      "Die Live-Implementierung kann natives ACP, wrapped ACP, custodiale Wallet-Salden und Bridge-Komponenten umfassen. Vor externer Distribution müssen Token-Supply, Vertragsadressen, Chain-IDs, Mint/Burn-Kontrollen, Treasury-Policy, Bridge-Limits und Audit-Berichte aus der Produktion veröffentlicht und vom Betreiber verifiziert werden.",
    utilityTitle: "Utility innerhalb von ANCAP",
    u1Title: "Workflow-Abwicklung",
    u1Body: "ACP ist die primäre Einheit zum Quoten, Bezahlen und Belegen von Workflow-Runs.",
    u2Title: "Bezahlte API-Messung",
    u2Body: "API-Produkte können ACP-Credits pro Call belasten und maschinenlesbare Beleg-Metadaten zurückgeben.",
    u3Title: "Creator-Earnings",
    u3Body: "Creator können Listings in ACP bepreisen und Earnings aus abgeschlossenen Runs nach Plattformregeln und Reviews erhalten.",
    u4Title: "Proof-Belege",
    u4Body: "Belege können ACP-Betrag, Workflow-Slug, Run-Status, Input-Hash, Output-Manifest und Proof-Link enthalten.",
    u5Title: "Plattform-Buchhaltung",
    u5Body: "Für Plattformpreise gilt 1 ACP als 1 interne Buchungseinheit. Das ist kein Fiat-Peg und kein Redemption-Versprechen.",
    risksTitle: "Risikofaktoren",
    risk1: "ACP kann außerhalb des ANCAP-Ökosystems begrenzte Liquidität und Utility haben.",
    risk2: "Krypto-Assets können volatil sein und an Wert verlieren.",
    risk3: "Netzwerk-, Bridge-, Wallet-, Smart-Contract-, Custody- oder Key-Management-Ausfälle können Verlust oder Verzögerung verursachen.",
    risk4: "Regulatorische Behandlung kann sich ändern und Zugang in manchen Jurisdiktionen einschränken.",
    risk5: "AI-Workflow-Ausgaben können unvollständig oder falsch sein und müssen vor geschäftlicher, rechtlicher oder finanzieller Nutzung geprüft werden.",
    regulatoryTitle: "Regulatorische Referenzen",
    regulatoryBody:
      "Krypto-Asset-Regeln unterscheiden sich je Land. In der EU schafft die Verordnung (EU) 2023/1114 über Märkte für Krypto-Assets (MiCA) einen Rahmen für Emittenten und Dienstleister. ANCAP sollte vor öffentlichem Token-Angebot, Listing, Custody, Promotion oder grenzüberschreitendem Launch eine jurisdiktionsspezifische Rechtsprüfung einholen.",
    eurLex: "EUR-Lex: Regulation (EU) 2023/1114",
    ecMica: "European Commission: Markets in Crypto-assets Regulation",
    noPromiseTitle: "Kein Anlageversprechen",
    noPromiseBody:
      "ACP wird hier für Plattform-Utility beschrieben. ANCAP verspricht kein Einkommen, keinen Yield, keine Buybacks, keinen Marktwert, keine Redemption, keine Wertsteigerung und keine Anlagerenditen. Nutzer sollten ACP nur für erlaubte Plattformnutzung und erst nach Verständnis von Wallet-, Netzwerk-, Rechts-, Steuer- und Betriebsrisiken kaufen.",
  },
  "zh-Hant": {
    kicker: "加密資產白皮書",
    title: "ACP：ANCAP 工作流程商務的效用資產",
    lead:
      "ACP 設計為 ANCAP 內付費 AI 工作流程執行、點數、收據、創作者撥款與代理／API 商務的主要平台資產。本文件說明預期效用、記帳處理、使用者風險與合規邊界。",
    openWallet: "開啟 ACP 錢包",
    viewPricing: "查看 ACP 價格",
    projectPaper: "專案白皮書",
    assetRoleTitle: "資產角色",
    assetRoleBody:
      "ACP 是 ANCAP 服務的平台效用與記帳資產，用於表達工作流程價格、執行點數、創作者收益、付費 API 支出與證明收據金額。ANCAP 不將 ACP 描述為股權、債務、存款、穩定幣、對公司營收的請求權，或保證獲利權利。",
    supplyTitle: "供應與技術細節",
    supplyBody:
      "線上實作可能包含原生 ACP、包裝 ACP、託管錢包餘額與橋接元件。對外發行前，必須從生產部署公開代幣供應、合約地址、鏈識別、鑄造／銷毀控制、庫務政策、橋接限制與稽核報告，並由營運者驗證。",
    utilityTitle: "ANCAP 內的效用",
    u1Title: "工作流程結算",
    u1Body: "ACP 是報價、付款與收據工作流程執行的主要單位。",
    u2Title: "付費 API 計量",
    u2Body: "API 產品可按呼叫扣減 ACP 點數，並回傳機器可讀收據中繼資料。",
    u3Title: "創作者收益",
    u3Body: "創作者可以 ACP 為上架定價，並在平台規則與審核後從完成執行取得收益。",
    u4Title: "證明收據",
    u4Body: "收據可包含 ACP 金額、工作流程 slug、執行狀態、輸入雜湊、輸出清單與證明連結。",
    u5Title: "平台記帳",
    u5Body: "就平台定價而言，1 ACP 視為 1 個內部記帳單位。這不是法幣掛鉤或贖回承諾。",
    risksTitle: "風險因素",
    risk1: "ACP 在 ANCAP 生態系外可能流動性與效用有限。",
    risk2: "加密資產可能波動並可能貶值。",
    risk3: "網路、橋接、錢包、智能合約、託管或金鑰管理故障可能造成損失或延遲。",
    risk4: "監管待遇可能改變，並可能在某些管轄區限制存取。",
    risk5: "AI 工作流程輸出可能不完整或錯誤，商業、法律或財務使用前必須審查。",
    regulatoryTitle: "監管參考",
    regulatoryBody:
      "加密資產規則因國而異。在歐盟，關於加密資產市場的第 (EU) 2023/1114 號規章（MiCA）為發行人與服務提供者建立框架。ANCAP 在任何公開代幣要約、交易所上架、託管、推廣或跨境服務上線前，應取得特定管轄區的法律審查。",
    eurLex: "EUR-Lex：Regulation (EU) 2023/1114",
    ecMica: "European Commission：Markets in Crypto-assets Regulation",
    noPromiseTitle: "無投資承諾",
    noPromiseBody:
      "此處描述 ACP 僅為平台效用。ANCAP 不承諾收入、收益率、回購、市值、贖回、升值或投資報酬。使用者應僅為允許的平台用途購買 ACP，且須先理解錢包、網路、法律、稅務與營運風險。",
  },
};
