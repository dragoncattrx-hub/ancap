type Language = "en" | "ru" | "uk" | "de" | "zh-Hant";

type Tree = { [key: string]: string | Tree };

export const legalByLang: Record<Language, Tree> = {
  en: {
    lastUpdated: "Last updated: 8 September 2026.",
    privacyLink: "Privacy Notice",
    cookiesLink: "Cookie Policy",
    termsLink: "User Agreement",
    cyberLink: "Collective cyber defense",
    acpLink: "ACP Whitepaper",
    termsKicker: "Legal agreement",
    termsTitle: "ANCAP User Agreement",
    termsIntro:
      "This is a production-ready legal template for the ANCAP website, but it must be reviewed and completed by qualified counsel before relying on it as the final binding agreement.",
    t1Title: "1. Parties and acceptance",
    t1Body:
      "These Terms are a template user agreement between the ANCAP platform operator and each user of ancap.cloud, the API, wallet, workflow store, creator tools, and related services. By using the services, creating an account, connecting a wallet, buying a workflow, publishing a listing, or using the API, you agree to these Terms.",
    t2Title: "2. Operator details",
    t2Body:
      "Before commercial launch, the operator must insert the legal entity name, registered address, registration number, tax number where applicable, support email, and governing jurisdiction. If a signed enterprise agreement conflicts with these Terms, the signed agreement controls for that customer.",
    t3Title: "3. Eligibility",
    t3Body:
      "You must have legal capacity to enter into this agreement and may not use ANCAP if laws, sanctions, export controls, or platform restrictions prohibit your use. You are responsible for determining whether crypto-asset, AI, data, tax, and business rules in your jurisdiction allow your intended use.",
    t4Title: "4. Services",
    t4Body:
      "ANCAP provides paid AI-workflow execution, workflow listings, creator publishing tools, ACP wallet/accounting features, paid API products, proof receipts, sample reports, search, analytics, and related operational tools. The service may change as the platform develops.",
    t5Title: "5. ACP, credits, payments, and refunds",
    t5Body:
      "ACP is the primary platform accounting and payment unit. Platform credits, wallet balances, payment intents, and receipts may be denominated in ACP. Unless a separate policy states otherwise, workflow purchases are consumed when execution begins. Refunds, credits, or compensation for failed or degraded runs are handled under platform policy and may depend on logs, status, and proof data.",
    t6Title: "6. AI outputs and review duty",
    t6Body:
      "AI-generated outputs can be inaccurate, incomplete, delayed, or unsuitable for a specific legal, financial, technical, compliance, or business decision. ANCAP sells workflow execution artifacts, not investment advice, legal advice, tax advice, financial advice, or guaranteed business outcomes. You must review outputs before relying on them.",
    t7Title: "7. Creator listings",
    t7Body:
      "Creators may submit workflow offers, schemas, prices, samples, proof policies, and related materials. ANCAP may review, reject, suspend, rank, modify display, or remove listings to protect users, comply with law, reduce spam, and maintain quality. Creator earnings may be subject to take rates, holds, refunds, abuse checks, taxes, and payout rules.",
    t8Title: "8. API use",
    t8Body:
      "API users must protect API keys, respect rate limits, spend caps, idempotency rules, and usage policies. ANCAP may throttle, suspend, or block requests that threaten stability, violate policy, bypass payment, scrape protected resources, abuse AI/LLM services, or create legal/security risk.",
    t9Title: "9. Prohibited conduct",
    t9Body:
      "You may not use ANCAP to commit fraud, evade sanctions, launder funds, attack systems, distribute malware, violate privacy rights, infringe IP, manipulate markets, impersonate others, spam users, misrepresent AI outputs as certified advice, or create illegal financial promotions.",
    t10Title: "10. Intellectual property",
    t10Body:
      "ANCAP and its licensors retain rights in the platform, software, brand, documentation, and system designs. You retain rights in lawful input content you provide. You grant ANCAP the rights needed to process inputs, run workflows, generate outputs, operate proof receipts, enforce policies, and improve the service as described in privacy and data terms.",
    t11Title: "11. Privacy, cookies, and data",
    t11Body:
      "Personal data and cookie preferences are handled under the Privacy Notice and Cookie Policy. Necessary storage supports login, security, wallet state, language, theme, and consent memory. Optional analytics or marketing storage should be activated only after valid consent where required.",
    t12Title: "12. Disclaimers and limitation of liability",
    t12Body:
      "To the maximum extent permitted by law, ANCAP is provided as-is and as-available without warranties of uninterrupted operation, error-free AI output, market value, liquidity, regulatory approval, or fitness for a particular purpose. Liability limits, exclusions, mandatory consumer rights, and local law carve-outs must be finalized by counsel for the operator jurisdiction.",
    t13Title: "13. Suspension and termination",
    t13Body:
      "ANCAP may suspend or terminate access, keys, listings, payouts, or workflows for security, abuse, unpaid amounts, suspected fraud, legal risk, policy violations, or platform integrity. Users may stop using the service at any time, subject to outstanding obligations and data retention rules.",
    t14Title: "14. Changes",
    t14Body:
      "ANCAP may update these Terms as the product, law, or risk environment changes. Material changes should be communicated through the site, account notice, email, or another reasonable channel. Continued use after the effective date means acceptance of the updated Terms.",
    t15Title: "15. Collective cyber defense",
    t15Body:
      "ANCAP agrees with the OpenAI open letter “A call for collective action on cyber defense”. ANCAP treats cybersecurity as a leadership-level duty: current controls are not enough, defenders should use AI to close accumulated weaknesses, and the response must be collective so that an attack costs more than it can return. Users may not use ANCAP to attack systems, distribute malware, or bypass access controls. The company’s public endorsement and commitments form part of ANCAP’s legal and policy information.",
    privacyKicker: "Privacy notice",
    privacyTitle: "How ANCAP handles data",
    privacyIntro:
      "This notice explains the practical data categories behind accounts, wallets, paid workflows, API usage, proof receipts, and platform security. It must be completed with the final operator identity, contact email, data processor list, and jurisdiction-specific disclosures.",
    p1Title: "Data we process",
    p1Body:
      "Account details, wallet addresses, API keys metadata, workflow inputs, generated outputs, payment intent metadata, receipts, proof hashes, support messages, device/session data, logs, and consent choices.",
    p2Title: "Why we process it",
    p2Body:
      "To provide accounts, wallet access, workflow execution, creator listings, paid API, billing, fraud prevention, security, support, product analytics, legal compliance, and operational reliability.",
    p3Title: "Crypto and public proofs",
    p3Body:
      "Some blockchain data, wallet addresses, transaction references, hashes, and public proof URLs may be visible publicly or on-chain and cannot always be deleted by ANCAP.",
    p4Title: "AI providers",
    p4Body:
      "Workflow inputs may be sent to configured LLM providers when execution requires it. Sensitive, regulated, or confidential data should not be submitted unless your organization has approved that use.",
    p5Title: "Retention",
    p5Body:
      "Operational, billing, security, audit, and receipt data may be retained as needed for service integrity, accounting, dispute resolution, abuse prevention, and legal obligations.",
    p6Title: "Your controls",
    p6Body:
      "Depending on applicable law, you may request access, correction, deletion, restriction, portability, or objection. Some requests may be limited by fraud, audit, blockchain, tax, security, or legal-retention requirements.",
    privacySecurityTitle: "Security and collective cyber defense",
    privacySecurityBody:
      "ANCAP processes security logs, session data, and proof artifacts to prevent fraud and abuse. ANCAP agrees with the OpenAI open letter calling for a global surge in collective cyber defense. The public policy statement and ANCAP commitments are published on this site.",
    privacyContactTitle: "Contact and legal basis",
    privacyContactBody:
      "The final policy should identify the controller/operator, privacy contact, legal bases such as contract, legitimate interests, consent, and legal obligation where applicable, plus international transfer safeguards if providers or infrastructure operate outside the user jurisdiction.",
    cookiesKicker: "Cookie policy",
    cookiesTitle: "Cookie and storage preferences",
    cookiesIntro:
      "ANCAP uses a consent banner with equal access to accept optional storage, reject optional storage, or customize preferences. A necessary preference record is stored so the banner does not keep reappearing.",
    c1Title: "Strictly necessary",
    c1Examples: "Consent memory, login/session state, security checks, wallet connection state, language, theme, service-worker support.",
    c1Consent: "Used without optional consent where required for the site to work.",
    c2Title: "Analytics",
    c2Examples: "Funnel events, page performance, error diagnostics, workflow conversion, aggregate product metrics.",
    c2Consent: "Disabled by default and enabled only after consent where required.",
    c3Title: "Marketing and attribution",
    c3Examples: "Campaign source, referral attribution, partner code, paid-run attribution.",
    c3Consent: "Disabled by default and enabled only after consent where required.",
    cookiesExamples: "Examples:",
    cookiesConsent: "Consent:",
    cookiesRegTitle: "Regulatory references",
    cookiesRegBody:
      "EU and UK guidance generally distinguishes strictly necessary storage from optional analytics or marketing storage. Optional categories should require informed consent and should not be pre-enabled where consent is required.",
    cookiesEc: "European Commission cookie policy example",
    cookiesEdpb: "EDPB consent guidelines",
    cyberKicker: "Legal / public policy",
    cyberTitle: "ANCAP endorsement of collective cyber defense",
    cyberIntro:
      "ANCAP publicly agrees with the OpenAI open letter “A call for collective action on cyber defense” and the global surge it asks for. This page is the company’s legal and policy statement of that agreement. It does not replace the User Agreement, Privacy Notice, or Cookie Policy.",
    openLetter: "Open letter (openai.com)",
    cyberStatementTitle: "Statement of agreement",
    cyberStatement1:
      "ANCAP, as operator of ancap.cloud and related ACP, wallet, workflow, and API services, agrees with the letter’s opening claim: there is a limited window to strengthen cyber defense. AI-enabled attacks are becoming cheaper, more automated, and more widely available, including against hospitals, water systems, and internet infrastructure. The same models can help defenders close weaknesses that have accumulated for years. ANCAP therefore aligns with the call to raise cybersecurity to executive priority, fund defense for operators who cannot fund it themselves, share proven playbooks, and make AI-agent actions accountable.",
    cyberStatement2:
      "Signatories of the letter include technology, security, payments, telecom, and industrial companies that compete in ordinary markets and still coordinated around a shared threat picture. ANCAP is not a listed signatory of that letter. This page records ANCAP’s independent agreement with the same policy and the same three principles.",
    cyberP1Title: "1. Current security is not enough",
    cyberP1Body:
      "Systems remain exposed because of accumulated bugs, excess privilege, weak authentication, and technical debt. Security teams — especially in critical infrastructure — are chronically under-resourced. ANCAP treats this as a leadership-level risk, not a back-office checklist.",
    cyberP2Title: "2. Defenders need AI",
    cyberP2Body:
      "The same class of models that will make attacks cheaper can also give more teams expert-grade defensive skill and make baseline security work faster and cheaper. Proven tools and patches from one organization should help many. ANCAP will use AI to strengthen defensive workflows, proof trails, and operator checks — not to lower the cost of offense.",
    cyberP3Title: "3. The response must be collective",
    cyberP3Body:
      "No single company controls the threat surface. Vendors hold attack data and tools, model builders hold the models, governments hold coordination and budget, and operators know their own systems. ANCAP agrees that these parts must be joined so one victim’s experience raises the cost of the next attack.",
    cyberCommitTitle: "ANCAP commitments under this policy",
    cyberC1Title: "Leadership priority",
    cyberC1Body:
      "Cybersecurity is treated with incident-level urgency: close the most dangerous weaknesses, verify the result, and raise the bar for what we buy, ship, and run — including AI-written code.",
    cyberC2Title: "Defensive use of AI",
    cyberC2Body:
      "ANCAP will apply AI to defensive tasks, auditability, and operator support. Paid AI workflows and agents on the platform remain subject to prohibited-conduct rules against attacks, malware, fraud, and unauthorized access.",
    cyberC3Title: "Traceable agents",
    cyberC3Body:
      "AI-agent actions on ANCAP should be traceable and accountable through receipts, hashes, logs, and proof artifacts wherever the product already records execution.",
    cyberC4Title: "Shared standards",
    cyberC4Body:
      "ANCAP supports partnership, threat-information sharing, and common defensive standards among technology companies, infrastructure operators, and public institutions.",
    cyberC5Title: "Raise attacker cost",
    cyberC5Body:
      "The core economic test remains: an attack should cost more than it can return. ANCAP agrees that restoring that cost requires collective action, because no participant holds the full resource set alone.",
    cyberScopeTitle: "Scope and limits",
    cyberScope1:
      "This endorsement is a public-policy statement. It does not create a warranty, insurance, SLA, or government partnership by itself. Platform users remain bound by the User Agreement, including the prohibition on using ANCAP to attack systems, distribute malware, or bypass access controls. Offensive cyber assistance is outside the product.",
    cyberScope2: "Source document:",
  },
  ru: {
    lastUpdated: "Обновлено: 8 сентября 2026.",
    privacyLink: "Уведомление о конфиденциальности",
    cookiesLink: "Политика cookie",
    termsLink: "Пользовательское соглашение",
    cyberLink: "Коллективная киберзащита",
    acpLink: "Whitepaper ACP",
    termsKicker: "Юридическое соглашение",
    termsTitle: "Пользовательское соглашение ANCAP",
    termsIntro:
      "Это рабочий юридический шаблон сайта ANCAP. Перед тем как опираться на него как на окончательный договор, его должен проверить и дополнить квалифицированный юрист.",
    t1Title: "1. Стороны и принятие",
    t1Body:
      "Эти Условия — шаблон соглашения между оператором платформы ANCAP и каждым пользователем ancap.cloud, API, кошелька, магазина workflow, инструментов автора и связанных сервисов. Пользуясь сервисами, создавая аккаунт, подключая кошелёк, покупая workflow, публикуя листинг или используя API, вы принимаете эти Условия.",
    t2Title: "2. Реквизиты оператора",
    t2Body:
      "До коммерческого запуска оператор должен указать юридическое лицо, адрес регистрации, регистрационный номер, налоговый номер при необходимости, email поддержки и применимую юрисдикцию. Если подписанный корпоративный договор противоречит этим Условиям, для этого клиента действует подписанный договор.",
    t3Title: "3. Правоспособность",
    t3Body:
      "Вы должны иметь право заключать это соглашение и не можете пользоваться ANCAP, если законы, санкции, экспортный контроль или ограничения платформы это запрещают. Вы сами определяете, позволяют ли правила по криптоактивам, ИИ, данным, налогам и бизнесу в вашей юрисдикции задуманное использование.",
    t4Title: "4. Сервисы",
    t4Body:
      "ANCAP предоставляет платное исполнение AI-workflow, листинги, инструменты публикации для авторов, кошелёк и учёт ACP, платные API, квитанции с proof, образцы отчётов, поиск, аналитику и связанные операционные инструменты. Сервис может меняться по мере развития платформы.",
    t5Title: "5. ACP, кредиты, платежи и возвраты",
    t5Body:
      "ACP — основная расчётная и платёжная единица платформы. Кредиты, балансы кошелька, платёжные намерения и квитанции могут быть номинированы в ACP. Если отдельная политика не говорит иное, покупка workflow считается использованной с начала исполнения. Возвраты, кредиты или компенсация за сбойные запуски регулируются политикой платформы и могут зависеть от логов, статуса и proof-данных.",
    t6Title: "6. Результаты ИИ и обязанность проверки",
    t6Body:
      "Результаты ИИ могут быть неточными, неполными, запоздалыми или непригодными для конкретного юридического, финансового, технического, комплаенс- или бизнес-решения. ANCAP продаёт артефакты исполнения workflow, а не инвестиционные, юридические, налоговые, финансовые советы и не гарантирует бизнес-результат. Перед использованием вы обязаны проверить вывод.",
    t7Title: "7. Листинги авторов",
    t7Body:
      "Авторы могут подавать предложения workflow, схемы, цены, образцы, политики proof и связанные материалы. ANCAP может проверять, отклонять, приостанавливать, ранжировать, менять отображение или снимать листинги ради защиты пользователей, соблюдения закона, снижения спама и качества. Доход автора может зависеть от комиссии, холдов, возвратов, антиабьюза, налогов и правил выплат.",
    t8Title: "8. Использование API",
    t8Body:
      "Пользователи API обязаны защищать ключи, соблюдать лимиты, потолки расходов, идемпотентность и политики использования. ANCAP может ограничивать, приостанавливать или блокировать запросы, которые угрожают стабильности, нарушают политику, обходят оплату, собирают защищённые данные, злоупотребляют ИИ/LLM или создают правовой и security-риск.",
    t9Title: "9. Запрещённое поведение",
    t9Body:
      "Нельзя использовать ANCAP для мошенничества, обхода санкций, отмывания средств, атак на системы, распространения вредоносного ПО, нарушения частной жизни, нарушения IP, манипуляций рынком, выдачи себя за других, спама, представления вывода ИИ как сертифицированной консультации или незаконных финансовых промо.",
    t10Title: "10. Интеллектуальная собственность",
    t10Body:
      "ANCAP и лицензиары сохраняют права на платформу, ПО, бренд, документацию и системный дизайн. Вы сохраняете права на законный контент, который предоставляете. Вы даёте ANCAP права, необходимые для обработки входов, запуска workflow, генерации выходов, работы proof-квитанций, применения политик и улучшения сервиса, как описано в политике конфиденциальности.",
    t11Title: "11. Конфиденциальность, cookie и данные",
    t11Body:
      "Персональные данные и предпочтения cookie регулируются Уведомлением о конфиденциальности и Политикой cookie. Необходимое хранение поддерживает вход, безопасность, состояние кошелька, язык, тему и память согласия. Опциональная аналитика или маркетинг включаются только после действительного согласия, где оно требуется.",
    t12Title: "12. Отказ от гарантий и ограничение ответственности",
    t12Body:
      "В максимальной степени, допускаемой законом, ANCAP предоставляется «как есть» и «как доступно», без гарантий бесперебойной работы, безошибочного вывода ИИ, рыночной стоимости, ликвидности, регуляторного одобрения или пригодности для конкретной цели. Лимиты ответственности, исключения и обязательные права потребителей должен зафиксировать юрист юрисдикции оператора.",
    t13Title: "13. Приостановка и прекращение",
    t13Body:
      "ANCAP может приостановить или прекратить доступ, ключи, листинги, выплаты или workflow из соображений безопасности, злоупотреблений, задолженности, подозрения в мошенничестве, правового риска, нарушения политики или целостности платформы. Пользователь может прекратить использование в любой момент с учётом незакрытых обязательств и правил хранения данных.",
    t14Title: "14. Изменения",
    t14Body:
      "ANCAP может обновлять эти Условия при изменении продукта, закона или риск-среды. Существенные изменения следует сообщать через сайт, уведомление в аккаунте, email или иной разумный канал. Продолжение использования после даты вступления означает принятие обновлённых Условий.",
    t15Title: "15. Коллективная киберзащита",
    t15Body:
      "ANCAP согласна с открытым письмом OpenAI «Призыв к коллективным действиям в киберзащите». Кибербезопасность для ANCAP — обязанность уровня руководства: текущих мер недостаточно, защитникам нужен ИИ, чтобы закрывать накопленные слабости, а ответ должен быть коллективным, чтобы атака стоила больше, чем может принести. Пользователям нельзя использовать ANCAP для атак на системы, распространения вредоносного ПО или обхода доступа. Публичное согласие и обязательства компании входят в юридическую информацию ANCAP.",
    privacyKicker: "Уведомление о конфиденциальности",
    privacyTitle: "Как ANCAP обрабатывает данные",
    privacyIntro:
      "Это уведомление описывает практические категории данных аккаунтов, кошельков, платных workflow, API, proof-квитанций и безопасности платформы. Его нужно дополнить финальными реквизитами оператора, email для запросов, списком обработчиков и раскрытиями по юрисдикции.",
    p1Title: "Какие данные обрабатываем",
    p1Body:
      "Данные аккаунта, адреса кошельков, метаданные API-ключей, входы workflow, сгенерированные выходы, метаданные платежей, квитанции, proof-хеши, обращения в поддержку, данные устройства/сессии, логи и выбор согласия.",
    p2Title: "Зачем обрабатываем",
    p2Body:
      "Чтобы предоставлять аккаунты, доступ к кошельку, исполнение workflow, листинги авторов, платный API, биллинг, защиту от мошенничества, безопасность, поддержку, продуктовую аналитику, соблюдение закона и устойчивость сервиса.",
    p3Title: "Крипто и публичные proof",
    p3Body:
      "Часть блокчейн-данных, адресов кошельков, ссылок на транзакции, хешей и публичных proof-URL может быть видна публично или в сети и не всегда может быть удалена ANCAP.",
    p4Title: "Провайдеры ИИ",
    p4Body:
      "Входы workflow могут передаваться настроенным LLM-провайдерам, если это нужно для исполнения. Чувствительные, регулируемые или конфиденциальные данные не следует отправлять, пока ваша организация это не одобрила.",
    p5Title: "Срок хранения",
    p5Body:
      "Операционные, биллинговые, security-, аудиторские данные и квитанции могут храниться столько, сколько нужно для целостности сервиса, учёта, споров, антиабьюза и правовых обязанностей.",
    p6Title: "Ваши права",
    p6Body:
      "В зависимости от применимого права вы можете запросить доступ, исправление, удаление, ограничение, переносимость или возражение. Часть запросов может быть ограничена мошенничеством, аудитом, блокчейном, налогами, безопасностью или обязательным хранением.",
    privacySecurityTitle: "Безопасность и коллективная киберзащита",
    privacySecurityBody:
      "ANCAP обрабатывает security-логи, данные сессий и proof-артефакты для предотвращения мошенничества и злоупотреблений. Компания согласна с открытым письмом OpenAI о глобальном усилении коллективной киберзащиты. Публичное заявление и обязательства опубликованы на этом сайте.",
    privacyContactTitle: "Контакты и правовые основания",
    privacyContactBody:
      "В финальной политике нужно указать контролёра/оператора, контакт по приватности, правовые основания (договор, законный интерес, согласие, правовая обязанность) и гарантии трансграничной передачи, если провайдеры или инфраструктура находятся вне юрисдикции пользователя.",
    cookiesKicker: "Политика cookie",
    cookiesTitle: "Настройки cookie и хранения",
    cookiesIntro:
      "ANCAP показывает баннер согласия с равным доступом: принять опциональное хранение, отклонить его или настроить предпочтения. Необходимая запись согласия сохраняется, чтобы баннер не появлялся снова и снова.",
    c1Title: "Строго необходимые",
    c1Examples: "Память согласия, состояние входа/сессии, проверки безопасности, состояние кошелька, язык, тема, поддержка service worker.",
    c1Consent: "Используются без опционального согласия там, где это нужно для работы сайта.",
    c2Title: "Аналитика",
    c2Examples: "События воронки, производительность страниц, диагностика ошибок, конверсия workflow, агрегированные продуктовые метрики.",
    c2Consent: "По умолчанию выключены и включаются только после согласия, где оно требуется.",
    c3Title: "Маркетинг и атрибуция",
    c3Examples: "Источник кампании, реферальная атрибуция, партнёрский код, атрибуция платного запуска.",
    c3Consent: "По умолчанию выключены и включаются только после согласия, где оно требуется.",
    cookiesExamples: "Примеры:",
    cookiesConsent: "Согласие:",
    cookiesRegTitle: "Регуляторные ориентиры",
    cookiesRegBody:
      "В ЕС и Великобритании обычно различают строго необходимое хранение и опциональную аналитику или маркетинг. Опциональные категории требуют информированного согласия и не должны быть включены заранее там, где согласие обязательно.",
    cookiesEc: "Пример cookie-политики Европейской комиссии",
    cookiesEdpb: "Руководство EDPB по согласию",
    cyberKicker: "Право / публичная политика",
    cyberTitle: "Согласие ANCAP с коллективной киберзащитой",
    cyberIntro:
      "ANCAP публично согласна с открытым письмом OpenAI «Призыв к коллективным действиям в киберзащите» и с предложенным глобальным усилением защиты. Эта страница — юридическое и политическое заявление компании. Она не заменяет Пользовательское соглашение, Уведомление о конфиденциальности и Политику cookie.",
    openLetter: "Открытое письмо (openai.com)",
    cyberStatementTitle: "Заявление о согласии",
    cyberStatement1:
      "ANCAP как оператор ancap.cloud и связанных сервисов ACP, кошелька, workflow и API согласна с исходным тезисом письма: окно для укрепления киберзащиты ограничено. Атаки с ИИ дешевеют, автоматизируются и становятся массовыми, в том числе против больниц, водоснабжения и инфраструктуры интернета. Те же модели могут помочь защитникам закрыть слабости, копившиеся годами. Поэтому ANCAP поддерживает призыв сделать кибербезопасность приоритетом руководства, финансировать защиту операторов без своих ресурсов, делиться проверенными плейбуками и делать действия AI-агентов подотчётными.",
    cyberStatement2:
      "Среди подписантов письма — технологические, security-, платёжные, телеком- и промышленные компании, которые конкурируют на обычных рынках, но объединились перед общей угрозой. ANCAP не входит в официальный список подписантов. Эта страница фиксирует самостоятельное согласие ANCAP с той же политикой и теми же тремя принципами.",
    cyberP1Title: "1. Текущей безопасности недостаточно",
    cyberP1Body:
      "Системы уязвимы из-за старых ошибок, избыточных прав, слабой аутентификации и техдолга. Команды безопасности, особенно в критической инфраструктуре, хронически недофинансированы. Для ANCAP это риск уровня руководства, а не внутренний чеклист.",
    cyberP2Title: "2. Защитникам нужен ИИ",
    cyberP2Body:
      "Тот же класс моделей, который удешевляет атаки, может дать большему числу команд экспертные навыки защиты и сделать базовые задачи безопасности быстрее и дешевле. Проверенные инструменты и исправления одной организации должны защищать многие. ANCAP будет применять ИИ для усиления защитных workflow, цепочек proof и проверок операторов — не для удешевления атаки.",
    cyberP3Title: "3. Ответ должен быть коллективным",
    cyberP3Body:
      "Ни одна компания не контролирует поверхность угроз в одиночку. У вендоров — данные об атаках и инструменты, у создателей моделей — сами модели, у государств — координация и бюджет, у организаций — знание своих систем. ANCAP согласна, что эти части нужно соединить, чтобы опыт одной жертвы повышал цену следующей атаки.",
    cyberCommitTitle: "Обязательства ANCAP по этой политике",
    cyberC1Title: "Приоритет руководства",
    cyberC1Body:
      "Кибербезопасность ведётся со срочностью инцидента: закрывать самые опасные слабости, проверять результат и повышать требования к тому, что покупаем, выпускаем и запускаем, включая код, написанный ИИ.",
    cyberC2Title: "Защитное применение ИИ",
    cyberC2Body:
      "ANCAP применяет ИИ к защитным задачам, аудируемости и поддержке операторов. Платные workflow и агенты на платформе остаются под запретом атак, вредоносного ПО, мошенничества и несанкционированного доступа.",
    cyberC3Title: "Прослеживаемые агенты",
    cyberC3Body:
      "Действия AI-агентов на ANCAP должны быть прослеживаемыми и подотчётными через квитанции, хеши, логи и proof-артефакты там, где продукт уже фиксирует исполнение.",
    cyberC4Title: "Общие стандарты",
    cyberC4Body:
      "ANCAP поддерживает партнёрства, обмен данными об угрозах и общие защитные стандарты между технологическими компаниями, операторами инфраструктуры и государственными институтами.",
    cyberC5Title: "Повышать цену атаки",
    cyberC5Body:
      "Базовый экономический тест остаётся прежним: атака должна стоить больше, чем может принести. ANCAP согласна, что вернуть эту цену поодиночке нельзя: ни у кого нет полного набора ресурсов.",
    cyberScopeTitle: "Объём и ограничения",
    cyberScope1:
      "Это заявление публичной политики. Само по себе оно не создаёт гарантию, страховку, SLA или партнёрство с государством. Пользователи платформы по-прежнему связаны Пользовательским соглашением, включая запрет использовать ANCAP для атак на системы, распространения вредоносного ПО или обхода доступа. Наступательная киберпомощь вне продукта.",
    cyberScope2: "Исходный документ:",
  },
  uk: {
    lastUpdated: "Оновлено: 8 вересня 2026.",
    privacyLink: "Повідомлення про конфіденційність",
    cookiesLink: "Політика cookie",
    termsLink: "Угода користувача",
    cyberLink: "Колективний кіберзахист",
    acpLink: "Whitepaper ACP",
    termsKicker: "Юридична угода",
    termsTitle: "Угода користувача ANCAP",
    termsIntro:
      "Це робочий юридичний шаблон сайту ANCAP. Перш ніж покладатися на нього як на остаточний договір, його має перевірити й доповнити кваліфікований юрист.",
    t1Title: "1. Сторони та прийняття",
    t1Body:
      "Ці Умови — шаблон угоди між оператором платформи ANCAP і кожним користувачем ancap.cloud, API, гаманця, магазину workflow, інструментів автора та пов’язаних сервісів. Користуючись сервісами, створюючи обліковий запис, підключаючи гаманець, купуючи workflow, публікуючи лістинг або використовуючи API, ви приймаєте ці Умови.",
    t2Title: "2. Реквізити оператора",
    t2Body:
      "До комерційного запуску оператор має вказати юридичну особу, адресу реєстрації, реєстраційний номер, податковий номер за потреби, email підтримки та застосовну юрисдикцію. Якщо підписана корпоративна угода суперечить цим Умовам, для цього клієнта діє підписана угода.",
    t3Title: "3. Правоздатність",
    t3Body:
      "Ви повинні мати право укладати цю угоду і не можете користуватися ANCAP, якщо закони, санкції, експортний контроль або обмеження платформи це забороняють. Ви самі визначаєте, чи дозволяють правила щодо криптоактивів, ШІ, даних, податків і бізнесу у вашій юрисдикції задумане використання.",
    t4Title: "4. Сервіси",
    t4Body:
      "ANCAP надає платне виконання AI-workflow, лістинги, інструменти публікації для авторів, гаманець і облік ACP, платні API, квитанції з proof, зразки звітів, пошук, аналітику та пов’язані операційні інструменти. Сервіс може змінюватися з розвитком платформи.",
    t5Title: "5. ACP, кредити, платежі та повернення",
    t5Body:
      "ACP — основна розрахункова й платіжна одиниця платформи. Кредити, баланси гаманця, платіжні наміри та квитанції можуть бути номіновані в ACP. Якщо окрема політика не каже інакше, купівля workflow вважається використаною з початку виконання. Повернення, кредити чи компенсація за збійні запуски регулюються політикою платформи й можуть залежати від логів, статусу та proof-даних.",
    t6Title: "6. Результати ШІ та обов’язок перевірки",
    t6Body:
      "Результати ШІ можуть бути неточними, неповними, запізнілими або непридатними для конкретного юридичного, фінансового, технічного, комплаєнс- чи бізнес-рішення. ANCAP продає артефакти виконання workflow, а не інвестиційні, юридичні, податкові, фінансові поради й не гарантує бізнес-результат. Перед використанням ви зобов’язані перевірити вивід.",
    t7Title: "7. Лістинги авторів",
    t7Body:
      "Автори можуть подавати пропозиції workflow, схеми, ціни, зразки, політики proof і пов’язані матеріали. ANCAP може перевіряти, відхиляти, призупиняти, ранжувати, змінювати відображення або знімати лістинги задля захисту користувачів, дотримання закону, зменшення спаму та якості. Дохід автора може залежати від комісії, холдів, повернень, антиаб’юзу, податків і правил виплат.",
    t8Title: "8. Використання API",
    t8Body:
      "Користувачі API зобов’язані захищати ключі, дотримуватися лімітів, стель витрат, ідемпотентності та політик використання. ANCAP може обмежувати, призупиняти або блокувати запити, що загрожують стабільності, порушують політику, обходять оплату, збирають захищені дані, зловживають ШІ/LLM або створюють правовий і security-ризик.",
    t9Title: "9. Заборонена поведінка",
    t9Body:
      "Не можна використовувати ANCAP для шахрайства, обходу санкцій, відмивання коштів, атак на системи, поширення шкідливого ПЗ, порушення приватности, порушення IP, маніпуляцій ринком, видавання себе за інших, спаму, представлення виводу ШІ як сертифікованої консультації або незаконних фінансових промо.",
    t10Title: "10. Інтелектуальна власність",
    t10Body:
      "ANCAP і ліцензіари зберігають права на платформу, ПЗ, бренд, документацію та системний дизайн. Ви зберігаєте права на законний контент, який надаєте. Ви даєте ANCAP права, потрібні для обробки входів, запуску workflow, генерації виходів, роботи proof-квитанцій, застосування політик і покращення сервісу, як описано в політиці конфіденційності.",
    t11Title: "11. Конфіденційність, cookie і дані",
    t11Body:
      "Персональні дані та вподобання cookie регулюються Повідомленням про конфіденційність і Політикою cookie. Необхідне зберігання підтримує вхід, безпеку, стан гаманця, мову, тему й пам’ять згоди. Опціональна аналітика чи маркетинг вмикаються лише після дійсної згоди, де вона потрібна.",
    t12Title: "12. Відмова від гарантій і обмеження відповідальності",
    t12Body:
      "Максимальною мірою, дозволеною законом, ANCAP надається «як є» та «як доступно», без гарантій безперебійної роботи, безпомилкового виводу ШІ, ринкової вартості, ліквідності, регуляторного схвалення чи придатності для конкретної мети. Ліміти відповідальності, винятки й обов’язкові права споживачів має зафіксувати юрист юрисдикції оператора.",
    t13Title: "13. Призупинення і припинення",
    t13Body:
      "ANCAP може призупинити або припинити доступ, ключі, лістинги, виплати чи workflow з міркувань безпеки, зловживань, заборгованості, підозри у шахрайстві, правового ризику, порушення політики або цілісності платформи. Користувач може припинити використання будь-коли з урахуванням незакритих зобов’язань і правил зберігання даних.",
    t14Title: "14. Зміни",
    t14Body:
      "ANCAP може оновлювати ці Умови зі зміною продукту, закону чи ризик-середовища. Істотні зміни слід повідомляти через сайт, сповіщення в обліковому записі, email або інший розумний канал. Продовження використання після дати набрання чинності означає прийняття оновлених Умов.",
    t15Title: "15. Колективний кіберзахист",
    t15Body:
      "ANCAP погоджується з відкритим листом OpenAI «Заклик до колективних дій у кіберзахисті». Кібербезпека для ANCAP — обов’язок рівня керівництва: поточних заходів недостатньо, захисникам потрібен ШІ, щоб закривати накопичені слабкості, а відповідь має бути колективною, щоб атака коштувала більше, ніж може принести. Користувачам не можна використовувати ANCAP для атак на системи, поширення шкідливого ПЗ або обходу доступу. Публічна згода й зобов’язання компанії входять до юридичної інформації ANCAP.",
    privacyKicker: "Повідомлення про конфіденційність",
    privacyTitle: "Як ANCAP обробляє дані",
    privacyIntro:
      "Це повідомлення описує практичні категорії даних облікових записів, гаманців, платних workflow, API, proof-квитанцій і безпеки платформи. Його потрібно доповнити фінальними реквізитами оператора, email для запитів, списком обробників і розкриттями за юрисдикцією.",
    p1Title: "Які дані обробляємо",
    p1Body:
      "Дані облікового запису, адреси гаманців, метадані API-ключів, входи workflow, згенеровані виходи, метадані платежів, квитанції, proof-хеші, звернення в підтримку, дані пристрою/сесії, логи та вибір згоди.",
    p2Title: "Навіщо обробляємо",
    p2Body:
      "Щоб надавати облікові записи, доступ до гаманця, виконання workflow, лістинги авторів, платний API, білінг, захист від шахрайства, безпеку, підтримку, продуктову аналітику, дотримання закону й стійкість сервісу.",
    p3Title: "Крипто і публічні proof",
    p3Body:
      "Частина блокчейн-даних, адрес гаманців, посилань на транзакції, хешів і публічних proof-URL може бути видимою публічно або в мережі й не завжди може бути видалена ANCAP.",
    p4Title: "Провайдери ШІ",
    p4Body:
      "Входи workflow можуть передаватися налаштованим LLM-провайдерам, якщо це потрібно для виконання. Чутливі, регульовані чи конфіденційні дані не слід надсилати, доки ваша організація це не схвалила.",
    p5Title: "Строк зберігання",
    p5Body:
      "Операційні, білінгові, security-, аудиторські дані та квитанції можуть зберігатися стільки, скільки потрібно для цілісності сервісу, обліку, спорів, антиаб’юзу та правових обов’язків.",
    p6Title: "Ваші права",
    p6Body:
      "Залежно від застосовного права ви можете запитати доступ, виправлення, видалення, обмеження, перенесення або заперечення. Частина запитів може бути обмежена шахрайством, аудитом, блокчейном, податками, безпекою або обов’язковим зберіганням.",
    privacySecurityTitle: "Безпека і колективний кіберзахист",
    privacySecurityBody:
      "ANCAP обробляє security-логи, дані сесій і proof-артефакти для запобігання шахрайству та зловживанням. Компанія погоджується з відкритим листом OpenAI про глобальне посилення колективного кіберзахисту. Публічна заява й зобов’язання опубліковані на цьому сайті.",
    privacyContactTitle: "Контакти та правові підстави",
    privacyContactBody:
      "У фінальній політиці потрібно вказати контролера/оператора, контакт із приватності, правові підстави (договір, законний інтерес, згода, правовий обов’язок) і гарантії транскордонної передачі, якщо провайдери чи інфраструктура перебувають поза юрисдикцією користувача.",
    cookiesKicker: "Політика cookie",
    cookiesTitle: "Налаштування cookie і зберігання",
    cookiesIntro:
      "ANCAP показує банер згоди з рівним доступом: прийняти опціональне зберігання, відхилити його або налаштувати вподобання. Необхідний запис згоди зберігається, щоб банер не з’являвся знову й знову.",
    c1Title: "Суворо необхідні",
    c1Examples: "Пам’ять згоди, стан входу/сесії, перевірки безпеки, стан гаманця, мова, тема, підтримка service worker.",
    c1Consent: "Використовуються без опціональної згоди там, де це потрібно для роботи сайту.",
    c2Title: "Аналітика",
    c2Examples: "Події воронки, продуктивність сторінок, діагностика помилок, конверсія workflow, агреговані продуктові метрики.",
    c2Consent: "За замовчуванням вимкнені й вмикаються лише після згоди, де вона потрібна.",
    c3Title: "Маркетинг і атрибуція",
    c3Examples: "Джерело кампанії, реферальна атрибуція, партнерський код, атрибуція платного запуску.",
    c3Consent: "За замовчуванням вимкнені й вмикаються лише після згоди, де вона потрібна.",
    cookiesExamples: "Приклади:",
    cookiesConsent: "Згода:",
    cookiesRegTitle: "Регуляторні орієнтири",
    cookiesRegBody:
      "В ЄС і Великій Британії зазвичай розрізняють суворо необхідне зберігання та опціональну аналітику чи маркетинг. Опціональні категорії потребують поінформованої згоди й не повинні бути ввімкнені заздалегідь там, де згода обов’язкова.",
    cookiesEc: "Приклад cookie-політики Європейської комісії",
    cookiesEdpb: "Настанови EDPB щодо згоди",
    cyberKicker: "Право / публічна політика",
    cyberTitle: "Згода ANCAP з колективним кіберзахистом",
    cyberIntro:
      "ANCAP публічно погоджується з відкритим листом OpenAI «Заклик до колективних дій у кіберзахисті» та із запропонованим глобальним посиленням захисту. Ця сторінка — юридична й політична заява компанії. Вона не замінює Угоду користувача, Повідомлення про конфіденційність і Політику cookie.",
    openLetter: "Відкритий лист (openai.com)",
    cyberStatementTitle: "Заява про згоду",
    cyberStatement1:
      "ANCAP як оператор ancap.cloud і пов’язаних сервісів ACP, гаманця, workflow і API погоджується з вихідним тезисом листа: вікно для зміцнення кіберзахисту обмежене. Атаки з ШІ дешевшають, автоматизуються й стають масовими, зокрема проти лікарень, водопостачання та інфраструктури інтернету. Ті самі моделі можуть допомогти захисникам закрити слабкості, що накопичувалися роками. Тому ANCAP підтримує заклик зробити кібербезпеку пріоритетом керівництва, фінансувати захист операторів без власних ресурсів, ділитися перевіреними плейбуками й робити дії AI-агентів підзвітними.",
    cyberStatement2:
      "Серед підписантів листа — технологічні, security-, платіжні, телеком- і промислові компанії, які конкурують на звичайних ринках, але об’єдналися перед спільною загрозою. ANCAP не входить до офіційного списку підписантів. Ця сторінка фіксує самостійну згоду ANCAP з тією самою політикою і тими самими трьома принципами.",
    cyberP1Title: "1. Поточної безпеки недостатньо",
    cyberP1Body:
      "Системи вразливі через старі помилки, надмірні права, слабку автентифікацію й техборг. Команди безпеки, особливо в критичній інфраструктурі, хронічно недофінансовані. Для ANCAP це ризик рівня керівництва, а не внутрішній чекліст.",
    cyberP2Title: "2. Захисникам потрібен ШІ",
    cyberP2Body:
      "Той самий клас моделей, що здешевлює атаки, може дати більшій кількості команд експертні навички захисту й зробити базові завдання безпеки швидшими та дешевшими. Перевірені інструменти й виправлення однієї організації мають захищати багато. ANCAP застосовуватиме ШІ для посилення захисних workflow, ланцюжків proof і перевірок операторів — не для здешевлення атаки.",
    cyberP3Title: "3. Відповідь має бути колективною",
    cyberP3Body:
      "Жодна компанія не контролює поверхню загроз наодинці. У вендорів — дані про атаки й інструменти, у творців моделей — самі моделі, у держав — координація і бюджет, в організацій — знання власних систем. ANCAP погоджується, що ці частини потрібно з’єднати, щоб досвід однієї жертви підвищував ціну наступної атаки.",
    cyberCommitTitle: "Зобов’язання ANCAP за цією політикою",
    cyberC1Title: "Пріоритет керівництва",
    cyberC1Body:
      "Кібербезпека ведеться зі терміновістю інциденту: закривати найнебезпечніші слабкості, перевіряти результат і підвищувати вимоги до того, що купуємо, випускаємо й запускаємо, включно з кодом, написаним ШІ.",
    cyberC2Title: "Захисне застосування ШІ",
    cyberC2Body:
      "ANCAP застосовує ШІ до захисних завдань, аудитованності та підтримки операторів. Платні workflow і агенти на платформі залишаються під забороною атак, шкідливого ПЗ, шахрайства та несанкціонованого доступу.",
    cyberC3Title: "Простежувані агенти",
    cyberC3Body:
      "Дії AI-агентів на ANCAP мають бути простежуваними й підзвітними через квитанції, хеші, логи та proof-артефакти там, де продукт уже фіксує виконання.",
    cyberC4Title: "Спільні стандарти",
    cyberC4Body:
      "ANCAP підтримує партнерства, обмін даними про загрози та спільні захисні стандарти між технологічними компаніями, операторами інфраструктури та державними інституціями.",
    cyberC5Title: "Підвищувати ціну атаки",
    cyberC5Body:
      "Базовий економічний тест лишається тим самим: атака має коштувати більше, ніж може принести. ANCAP погоджується, що повернути цю ціну наодинці неможливо: ні в кого немає повного набору ресурсів.",
    cyberScopeTitle: "Обсяг і обмеження",
    cyberScope1:
      "Це заява публічної політики. Сама по собі вона не створює гарантію, страховку, SLA чи партнерство з державою. Користувачі платформи й надалі пов’язані Угодою користувача, включно із забороною використовувати ANCAP для атак на системи, поширення шкідливого ПЗ або обходу доступу. Наступальна кібердопомога поза продуктом.",
    cyberScope2: "Вихідний документ:",
  },
  de: {
    lastUpdated: "Zuletzt aktualisiert: 8. September 2026.",
    privacyLink: "Datenschutzhinweis",
    cookiesLink: "Cookie-Richtlinie",
    termsLink: "Nutzungsvereinbarung",
    cyberLink: "Kollektive Cyberabwehr",
    acpLink: "ACP-Whitepaper",
    termsKicker: "Rechtsvereinbarung",
    termsTitle: "ANCAP-Nutzungsvereinbarung",
    termsIntro:
      "Dies ist eine produktionsreife Rechtsvorlage für die ANCAP-Website. Bevor sie als endgültige bindende Vereinbarung gilt, muss sie von qualifizierter Rechtsberatung geprüft und vervollständigt werden.",
    t1Title: "1. Parteien und Annahme",
    t1Body:
      "Diese Bedingungen sind eine Vorlagenvereinbarung zwischen dem ANCAP-Plattformbetreiber und jedem Nutzer von ancap.cloud, der API, der Wallet, des Workflow-Stores, der Creator-Tools und verwandter Dienste. Durch Nutzung der Dienste, Kontoerstellung, Wallet-Verbindung, Workflow-Kauf, Listing-Veröffentlichung oder API-Nutzung stimmen Sie diesen Bedingungen zu.",
    t2Title: "2. Angaben zum Betreiber",
    t2Body:
      "Vor dem kommerziellen Start muss der Betreiber den Rechtsträger, die Adresse, die Registernummer, ggf. die Steuernummer, die Support-E-Mail und die geltende Rechtsordnung eintragen. Widerspricht eine unterzeichnete Enterprise-Vereinbarung diesen Bedingungen, gilt für diesen Kunden die unterzeichnete Vereinbarung.",
    t3Title: "3. Berechtigung",
    t3Body:
      "Sie müssen geschäftsfähig sein und dürfen ANCAP nicht nutzen, wenn Gesetze, Sanktionen, Exportkontrollen oder Plattformbeschränkungen das verbieten. Sie prüfen selbst, ob Krypto-, KI-, Daten-, Steuer- und Geschäftsregeln Ihrer Rechtsordnung die geplante Nutzung erlauben.",
    t4Title: "4. Dienste",
    t4Body:
      "ANCAP bietet bezahlte KI-Workflow-Ausführung, Listings, Creator-Publishing, ACP-Wallet/Buchhaltung, bezahlte API-Produkte, Proof-Quittungen, Beispielberichte, Suche, Analytik und verwandte Betriebswerkzeuge. Der Dienst kann sich mit der Plattform weiterentwickeln.",
    t5Title: "5. ACP, Guthaben, Zahlungen und Erstattungen",
    t5Body:
      "ACP ist die primäre Buchungs- und Zahlungseinheit. Guthaben, Wallet-Salden, Zahlungsabsichten und Quittungen können in ACP lauten. Sofern keine andere Richtlinie gilt, gilt ein Workflow-Kauf mit Beginn der Ausführung als verbraucht. Erstattungen, Gutschriften oder Ausgleich für fehlgeschlagene Läufe folgen der Plattformrichtlinie und können von Logs, Status und Proof-Daten abhängen.",
    t6Title: "6. KI-Ausgaben und Prüfungspflicht",
    t6Body:
      "KI-Ausgaben können ungenau, unvollständig, verspätet oder für eine konkrete rechtliche, finanzielle, technische, Compliance- oder Geschäftsentscheidung ungeeignet sein. ANCAP verkauft Ausführungsartefakte, keine Anlage-, Rechts-, Steuer- oder Finanzberatung und keine garantierten Geschäftsergebnisse. Sie müssen Ausgaben prüfen, bevor Sie sich darauf stützen.",
    t7Title: "7. Creator-Listings",
    t7Body:
      "Creator können Workflow-Angebote, Schemas, Preise, Samples, Proof-Richtlinien und zugehörige Materialien einreichen. ANCAP darf Listings prüfen, ablehnen, aussetzen, ranken, anzeigen oder entfernen, um Nutzer zu schützen, Recht einzuhalten, Spam zu senken und Qualität zu sichern. Einnahmen können Provisionen, Holds, Erstattungen, Missbrauchskontrollen, Steuern und Auszahlungsregeln unterliegen.",
    t8Title: "8. API-Nutzung",
    t8Body:
      "API-Nutzer müssen Schlüssel schützen und Limits, Ausgabenobergrenzen, Idempotenz und Nutzungsrichtlinien einhalten. ANCAP darf Anfragen drosseln, aussetzen oder blockieren, die Stabilität bedrohen, Richtlinien verletzen, Zahlung umgehen, geschützte Ressourcen scrapen, KI/LLM missbrauchen oder rechtliches/Sicherheitsrisiko erzeugen.",
    t9Title: "9. Verbotenes Verhalten",
    t9Body:
      "Sie dürfen ANCAP nicht für Betrug, Sanktionsumgehung, Geldwäsche, Systemangriffe, Malware, Verletzung der Privatsphäre, IP-Verletzung, Marktmanipulation, Identitätsvortäuschung, Spam, Darstellung von KI-Ausgaben als zertifizierte Beratung oder illegale Finanzwerbung nutzen.",
    t10Title: "10. Geistiges Eigentum",
    t10Body:
      "ANCAP und Lizenzgeber behalten Rechte an Plattform, Software, Marke, Dokumentation und Systemdesign. Sie behalten Rechte an rechtmäßig bereitgestellten Inhalten. Sie räumen ANCAP die Rechte ein, die zur Verarbeitung von Eingaben, Workflow-Ausführung, Ausgabeerzeugung, Proof-Quittungen, Durchsetzung von Richtlinien und Dienstverbesserung gemäß Datenschutzbedingungen nötig sind.",
    t11Title: "11. Datenschutz, Cookies und Daten",
    t11Body:
      "Personenbezogene Daten und Cookie-Präferenzen unterliegen dem Datenschutzhinweis und der Cookie-Richtlinie. Notwendiger Speicher unterstützt Login, Sicherheit, Wallet-Status, Sprache, Theme und Einwilligungsspeicher. Optionale Analyse- oder Marketing-Speicherung darf nur nach gültiger Einwilligung aktiviert werden, wo sie erforderlich ist.",
    t12Title: "12. Haftungsausschluss und Haftungsbegrenzung",
    t12Body:
      "Soweit gesetzlich zulässig wird ANCAP „wie besehen“ und „wie verfügbar“ ohne Gewähr ununterbrochener Nutzung, fehlerfreier KI-Ausgabe, Marktwert, Liquidität, regulatorischer Genehmigung oder Eignung für einen bestimmten Zweck bereitgestellt. Haftungsgrenzen, Ausschlüsse und zwingende Verbraucherrechte muss die Rechtsberatung der Betreiberjurisdiktion festlegen.",
    t13Title: "13. Aussetzung und Beendigung",
    t13Body:
      "ANCAP kann Zugang, Schlüssel, Listings, Auszahlungen oder Workflows aus Sicherheits-, Missbrauchs-, Zahlungs-, Betrugs-, Rechts-, Richtlinien- oder Integritätsgründen aussetzen oder beenden. Nutzer können die Nutzung jederzeit beenden, vorbehaltlich offener Pflichten und Aufbewahrungsregeln.",
    t14Title: "14. Änderungen",
    t14Body:
      "ANCAP kann diese Bedingungen bei Änderungen von Produkt, Recht oder Risikoumfeld aktualisieren. Wesentliche Änderungen sollen über die Website, Kontohinweis, E-Mail oder einen anderen angemessenen Kanal mitgeteilt werden. Fortgesetzte Nutzung nach dem Wirksamkeitsdatum bedeutet Annahme der aktualisierten Bedingungen.",
    t15Title: "15. Kollektive Cyberabwehr",
    t15Body:
      "ANCAP stimmt dem OpenAI-Offenen Brief „A call for collective action on cyber defense“ zu. Cybersicherheit ist für ANCAP eine Führungsaufgabe: heutige Kontrollen reichen nicht, Verteidiger brauchen KI, um aufgestaute Schwächen zu schließen, und die Antwort muss kollektiv sein, damit ein Angriff mehr kostet, als er einbringen kann. Nutzer dürfen ANCAP nicht für Systemangriffe, Malware oder Zugriffs­umgehung nutzen. Die öffentliche Zustimmung und die Verpflichtungen sind Teil der rechtlichen und politischen Informationen von ANCAP.",
    privacyKicker: "Datenschutzhinweis",
    privacyTitle: "Wie ANCAP Daten verarbeitet",
    privacyIntro:
      "Dieser Hinweis erklärt die praktischen Datenkategorien hinter Konten, Wallets, bezahlten Workflows, API-Nutzung, Proof-Quittungen und Plattformsicherheit. Er muss um die endgültige Betreiberidentität, Kontakt-E-Mail, Auftragsverarbeiterliste und rechtsordnungsspezifische Angaben ergänzt werden.",
    p1Title: "Welche Daten wir verarbeiten",
    p1Body:
      "Kontodaten, Wallet-Adressen, API-Schlüssel-Metadaten, Workflow-Eingaben, erzeugte Ausgaben, Zahlungsmetadaten, Quittungen, Proof-Hashes, Support-Nachrichten, Geräte-/Sitzungsdaten, Logs und Einwilligungsentscheidungen.",
    p2Title: "Warum wir sie verarbeiten",
    p2Body:
      "Um Konten, Wallet-Zugang, Workflow-Ausführung, Creator-Listings, bezahlte API, Abrechnung, Betrugsabwehr, Sicherheit, Support, Produktanalytik, Rechtskonformität und Betriebssicherheit bereitzustellen.",
    p3Title: "Krypto und öffentliche Proofs",
    p3Body:
      "Einige Blockchain-Daten, Wallet-Adressen, Transaktionsreferenzen, Hashes und öffentliche Proof-URLs können öffentlich oder on-chain sichtbar sein und von ANCAP nicht immer gelöscht werden.",
    p4Title: "KI-Anbieter",
    p4Body:
      "Workflow-Eingaben können an konfigurierte LLM-Anbieter gehen, wenn die Ausführung das erfordert. Sensible, regulierte oder vertrauliche Daten sollten nicht übermittelt werden, solange Ihre Organisation das nicht freigegeben hat.",
    p5Title: "Aufbewahrung",
    p5Body:
      "Betriebs-, Abrechnungs-, Sicherheits-, Audit- und Quittungsdaten können so lange aufbewahrt werden, wie es für Integrität, Buchhaltung, Streitbeilegung, Missbrauchsabwehr und Rechtspflichten nötig ist.",
    p6Title: "Ihre Rechte",
    p6Body:
      "Je nach anwendbarem Recht können Sie Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit oder Widerspruch verlangen. Manche Anfragen können durch Betrug, Audit, Blockchain, Steuern, Sicherheit oder gesetzliche Aufbewahrung begrenzt sein.",
    privacySecurityTitle: "Sicherheit und kollektive Cyberabwehr",
    privacySecurityBody:
      "ANCAP verarbeitet Sicherheitslogs, Sitzungsdaten und Proof-Artefakte zur Betrugs- und Missbrauchsabwehr. ANCAP stimmt dem OpenAI-Offenen Brief zu einem globalen Schub kollektiver Cyberabwehr zu. Die öffentliche Erklärung und die Verpflichtungen sind auf dieser Website veröffentlicht.",
    privacyContactTitle: "Kontakt und Rechtsgrundlagen",
    privacyContactBody:
      "Die endgültige Richtlinie soll den Verantwortlichen/Betreiber, den Datenschutzkontakt, Rechtsgrundlagen wie Vertrag, berechtigtes Interesse, Einwilligung und Rechtspflicht sowie Schutzmaßnahmen für internationale Übermittlungen nennen, falls Anbieter oder Infrastruktur außerhalb der Nutzerjurisdiktion liegen.",
    cookiesKicker: "Cookie-Richtlinie",
    cookiesTitle: "Cookie- und Speichereinstellungen",
    cookiesIntro:
      "ANCAP verwendet ein Einwilligungsbanner mit gleichem Zugang: optionale Speicherung annehmen, ablehnen oder anpassen. Ein notwendiger Präferenzsatz wird gespeichert, damit das Banner nicht ständig wiederkehrt.",
    c1Title: "Streng notwendig",
    c1Examples: "Einwilligungsspeicher, Login-/Sitzungsstatus, Sicherheitsprüfungen, Wallet-Status, Sprache, Theme, Service-Worker-Unterstützung.",
    c1Consent: "Wird ohne optionale Einwilligung genutzt, soweit es für den Betrieb der Website nötig ist.",
    c2Title: "Analyse",
    c2Examples: "Funnel-Ereignisse, Seitenleistung, Fehlerdiagnose, Workflow-Conversion, aggregierte Produktmetriken.",
    c2Consent: "Standardmäßig aus und nur nach Einwilligung aktiv, wo sie erforderlich ist.",
    c3Title: "Marketing und Attribution",
    c3Examples: "Kampagnenquelle, Referral-Attribution, Partnercode, Attribution bezahlter Läufe.",
    c3Consent: "Standardmäßig aus und nur nach Einwilligung aktiv, wo sie erforderlich ist.",
    cookiesExamples: "Beispiele:",
    cookiesConsent: "Einwilligung:",
    cookiesRegTitle: "Regulatorische Hinweise",
    cookiesRegBody:
      "EU- und UK-Leitlinien unterscheiden in der Regel streng notwendige Speicherung von optionaler Analyse- oder Marketing-Speicherung. Optionale Kategorien erfordern informierte Einwilligung und dürfen dort nicht vorausgewählt sein, wo Einwilligung Pflicht ist.",
    cookiesEc: "Cookie-Politik-Beispiel der Europäischen Kommission",
    cookiesEdpb: "EDPB-Leitlinien zur Einwilligung",
    cyberKicker: "Recht / öffentliche Politik",
    cyberTitle: "ANCAP-Zustimmung zur kollektiven Cyberabwehr",
    cyberIntro:
      "ANCAP stimmt öffentlich dem OpenAI-Offenen Brief „A call for collective action on cyber defense“ und dem geforderten globalen Schub zu. Diese Seite ist die rechtliche und politische Erklärung des Unternehmens. Sie ersetzt nicht Nutzungsvereinbarung, Datenschutzhinweis oder Cookie-Richtlinie.",
    openLetter: "Offener Brief (openai.com)",
    cyberStatementTitle: "Zustimmungserklärung",
    cyberStatement1:
      "ANCAP als Betreiber von ancap.cloud und zugehörigen ACP-, Wallet-, Workflow- und API-Diensten stimmt der Eröffnungsthese des Briefes zu: Das Fenster zur Stärkung der Cyberabwehr ist begrenzt. KI-gestützte Angriffe werden billiger, automatisierter und breiter verfügbar, auch gegen Krankenhäuser, Wasserversorgung und Internet-Infrastruktur. Dieselben Modelle können Verteidigern helfen, jahrelang aufgestaute Schwächen zu schließen. Deshalb unterstützt ANCAP den Aufruf, Cybersicherheit zur Führungsaufgabe zu machen, Verteidigung für Betreiber ohne eigene Mittel zu finanzieren, bewährte Playbooks zu teilen und KI-Agentenhandlungen nachvollziehbar zu machen.",
    cyberStatement2:
      "Zu den Unterzeichnern gehören Technologie-, Sicherheits-, Zahlungs-, Telekom- und Industrieunternehmen, die gewöhnlich konkurrieren und sich dennoch um dasselbe Bedrohungsbild versammelt haben. ANCAP steht nicht auf der Unterzeichnerliste. Diese Seite dokumentiert ANCAPs eigenständige Zustimmung zu derselben Politik und denselben drei Prinzipien.",
    cyberP1Title: "1. Aktuelle Sicherheit reicht nicht",
    cyberP1Body:
      "Systeme bleiben wegen alter Fehler, übermäßiger Rechte, schwacher Authentifizierung und technischer Schulden offen. Sicherheitsteams — besonders in kritischer Infrastruktur — sind chronisch unterfinanziert. ANCAP behandelt das als Führungsrisiko, nicht als Backoffice-Checkliste.",
    cyberP2Title: "2. Verteidiger brauchen KI",
    cyberP2Body:
      "Dieselbe Modellklasse, die Angriffe verbilligt, kann mehr Teams expertengleiche Verteidigungsfähigkeiten geben und Basis-Sicherheitsarbeit schneller und günstiger machen. Bewährte Werkzeuge und Patches einer Organisation sollen viele schützen. ANCAP setzt KI ein, um defensive Workflows, Proof-Spuren und Operator-Prüfungen zu stärken — nicht um Angriffe zu verbilligen.",
    cyberP3Title: "3. Die Antwort muss kollektiv sein",
    cyberP3Body:
      "Kein einzelnes Unternehmen kontrolliert die Angriffsfläche. Anbieter haben Angriffsdaten und Tools, Modellbauer die Modelle, Staaten Koordination und Budget, Organisationen das Wissen über eigene Systeme. ANCAP stimmt zu, dass diese Teile verbunden werden müssen, damit die Erfahrung eines Opfers die Kosten des nächsten Angriffs erhöht.",
    cyberCommitTitle: "ANCAP-Verpflichtungen unter dieser Politik",
    cyberC1Title: "Führungspriorität",
    cyberC1Body:
      "Cybersicherheit wird mit Incident-Dringlichkeit geführt: die gefährlichsten Schwächen schließen, das Ergebnis prüfen und die Anforderungen an das, was wir kaufen, ausliefern und betreiben, anheben — einschließlich KI-geschriebenem Code.",
    cyberC2Title: "Defensive KI-Nutzung",
    cyberC2Body:
      "ANCAP setzt KI für Verteidigungsaufgaben, Prüfbarkeit und Operator-Unterstützung ein. Bezahlte KI-Workflows und Agenten bleiben den Verbotsregeln gegen Angriffe, Malware, Betrug und unbefugten Zugriff unterworfen.",
    cyberC3Title: "Nachvollziehbare Agenten",
    cyberC3Body:
      "Handlungen von KI-Agenten auf ANCAP sollen über Quittungen, Hashes, Logs und Proof-Artefakte nachvollziehbar und rechenschaftspflichtig sein, wo das Produkt Ausführung bereits aufzeichnet.",
    cyberC4Title: "Gemeinsame Standards",
    cyberC4Body:
      "ANCAP unterstützt Partnerschaften, Threat-Intelligence-Austausch und gemeinsame Abwehrstandards zwischen Technologieunternehmen, Infrastruktur­betreibern und öffentlichen Institutionen.",
    cyberC5Title: "Angriffskosten erhöhen",
    cyberC5Body:
      "Der wirtschaftliche Kern bleibt: Ein Angriff soll mehr kosten, als er einbringen kann. ANCAP stimmt zu, dass diese Kosten nur kollektiv wiederhergestellt werden können, weil kein Teilnehmer allein den vollen Ressourcensatz hält.",
    cyberScopeTitle: "Umfang und Grenzen",
    cyberScope1:
      "Diese Zustimmung ist eine öffentlich-politische Erklärung. Sie begründet für sich keine Gewähr, Versicherung, SLA oder staatliche Partnerschaft. Plattformnutzer bleiben an die Nutzungsvereinbarung gebunden, einschließlich des Verbots, ANCAP für Systemangriffe, Malware oder Zugriffs­umgehung zu nutzen. Offensive Cyberhilfe liegt außerhalb des Produkts.",
    cyberScope2: "Quelldokument:",
  },
  "zh-Hant": {
    lastUpdated: "最後更新：2026 年 9 月 8 日。",
    privacyLink: "隱私權聲明",
    cookiesLink: "Cookie 政策",
    termsLink: "使用者協議",
    cyberLink: "集體網路防禦",
    acpLink: "ACP 白皮書",
    termsKicker: "法律協議",
    termsTitle: "ANCAP 使用者協議",
    termsIntro:
      "這是 ANCAP 網站的可上線法律範本。在作為最終具約束力的協議之前，必須由合格律師審閱並補完。",
    t1Title: "1. 當事人與接受",
    t1Body:
      "本條款是 ANCAP 平台營運者與 ancap.cloud、API、錢包、工作流程商店、創作者工具及相關服務每位使用者之間的協議範本。使用服務、建立帳號、連接錢包、購買工作流程、發布上架或使用 API，即表示您同意本條款。",
    t2Title: "2. 營運者資料",
    t2Body:
      "商業上線前，營運者須填入法人名稱、註冊地址、登記號碼、適用稅號、支援信箱與管轄地。若已簽署的企業合約與本條款衝突，對該客戶以已簽署合約為準。",
    t3Title: "3. 資格",
    t3Body:
      "您必須具備締約能力；若法律、制裁、出口管制或平台限制禁止使用，即不得使用 ANCAP。您須自行判斷所在地的加密資產、AI、資料、稅務與商業規則是否允許預定用途。",
    t4Title: "4. 服務",
    t4Body:
      "ANCAP 提供付費 AI 工作流程執行、上架、創作者發布工具、ACP 錢包／會計功能、付費 API、證明收據、範例報告、搜尋、分析與相關營運工具。服務可能隨平台發展而變更。",
    t5Title: "5. ACP、點數、付款與退款",
    t5Body:
      "ACP 是主要平台記帳與支付單位。平台點數、錢包餘額、付款意向與收據可以 ACP 計價。除非另有政策，工作流程購買自執行開始即視為已消耗。失敗或降級執行的退款、點數或補償依平台政策處理，並可能取決於日誌、狀態與證明資料。",
    t6Title: "6. AI 輸出與審閱義務",
    t6Body:
      "AI 產出可能不準確、不完整、延遲，或不適合作特定法律、財務、技術、合規或商業決策。ANCAP 出售工作流程執行產物，而非投資、法律、稅務、財務建議或保證商業結果。您必須在依賴輸出前自行審閱。",
    t7Title: "7. 創作者上架",
    t7Body:
      "創作者可提交工作流程方案、結構、價格、樣本、證明政策與相關材料。ANCAP 得審查、拒絕、暫停、排序、調整顯示或下架，以保護使用者、遵守法律、減少垃圾內容並維持品質。創作者收益可能受抽成、凍結、退款、濫用檢查、稅務與撥款規則影響。",
    t8Title: "8. API 使用",
    t8Body:
      "API 使用者必須保護金鑰，遵守速率限制、支出上限、冪等規則與使用政策。ANCAP 得限流、暫停或封鎖威脅穩定性、違反政策、規避付款、抓取受保護資源、濫用 AI／LLM 或造成法律／資安風險的請求。",
    t9Title: "9. 禁止行為",
    t9Body:
      "不得使用 ANCAP 從事詐欺、規避制裁、洗錢、攻擊系統、散布惡意軟體、侵害隱私、侵害智慧財產、操縱市場、冒充他人、濫發訊息、將 AI 輸出偽稱為認證建議，或進行非法金融推廣。",
    t10Title: "10. 智慧財產",
    t10Body:
      "ANCAP 及其授權人保留平台、軟體、品牌、文件與系統設計的權利。您保留所提供合法輸入內容的權利。您授予 ANCAP 處理輸入、執行工作流程、產生輸出、運作證明收據、執行政策與改善服務所需權利，範圍如隱私與資料條款所述。",
    t11Title: "11. 隱私、Cookie 與資料",
    t11Body:
      "個人資料與 Cookie 偏好依隱私權聲明與 Cookie 政策處理。必要儲存支援登入、安全、錢包狀態、語言、主題與同意紀錄。可選分析或行銷儲存僅在需要且取得有效同意後啟用。",
    t12Title: "12. 免責與責任限制",
    t12Body:
      "在法律允許的最大範圍內，ANCAP 以現況與可用性提供，不保證不中斷、AI 輸出無誤、市場價值、流動性、監管核准或特定目的適用性。責任上限、排除條款、強制消費者權利與當地法律保留應由營運者所在地律師最終確定。",
    t13Title: "13. 暫停與終止",
    t13Body:
      "ANCAP 得因安全、濫用、未付款、疑似詐欺、法律風險、政策違規或平台完整性而暫停或終止存取、金鑰、上架、撥款或工作流程。使用者可隨時停止使用，但仍受未完成義務與資料保存規則約束。",
    t14Title: "14. 變更",
    t14Body:
      "ANCAP 得隨產品、法律或風險環境變更更新本條款。重大變更應透過網站、帳號通知、電子郵件或其他合理管道告知。生效日後繼續使用即表示接受更新後條款。",
    t15Title: "15. 集體網路防禦",
    t15Body:
      "ANCAP 同意 OpenAI 公開信《呼籲對網路防禦採取集體行動》。對 ANCAP 而言，資安是高階管理層義務：現行控制不足，防禦者應使用 AI 修補累積弱點，且回應必須是集體的，使攻擊成本高於可能收益。使用者不得利用 ANCAP 攻擊系統、散布惡意軟體或繞過存取控制。公司公開背書與承諾構成本公司法律與政策資訊的一部分。",
    privacyKicker: "隱私權聲明",
    privacyTitle: "ANCAP 如何處理資料",
    privacyIntro:
      "本聲明說明帳號、錢包、付費工作流程、API 使用、證明收據與平台安全的實際資料類別。須補上最終營運者身分、聯絡信箱、處理者清單與各地揭露事項。",
    p1Title: "我們處理的資料",
    p1Body:
      "帳號資料、錢包地址、API 金鑰中繼資料、工作流程輸入、產生輸出、付款意向中繼資料、收據、證明雜湊、支援訊息、裝置／工作階段資料、日誌與同意選擇。",
    p2Title: "處理目的",
    p2Body:
      "用以提供帳號、錢包存取、工作流程執行、創作者上架、付費 API、帳務、防詐、安全、支援、產品分析、法律遵循與營運可靠度。",
    p3Title: "加密與公開證明",
    p3Body:
      "部分區塊鏈資料、錢包地址、交易參考、雜湊與公開證明 URL 可能公開或鏈上可見，ANCAP 未必能刪除。",
    p4Title: "AI 供應商",
    p4Body:
      "若執行需要，工作流程輸入可能傳送至已設定的 LLM 供應商。在組織核准前，不應提交敏感、受管制或機密資料。",
    p5Title: "保存期間",
    p5Body:
      "營運、帳務、安全、稽核與收據資料得依服務完整性、會計、爭議處理、防濫用與法律義務所需期間保存。",
    p6Title: "您的權利",
    p6Body:
      "依適用法律，您可請求近用、更正、刪除、限制、可攜或異議。部分請求可能因詐欺、稽核、區塊鏈、稅務、安全或法定保存而受限。",
    privacySecurityTitle: "安全與集體網路防禦",
    privacySecurityBody:
      "ANCAP 處理安全日誌、工作階段資料與證明產物以防詐與防濫用。ANCAP 同意 OpenAI 呼籲全球強化集體網路防禦的公開信。公開政策聲明與公司承諾已發布於本站。",
    privacyContactTitle: "聯絡與法律依據",
    privacyContactBody:
      "最終政策應載明控管者／營運者、隱私聯絡窗口、契約、正當利益、同意與法律義務等法律依據，以及供應商或基礎設施位於使用者管轄地以外時的跨境傳輸保障。",
    cookiesKicker: "Cookie 政策",
    cookiesTitle: "Cookie 與儲存偏好",
    cookiesIntro:
      "ANCAP 使用同意橫幅，並提供同等入口以接受可選儲存、拒絕可選儲存或自訂偏好。必要偏好紀錄會被保存，避免橫幅反覆出現。",
    c1Title: "嚴格必要",
    c1Examples: "同意紀錄、登入／工作階段狀態、安全檢查、錢包連線狀態、語言、主題、Service Worker 支援。",
    c1Consent: "在網站運作所需範圍內，無須可選同意即可使用。",
    c2Title: "分析",
    c2Examples: "漏斗事件、頁面效能、錯誤診斷、工作流程轉換、彙總產品指標。",
    c2Consent: "預設關閉，僅在需要且取得同意後啟用。",
    c3Title: "行銷與歸因",
    c3Examples: "活動來源、推薦歸因、合作代碼、付費執行歸因。",
    c3Consent: "預設關閉，僅在需要且取得同意後啟用。",
    cookiesExamples: "示例：",
    cookiesConsent: "同意：",
    cookiesRegTitle: "法規參考",
    cookiesRegBody:
      "歐盟與英國指引通常區分嚴格必要儲存與可選分析或行銷儲存。可選類別應要求知情同意，且在需要同意之處不得預先啟用。",
    cookiesEc: "歐盟執委會 Cookie 政策示例",
    cookiesEdpb: "EDPB 同意指引",
    cyberKicker: "法律／公共政策",
    cyberTitle: "ANCAP 對集體網路防禦的背書",
    cyberIntro:
      "ANCAP 公開同意 OpenAI 公開信《呼籲對網路防禦採取集體行動》及其所要求的全球強化。本頁為公司對該協議的法律與政策聲明，不取代使用者協議、隱私權聲明或 Cookie 政策。",
    openLetter: "公開信（openai.com）",
    cyberStatementTitle: "同意聲明",
    cyberStatement1:
      "ANCAP 作為 ancap.cloud 及相關 ACP、錢包、工作流程與 API 服務的營運者，同意該信開場主張：強化網路防禦的時間窗口有限。AI 攻擊正變得更便宜、更自動化、更普及，包括針對醫院、供水與網際網路基礎設施。同一類模型也能協助防禦者修補多年累積的弱點。因此 ANCAP 支持將資安提升為高階優先、資助無力自籌的營運者、分享已驗證劇本，並使 AI 代理行為可究責。",
    cyberStatement2:
      "該信簽署者包括在一般市場相互競爭、卻因共同威脅而協調的科技、資安、支付、電信與工業公司。ANCAP 並非該信列名簽署方。本頁記錄 ANCAP 對同一政策與三項原則的獨立同意。",
    cyberP1Title: "1. 現行安全不足",
    cyberP1Body:
      "系統因舊漏洞、過剩權限、薄弱驗證與技術債而暴露。資安團隊——尤其關鍵基礎設施——長期資源不足。ANCAP 將此視為高階風險，而非後勤清單。",
    cyberP2Title: "2. 防禦者需要 AI",
    cyberP2Body:
      "將使攻擊更便宜的同一類模型，也能讓更多團隊具備專家級防禦技能，並讓基礎資安工作更快、更便宜。一個組織驗證過的工具與修補應能保護許多組織。ANCAP 將用 AI 強化防禦工作流程、證明軌跡與營運檢查——而非降低攻擊成本。",
    cyberP3Title: "3. 回應必須是集體的",
    cyberP3Body:
      "沒有任何單一公司能獨自控制威脅面。供應商掌握攻擊資料與工具，模型開發者掌握模型，政府掌握協調與預算，組織掌握自身系統知識。ANCAP 同意必須把這些部分接起來，讓一次受害經驗提高下一次攻擊的成本。",
    cyberCommitTitle: "ANCAP 在本政策下的承諾",
    cyberC1Title: "領導層優先",
    cyberC1Body:
      "資安以事件級緊急處理：關閉最危險弱點、驗證結果，並提高我們購買、交付與運行的門檻——包括 AI 撰寫的程式碼。",
    cyberC2Title: "防禦性使用 AI",
    cyberC2Body:
      "ANCAP 將 AI 用於防禦任務、可稽核性與營運支援。平台上的付費 AI 工作流程與代理仍受禁止攻擊、惡意軟體、詐欺與未授權存取的規則約束。",
    cyberC3Title: "可追蹤代理",
    cyberC3Body:
      "ANCAP 上的 AI 代理行為應透過收據、雜湊、日誌與證明產物可追蹤、可究責——凡產品已記錄執行之處皆然。",
    cyberC4Title: "共同標準",
    cyberC4Body:
      "ANCAP 支持科技公司、基礎設施營運者與公共機構之間的夥伴關係、威脅情報共享與共同防禦標準。",
    cyberC5Title: "提高攻擊成本",
    cyberC5Body:
      "核心經濟檢驗仍是：攻擊成本應高於可能收益。ANCAP 同意恢復該成本必須靠集體行動，因為沒有任何一方單獨握有完整資源。",
    cyberScopeTitle: "範圍與限制",
    cyberScope1:
      "本背書為公共政策聲明，本身不構成保證、保險、SLA 或政府夥伴關係。平台使用者仍受使用者協議約束，包括禁止使用 ANCAP 攻擊系統、散布惡意軟體或繞過存取控制。攻擊性網路協助不在產品範圍內。",
    cyberScope2: "原始文件：",
  },
};
