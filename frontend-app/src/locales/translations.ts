export type Language = "en" | "ru" | "uk" | "de";

type TranslationTree = {
  [key: string]: string | TranslationTree;
};

export const SUPPORTED_LANGUAGES: Language[] = ["en", "ru", "uk", "de"];

export function isSupportedLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "ru" || value === "uk" || value === "de";
}

export function t(lang: Language, key: string): string {
  const keys = key.split(".");
  let value: string | TranslationTree | undefined = translations[lang];

  for (const k of keys) {
    if (value && typeof value === "object") {
      value = value[k];
    } else {
      return key;
    }
  }

  return typeof value === "string" ? value : key;
}

export const translations: Record<Language, TranslationTree> = {
  en: {
    nav: {
      product: "Product",
      vision: "Vision",
      docs: "Documentation",
      contact: "Contact",
      dashboard: "Dashboard",
      agents: "Agents",
      strategies: "Strategies",
      verticals: "Verticals",
      pools: "Pools",
      funds: "Funds",
      ledger: "Ledger",
      reputation: "Reputation",
      marketplace: "Marketplace",
      listings: "Listings",
      orders: "Orders",
      access: "Access",
      flows: "Flows",
      sellerDashboard: "Seller",
      acpWallet: "ACP Wallet",
      bridgeAcpBsc: "ACP -> BSC (wACP)",
      login: "Login",
      logout: "Logout",
      register: "Register",
      main: "Main",
      system: "System"
    },
    hero: {
      title: "Paid AI workflows for crypto teams and agents",
      sub: "Buy useful AI execution with ACP: listing packs, campaign builders, bounty flows, token risk reports, and proof-backed receipts.",
      learnMore: "Learn more",
      workflowsCta: "Buy workflow",
      acpStrip:
        "ACP chain integration and the custodial wallet are already live on the platform: chain overview on the ACP page, wallet after sign-in.",
      acpLink: "ACP and chain",
      acpWalletLink: "Wallet",
      acpToken: "ACP Token and Chain",
      followOnX: "Follow on X"
    },
    homePage: {
      badge: "ANCAP CLOUD",
      liveMap: "Live product map",
      productMapTitle: "What you can buy here",
      heroLead:
        "ANCAP sells useful AI execution for crypto teams: listing packs, campaign builders, bounty flows, token risk reports, and proof-backed receipts. The user buys a clear result with price, payment status, and a verifiable trail, not abstract AI access.",
      acpLead:
        "ACP chain integration and the custodial wallet are already available on the platform. The chain overview is on the ACP page; the wallet opens after sign-in. Paid workflows and APIs use ACP, where 1 ACP = 1 platform accounting unit.",
      buyWorkflow: "Buy workflow",
      viewPricing: "View pricing",
      agentApi: "API for agents",
      proofCenter: "Proof Center",
      offersKicker: "BUY FIRST",
      offersTitle: "First paid products",
      allCatalog: "Full catalog",
      howKicker: "HOW IT WORKS",
      howTitle: "Simple logic: pay, run, receive the artifact, verify proof",
      howLead:
        "ANCAP turns AI execution into a buyable product. Every workflow has inputs, price, expected output, payment state, and a verifiable receipt.",
      audienceKicker: "AUDIENCE",
      audienceTitle: "Who ANCAP is for",
      routesKicker: "AI-FRIENDLY ROUTES",
      routesTitle: "The page speaks in clear routes",
      routesLead:
        "For humans this is navigation. For AI agents it is a product map: where to buy, where to check pricing, where to get proof, where to work with ACP, and where to connect paid APIs.",
      openDevelopers: "Open developer page",
      acpKicker: "ACP RAIL",
      acpTitle: "ACP is already built into the product funnel",
      acpText:
        "ACP is used as the accounting unit for workflows and APIs. A user can study the chain, sign in, open the custodial ACP wallet, fund a balance, and run paid workflows with a receipt after payment.",
      acpPage: "ACP page",
      wallet: "Wallet",
      finalTitle: "Start with one workflow, then scale into APIs and bundles",
      finalText:
        "The shortest path to value: free token snapshot, paid pro report, then launch or growth pack. Agents have a dedicated developer page with paid endpoints.",
      freeSnapshot: "Free token snapshot",
      buyAiWorkflow: "Buy AI workflow",
      footer: "paid AI execution, ACP payments, proof receipts, and agent commerce.",
      offer1Label: "Best start",
      offer1Title: "Pro Launch Pack",
      offer1Result: "Launch audit, listing packet, KOL/Telegram campaign, bounty flow, and pro risk report in one package.",
      offer2Label: "Listing",
      offer2Title: "Exchange Listing Submission Pack",
      offer2Result: "Prepares exchange answers, due-diligence memo, risk checklist, and proof receipt for the run.",
      offer3Label: "Risk",
      offer3Title: "Token Risk Report Pro",
      offer3Result: "Checks token, liquidity, holders, evidence gaps, and builds a report for the team or investment committee.",
      launchLabel: "Launch",
      launchText: "launch audit, listing, campaign, bounty",
      riskLabel: "Risk",
      riskText: "token report, holder/liquidity flags, evidence gaps",
      agentApiLabel: "Agent API",
      agentApiText: "pay-per-call endpoints, spend caps, receipts",
      proofLabel: "Proof",
      proofText: "receipt URL, input hash, run timeline, bundle",
      step1Title: "1. Choose a workflow",
      step1Text: "The catalog is organized around concrete crypto-team jobs: listing, launch, bounty, campaign, risk, and agent API readiness.",
      step2Title: "2. Pay in ACP",
      step2Text: "The price is shown before launch. 1 ACP counts as 1 platform accounting unit for paid workflows and APIs.",
      step3Title: "3. Receive the result",
      step3Text: "The output is a working artifact: report, document package, campaign plan, bounty flow, or API receipt.",
      step4Title: "4. Verify proof",
      step4Text: "Every paid run leaves a receipt, input hash, timeline, and proof bundle that can be shown to a team or agent.",
      audience1Title: "For crypto teams",
      audience1Text: "ANCAP helps buy a finished operational result: listing pack, launch audit, campaign builder, bounty mechanics, or token risk report.",
      audience2Title: "For AI agents",
      audience2Text: "The platform gives clear routes, prices, API products, spend caps, and machine-readable receipts so an agent can buy execution without long manual coordination.",
      audience3Title: "For project owners",
      audience3Text: "The revenue loop is built around ACP: paid workflows, bundles, proof, repeat runs, API calls, and partner acquisition through token snapshots.",
      route1Text: "buy ready AI execution",
      route2Text: "compare single SKUs and bundles",
      route3Text: "enter through a free risk check",
      route4Text: "paid API endpoints for external AI agents",
      route5Text: "public receipts and verifiable artifacts",
      route6Text: "custodial wallet after sign-in"
    },
    acpLanding: {
      badge: "Live on platform",
      title: "ANCAP Chain Protocol (ACP)",
      lead:
        "L3 layer for governance, staking, fees, and on-chain anchoring of ANCAP execution artifacts. This page explains what ACP is and how it fits into the ANCAP L1/L2/L3 roadmap.",
      statusLead:
        "ACP is wired into production ANCAP: configurable chain anchor drivers, ACP JSON-RPC support, custodial hot-wallet API under /v1/wallet/acp/*, and a wallet UI after sign-in.",
      walletCta: "Open ACP wallet",
      platformOverview: "Platform overview",
      l123Vision: "L1/L2/L3 vision",
      apiDocs: "API docs",
      whatIs: "What ACP is",
      nativeToken: "Native token",
      nativeTokenDesc: "Used for execution fees, staking for responsibility and reputation, governance weight, and slashing collateral.",
      chainAnchors: "Chain anchors",
      aiIdentity: "AI-native identity",
      aiIdentityDesc: "L3 onboarding uses challenge-response and stake-to-activate to make sybil attacks harder.",
      anchorsCard:
        "Anchor run and artifact hashes on-chain when CHAIN_ANCHOR_DRIVER=acp and ACP_RPC_URL points at your node; mock driver remains for local development.",
      tokenUtilityNote: "Fees, staking, and slashing rails use ACP where configured; broader marketplace settlement follows the roadmap."
    },
    product: {
      title: "Sellable workflows with proof-backed execution",
      desc: "ANCAP monetizes concrete crypto workflows first: buy a run, get a result, inspect cost and receipt, then repeat or scale through subscriptions and APIs.",
      strategyRegistry: "Strategy Registry",
      runsSandbox: "Runs & Sandbox",
      riskKernel: "Risk Kernel",
      card1: "Workflow catalog for listing packs, launch kits, token intelligence, and growth operations.",
      card2: "Paid runs with previews, pricing, repeat execution, and machine-readable receipts.",
      card3: "Proof, audit trails, and spend controls so AI workflows can be sold safely to users and other agents."
    },
    vision: {
      title: "From engine to market",
      desc: "Reputation 2.0, strategy marketplace, reviews, and capital allocation. Then Proof-of-Agent, staking, and multiple verticals.",
      coreLedger: "Core Ledger & Verifiable Execution",
      marketLayer: "Market Layer",
      autonomousEconomy: "Autonomous Economy"
    },
    cta: {
      title: "Start with paid workflows, then expand into agent commerce",
      sub: "The first revenue loop is simple: workflow catalog, paid runs, receipts, repeat usage, then APIs and MCP."
    },
    footer: {
      suffix: "- AI-native capital allocation platform. Roadmap and vision are available in the repository."
    },
    flows: {
      subtitle: "Run end-to-end scenarios to generate orders, access grants, runs, reputation, and risk signals."
    },
    dashboard: {
      title: "Dashboard",
      agents: "Agents",
      runs: "Runs",
      totalCapital: "Total Capital",
      activeStrategies: "Active Strategies",
      totalReturn: "Total Return",
      recentActivity: "Recent Activity",
      noActivity: "No recent activity"
    },
    agents: {
      title: "AI Agents",
      register: "Register Agent",
      strategyCreator: "Strategy Creator",
      status: "Status",
      active: "Active",
      reputation: "Reputation"
    },
    strategies: {
      title: "Trading Strategies",
      create: "Create Strategy",
      performance: "Performance",
      vertical: "Vertical",
      risk: "Risk",
      medium: "Medium",
      status: "Status",
      active: "Active"
    },
    verticals: {
      title: "Verticals",
      propose: "Propose Vertical"
    },
    pools: {
      title: "Capital Pools",
      create: "Create Pool"
    },
    funds: {
      title: "Funds",
      create: "Create Fund"
    },
    home: {
      subtitle: "AI-native capital allocation platform",
      dashboardDesc: "View your portfolio and performance",
      agentsDesc: "Browse and manage AI agents",
      strategiesDesc: "Explore trading strategies"
    },
    auth: {
      email: "Email",
      password: "Password",
      displayName: "Display name",
      minPassword: "Minimum 8 characters",
      loggingIn: "Logging in...",
      creatingAccount: "Creating account...",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      walletOr: "or",
      connectWallet: "Connect wallet",
      connectingWallet: "Connecting wallet...",
      continueWithWallet: "Continue with wallet",
      walletConnected: "Wallet connected",
      walletNotInstalled: "MetaMask or another EVM wallet is not available in this browser.",
      walletBnbHint: "For wACP and BNB-side actions, switch to BNB Chain.",
      switchToBnb: "Switch to BNB Chain",
      connectedWallet: "Connected wallet",
      walletOnlyMode: "Wallet session mode",
      walletOnlyModeDesc: "You can enter the interface with a connected wallet now. Backend wallet-sign auth can be added next.",
      walletSignInDesc: "Connect your EVM wallet, sign the login message, and continue into ANCAP with wallet-based authentication.",
      continueToDashboard: "Continue to dashboard"
    }
  },
  ru: {
    nav: {
      product: "Продукт",
      vision: "Видение",
      docs: "Документация",
      contact: "Контакты",
      dashboard: "Панель",
      agents: "Агенты",
      strategies: "Стратегии",
      verticals: "Вертикали",
      pools: "Пулы",
      funds: "Фонды",
      ledger: "Реестр",
      reputation: "Репутация",
      marketplace: "Маркетплейс",
      listings: "Листинги",
      orders: "Заявки",
      access: "Доступ",
      flows: "Сценарии",
      sellerDashboard: "Продавец",
      acpWallet: "ACP-кошелек",
      bridgeAcpBsc: "ACP -> BSC (wACP)",
      login: "Войти",
      logout: "Выйти",
      register: "Регистрация",
      main: "Главное",
      system: "Система"
    },
    hero: {
      title: "Платные AI-workflow для криптокоманд и агентов",
      sub: "Покупай полезное AI-исполнение за ACP: listing packs, campaign builders, bounty flows, token risk reports и receipts с proof.",
      learnMore: "Подробнее",
      workflowsCta: "Купить workflow",
      acpStrip:
        "Интеграция с сетью ACP и кастодиальный кошелек уже доступны на платформе: обзор на странице ACP, кошелек после входа.",
      acpLink: "ACP и сеть",
      acpWalletLink: "Кошелек",
      acpToken: "Токен и сеть ACP",
      followOnX: "Мы в X"
    },
    homePage: {
      badge: "ANCAP CLOUD",
      liveMap: "Live product map",
      productMapTitle: "Что здесь можно купить",
      heroLead:
        "ANCAP продает полезное AI-исполнение для crypto-команд: listing packs, campaign builders, bounty flows, token risk reports и receipts с proof. Пользователь покупает не абстрактный доступ к AI, а понятный результат с ценой, статусом оплаты и проверяемым следом.",
      acpLead:
        "Интеграция с сетью ACP и кастодиальный кошелек уже доступны на платформе. Обзор сети находится на странице ACP, кошелек открывается после входа. Для платных workflow и API используется ACP, где 1 ACP = 1 расчетная единица платформы.",
      buyWorkflow: "Купить workflow",
      viewPricing: "Смотреть цены",
      agentApi: "API для агентов",
      proofCenter: "Proof Center",
      offersKicker: "BUY FIRST",
      offersTitle: "Первые платные продукты",
      allCatalog: "Весь каталог",
      howKicker: "HOW IT WORKS",
      howTitle: "Простая логика: оплатил, запустил, получил артефакт, проверил proof",
      howLead:
        "Главная ценность ANCAP в том, что AI-исполнение превращается в покупаемый продукт. Каждый workflow имеет входные данные, цену, ожидаемый результат, статус оплаты и проверяемый receipt.",
      audienceKicker: "AUDIENCE",
      audienceTitle: "Кому нужен ANCAP",
      routesKicker: "AI-FRIENDLY ROUTES",
      routesTitle: "Страница говорит понятными маршрутами",
      routesLead:
        "Для человека это навигация. Для AI-агента это карта продукта: где купить, где посмотреть цену, где получить proof, где работать с ACP и где подключать paid API.",
      openDevelopers: "Открыть developer page",
      acpKicker: "ACP RAIL",
      acpTitle: "ACP уже встроен в продуктовую воронку",
      acpText:
        "ACP используется как расчетная единица для workflow и API. Пользователь может изучить сеть, войти в аккаунт, открыть кастодиальный ACP-кошелек, пополнить баланс и запускать платные workflow с receipt после оплаты.",
      acpPage: "Страница ACP",
      wallet: "Кошелек",
      finalTitle: "Начните с одного workflow, затем масштабируйте в API и bundles",
      finalText:
        "Самый короткий путь к ценности: бесплатный token snapshot, платный pro report, затем launch или growth pack. Для агентов есть отдельная developer-страница с paid endpoints.",
      freeSnapshot: "Free token snapshot",
      buyAiWorkflow: "Купить AI-workflow",
      footer: "paid AI execution, ACP payments, proof receipts and agent commerce.",
      offer1Label: "Лучший старт",
      offer1Title: "Pro Launch Pack",
      offer1Result: "Launch audit, listing packet, KOL/Telegram campaign, bounty flow и pro risk report в одном пакете.",
      offer2Label: "Листинг",
      offer2Title: "Exchange Listing Submission Pack",
      offer2Result: "Готовит ответы для биржи, due-diligence memo, checklist рисков и proof receipt запуска.",
      offer3Label: "Риск",
      offer3Title: "Token Risk Report Pro",
      offer3Result: "Проверяет token, liquidity, holders, evidence gaps и собирает отчет для команды или инвесткомитета.",
      launchLabel: "Launch",
      launchText: "аудит запуска, листинг, кампания, bounty",
      riskLabel: "Risk",
      riskText: "token report, holder/liquidity flags, evidence gaps",
      agentApiLabel: "Agent API",
      agentApiText: "pay-per-call endpoints, spend caps, receipts",
      proofLabel: "Proof",
      proofText: "receipt URL, input hash, run timeline, bundle",
      step1Title: "1. Выберите workflow",
      step1Text: "Каталог собран вокруг конкретных задач crypto-команд: listing, launch, bounty, campaign, risk и agent API readiness.",
      step2Title: "2. Оплатите в ACP",
      step2Text: "Цена показывается до запуска. 1 ACP считается как 1 расчетная единица платформы для paid workflow и API.",
      step3Title: "3. Получите результат",
      step3Text: "На выходе не обещание, а рабочий артефакт: отчет, пакет документов, campaign plan, bounty flow или API receipt.",
      step4Title: "4. Проверьте proof",
      step4Text: "Каждый платный запуск оставляет receipt, input hash, timeline и proof bundle, чтобы результат можно было показать команде или агенту.",
      audience1Title: "Для crypto-команды",
      audience1Text: "ANCAP помогает купить не консультацию в свободной форме, а готовый операционный результат: listing pack, launch audit, campaign builder, bounty mechanics или token risk report.",
      audience2Title: "Для AI-агента",
      audience2Text: "Платформа дает понятные маршруты, цены, API-продукты, spend caps и machine-readable receipts, чтобы агент мог покупать исполнение без длинной ручной переписки.",
      audience3Title: "Для владельца проекта",
      audience3Text: "Revenue loop строится вокруг ACP: платные workflow, bundles, proof, repeat runs, API calls и партнерская воронка через token snapshot.",
      route1Text: "купить готовое AI-исполнение",
      route2Text: "сравнить отдельные SKU и пакеты",
      route3Text: "быстрый вход через бесплатную risk-проверку",
      route4Text: "paid API endpoints для внешних AI-агентов",
      route5Text: "публичные receipts и проверяемые артефакты",
      route6Text: "кастодиальный кошелек после входа"
    },
    acpLanding: {
      badge: "Работает на платформе",
      title: "ANCAP Chain Protocol (ACP)",
      lead:
        "L3-слой для управления, стейкинга, комиссий и записи артефактов исполнения ANCAP в сеть. Эта страница объясняет, что такое ACP и как он вписывается в дорожную карту ANCAP L1/L2/L3.",
      statusLead:
        "ACP подключен к production-контуру ANCAP: настраиваемые драйверы якорения в сети, поддержка ACP JSON-RPC, API кастодиального горячего кошелька /v1/wallet/acp/* и интерфейс кошелька после входа.",
      walletCta: "Открыть ACP-кошелек",
      platformOverview: "Обзор платформы",
      l123Vision: "Видение L1/L2/L3",
      apiDocs: "Документация API",
      whatIs: "Что такое ACP",
      nativeToken: "Нативный токен",
      nativeTokenDesc: "Используется для комиссий за исполнение, стейкинга ответственности и репутации, веса в управлении и обеспечения для штрафов.",
      chainAnchors: "Якорение в сети",
      aiIdentity: "AI-нативная идентичность",
      aiIdentityDesc: "L3-онбординг использует challenge-response и stake-to-activate, чтобы усложнить Sybil-атаки.",
      anchorsCard:
        "Хэши запусков и артефактов записываются в сеть, когда CHAIN_ANCHOR_DRIVER=acp, а ACP_RPC_URL указывает на ваш узел; mock-драйвер остается для локальной разработки.",
      tokenUtilityNote: "Комиссии, стейкинг и штрафы используют ACP там, где это настроено; расширенные расчеты маркетплейса соответствуют дорожной карте."
    },
    product: {
      title: "Продаваемые workflow с proof-backed исполнением",
      desc: "ANCAP сначала монетизирует конкретные crypto-workflow: купил run, получил результат, увидел цену и receipt, потом повторил запуск или масштабировал через подписки и API.",
      strategyRegistry: "Реестр стратегий",
      runsSandbox: "Запуски и песочница",
      riskKernel: "Ядро риска",
      card1: "Каталог workflow для listing packs, launch kits, token intelligence и growth-операций.",
      card2: "Платные запуски с preview, pricing, repeat execution и machine-readable receipts.",
      card3: "Proof, audit trails и spend controls, чтобы AI-workflow можно было безопасно продавать людям и другим агентам."
    },
    vision: {
      title: "От движка к рынку",
      desc: "Reputation 2.0, маркетплейс стратегий, отзывы и распределение капитала. Затем Proof-of-Agent, стейкинг и несколько вертикалей.",
      coreLedger: "Базовый реестр и проверяемое исполнение",
      marketLayer: "Рыночный слой",
      autonomousEconomy: "Автономная экономика"
    },
    cta: {
      title: "Сначала платные workflow, потом agent commerce",
      sub: "Первый денежный цикл простой: каталог workflow, платные run, receipts, повторное использование, затем API и MCP."
    },
    footer: {
      suffix: "- AI-нативная платформа распределения капитала. Дорожная карта и видение доступны в репозитории."
    },
    flows: {
      subtitle: "Запускайте end-to-end сценарии для генерации заявок, прав доступа, запусков, а также сигналов репутации и риска."
    },
    dashboard: {
      title: "Панель управления",
      agents: "Агенты",
      runs: "Запуски",
      totalCapital: "Общий капитал",
      activeStrategies: "Активные стратегии",
      totalReturn: "Общая доходность",
      recentActivity: "Недавняя активность",
      noActivity: "Недавней активности нет"
    },
    agents: {
      title: "AI-агенты",
      register: "Зарегистрировать агента",
      strategyCreator: "Создатель стратегий",
      status: "Статус",
      active: "Активен",
      reputation: "Репутация"
    },
    strategies: {
      title: "Торговые стратегии",
      create: "Создать стратегию",
      performance: "Результаты",
      vertical: "Вертикаль",
      risk: "Риск",
      medium: "Средний",
      status: "Статус",
      active: "Активна"
    },
    verticals: {
      title: "Вертикали",
      propose: "Предложить вертикаль"
    },
    pools: {
      title: "Пулы капитала",
      create: "Создать пул"
    },
    funds: {
      title: "Фонды",
      create: "Создать фонд"
    },
    home: {
      subtitle: "AI-нативная платформа распределения капитала",
      dashboardDesc: "Просматривайте портфель и результаты",
      agentsDesc: "Управляйте AI-агентами",
      strategiesDesc: "Изучайте торговые стратегии"
    },
    auth: {
      email: "Email",
      password: "Пароль",
      displayName: "Отображаемое имя",
      minPassword: "Минимум 8 символов",
      loggingIn: "Входим...",
      creatingAccount: "Создаем аккаунт...",
      noAccount: "Нет аккаунта?",
      haveAccount: "Уже есть аккаунт?",
      walletOr: "или",
      connectWallet: "Подключить кошелек",
      connectingWallet: "Подключаем кошелек...",
      continueWithWallet: "Войти через кошелек",
      walletConnected: "Кошелек подключен",
      walletNotInstalled: "MetaMask или другой EVM-кошелек недоступен в этом браузере.",
      walletBnbHint: "Для wACP и действий в BNB-side лучше переключиться на BNB Chain.",
      switchToBnb: "Переключиться на BNB Chain",
      connectedWallet: "Подключенный кошелек",
      walletOnlyMode: "Режим wallet session",
      walletOnlyModeDesc: "Сейчас в интерфейс уже можно входить через подключенный кошелек. Полный backend auth по подписи можно добавить следующим шагом.",
      walletSignInDesc: "Подключи EVM-кошелек, подпиши login-сообщение и продолжай в ANCAP через wallet-based аутентификацию.",
      continueToDashboard: "Перейти в dashboard"
    }
  },
  uk: {
    nav: {
      product: "Продукт",
      vision: "Бачення",
      docs: "Документація",
      contact: "Контакти",
      dashboard: "Панель",
      agents: "Агенти",
      strategies: "Стратегії",
      verticals: "Вертикалі",
      pools: "Пули",
      funds: "Фонди",
      ledger: "Реєстр",
      reputation: "Репутація",
      marketplace: "Маркетплейс",
      listings: "Лістинги",
      orders: "Заявки",
      access: "Доступ",
      flows: "Сценарії",
      sellerDashboard: "Продавець",
      acpWallet: "ACP-гаманець",
      bridgeAcpBsc: "ACP -> BSC (wACP)",
      login: "Увійти",
      logout: "Вийти",
      register: "Реєстрація",
      main: "Головне",
      system: "Система"
    },
    hero: {
      title: "Платні AI-workflow для криптокоманд і агентів",
      sub: "Купуй корисне AI-виконання за ACP: listing packs, campaign builders, bounty flows, token risk reports і receipts з proof.",
      learnMore: "Докладніше",
      workflowsCta: "Купити workflow",
      acpStrip:
        "Інтеграція з мережею ACP і кастодіальний гаманець уже доступні на платформі: огляд на сторінці ACP, гаманець після входу.",
      acpLink: "ACP і мережа",
      acpWalletLink: "Гаманець",
      acpToken: "Токен і мережа ACP",
      followOnX: "Ми в X"
    },
    homePage: {
      badge: "ANCAP CLOUD",
      liveMap: "Live product map",
      productMapTitle: "Що тут можна купити",
      heroLead:
        "ANCAP продає корисне AI-виконання для crypto-команд: listing packs, campaign builders, bounty flows, token risk reports і receipts з proof. Користувач купує не абстрактний доступ до AI, а зрозумілий результат із ціною, статусом оплати й перевірюваним слідом.",
      acpLead:
        "Інтеграція з мережею ACP і кастодіальний гаманець уже доступні на платформі. Огляд мережі є на сторінці ACP, гаманець відкривається після входу. Для платних workflow і API використовується ACP, де 1 ACP = 1 облікова одиниця платформи.",
      buyWorkflow: "Купити workflow",
      viewPricing: "Переглянути ціни",
      agentApi: "API для агентів",
      proofCenter: "Proof Center",
      offersKicker: "BUY FIRST",
      offersTitle: "Перші платні продукти",
      allCatalog: "Увесь каталог",
      howKicker: "HOW IT WORKS",
      howTitle: "Проста логіка: оплатив, запустив, отримав артефакт, перевірив proof",
      howLead:
        "Головна цінність ANCAP у тому, що AI-виконання стає продуктом, який можна купити. Кожен workflow має вхідні дані, ціну, очікуваний результат, статус оплати й перевірюваний receipt.",
      audienceKicker: "AUDIENCE",
      audienceTitle: "Кому потрібен ANCAP",
      routesKicker: "AI-FRIENDLY ROUTES",
      routesTitle: "Сторінка говорить зрозумілими маршрутами",
      routesLead:
        "Для людини це навігація. Для AI-агента це карта продукту: де купити, де подивитися ціну, де отримати proof, де працювати з ACP і де підключати paid API.",
      openDevelopers: "Відкрити developer page",
      acpKicker: "ACP RAIL",
      acpTitle: "ACP уже вбудований у продуктову воронку",
      acpText:
        "ACP використовується як облікова одиниця для workflow і API. Користувач може вивчити мережу, увійти в акаунт, відкрити кастодіальний ACP-гаманець, поповнити баланс і запускати платні workflow з receipt після оплати.",
      acpPage: "Сторінка ACP",
      wallet: "Гаманець",
      finalTitle: "Почніть з одного workflow, потім масштабуйтеся в API і bundles",
      finalText:
        "Найкоротший шлях до цінності: безкоштовний token snapshot, платний pro report, потім launch або growth pack. Для агентів є окрема developer-сторінка з paid endpoints.",
      freeSnapshot: "Free token snapshot",
      buyAiWorkflow: "Купити AI-workflow",
      footer: "paid AI execution, ACP payments, proof receipts and agent commerce.",
      offer1Label: "Найкращий старт",
      offer1Title: "Pro Launch Pack",
      offer1Result: "Launch audit, listing packet, KOL/Telegram campaign, bounty flow і pro risk report в одному пакеті.",
      offer2Label: "Лістинг",
      offer2Title: "Exchange Listing Submission Pack",
      offer2Result: "Готує відповіді для біржі, due-diligence memo, checklist ризиків і proof receipt запуску.",
      offer3Label: "Ризик",
      offer3Title: "Token Risk Report Pro",
      offer3Result: "Перевіряє token, liquidity, holders, evidence gaps і збирає звіт для команди або інвесткомітету.",
      launchLabel: "Launch",
      launchText: "аудит запуску, лістинг, кампанія, bounty",
      riskLabel: "Risk",
      riskText: "token report, holder/liquidity flags, evidence gaps",
      agentApiLabel: "Agent API",
      agentApiText: "pay-per-call endpoints, spend caps, receipts",
      proofLabel: "Proof",
      proofText: "receipt URL, input hash, run timeline, bundle",
      step1Title: "1. Оберіть workflow",
      step1Text: "Каталог зібраний навколо конкретних задач crypto-команд: listing, launch, bounty, campaign, risk і agent API readiness.",
      step2Title: "2. Оплатіть в ACP",
      step2Text: "Ціна показується до запуску. 1 ACP рахується як 1 облікова одиниця платформи для paid workflow і API.",
      step3Title: "3. Отримайте результат",
      step3Text: "На виході не обіцянка, а робочий артефакт: звіт, пакет документів, campaign plan, bounty flow або API receipt.",
      step4Title: "4. Перевірте proof",
      step4Text: "Кожен платний запуск залишає receipt, input hash, timeline і proof bundle, щоб результат можна було показати команді або агенту.",
      audience1Title: "Для crypto-команди",
      audience1Text: "ANCAP допомагає купити не консультацію у вільній формі, а готовий операційний результат: listing pack, launch audit, campaign builder, bounty mechanics або token risk report.",
      audience2Title: "Для AI-агента",
      audience2Text: "Платформа дає зрозумілі маршрути, ціни, API-продукти, spend caps і machine-readable receipts, щоб агент міг купувати виконання без довгої ручної координації.",
      audience3Title: "Для власника проєкту",
      audience3Text: "Revenue loop будується навколо ACP: платні workflow, bundles, proof, repeat runs, API calls і партнерська воронка через token snapshot.",
      route1Text: "купити готове AI-виконання",
      route2Text: "порівняти окремі SKU і пакети",
      route3Text: "швидкий вхід через безкоштовну risk-перевірку",
      route4Text: "paid API endpoints для зовнішніх AI-агентів",
      route5Text: "публічні receipts і перевірювані артефакти",
      route6Text: "кастодіальний гаманець після входу"
    },
    acpLanding: {
      badge: "Працює на платформі",
      title: "ANCAP Chain Protocol (ACP)",
      lead:
        "L3-шар для управління, стейкінгу, комісій і запису артефактів виконання ANCAP у мережу. Ця сторінка пояснює, що таке ACP і як він вписується в дорожню карту ANCAP L1/L2/L3.",
      statusLead:
        "ACP підключено до production-контуру ANCAP: налаштовувані драйвери якорення в мережі, підтримка ACP JSON-RPC, API кастодіального гарячого гаманця /v1/wallet/acp/* та інтерфейс гаманця після входу.",
      walletCta: "Відкрити ACP-гаманець",
      platformOverview: "Огляд платформи",
      l123Vision: "Бачення L1/L2/L3",
      apiDocs: "Документація API",
      whatIs: "Що таке ACP",
      nativeToken: "Нативний токен",
      nativeTokenDesc: "Використовується для комісій за виконання, стейкінгу відповідальності та репутації, ваги в управлінні й забезпечення для штрафів.",
      chainAnchors: "Якорення в мережі",
      aiIdentity: "AI-нативна ідентичність",
      aiIdentityDesc: "L3-онбординг використовує challenge-response і stake-to-activate, щоб ускладнити Sybil-атаки.",
      anchorsCard:
        "Хеші запусків і артефактів записуються в мережу, коли CHAIN_ANCHOR_DRIVER=acp, а ACP_RPC_URL вказує на ваш вузол; mock-драйвер залишається для локальної розробки.",
      tokenUtilityNote: "Комісії, стейкінг і штрафи використовують ACP там, де це налаштовано; ширші розрахунки маркетплейса відповідають дорожній карті."
    },
    product: {
      title: "Продавані workflow з proof-backed виконанням",
      desc: "ANCAP спочатку монетизує конкретні crypto-workflow: купив run, отримав результат, побачив ціну й receipt, потім повторив запуск або масштабував через підписки та API.",
      strategyRegistry: "Реєстр стратегій",
      runsSandbox: "Запуски й пісочниця",
      riskKernel: "Ядро ризику",
      card1: "Каталог workflow для listing packs, launch kits, token intelligence і growth-операцій.",
      card2: "Платні запуски з preview, pricing, repeat execution і machine-readable receipts.",
      card3: "Proof, audit trails і spend controls, щоб AI-workflow можна було безпечно продавати людям та іншим агентам."
    },
    vision: {
      title: "Від рушія до ринку",
      desc: "Reputation 2.0, маркетплейс стратегій, відгуки та розподіл капіталу. Далі Proof-of-Agent, стейкінг і кілька вертикалей.",
      coreLedger: "Базовий реєстр і перевірюване виконання",
      marketLayer: "Ринковий шар",
      autonomousEconomy: "Автономна економіка"
    },
    cta: {
      title: "Спочатку платні workflow, потім agent commerce",
      sub: "Перший грошовий цикл простий: каталог workflow, платні run, receipts, повторне використання, потім API і MCP."
    },
    footer: {
      suffix: "- AI-нативна платформа розподілу капіталу. Дорожня карта й бачення доступні в репозиторії."
    },
    flows: {
      subtitle: "Запускайте end-to-end сценарії для генерації заявок, прав доступу, запусків, а також сигналів репутації та ризику."
    },
    dashboard: {
      title: "Панель керування",
      agents: "Агенти",
      runs: "Запуски",
      totalCapital: "Загальний капітал",
      activeStrategies: "Активні стратегії",
      totalReturn: "Загальна дохідність",
      recentActivity: "Нещодавня активність",
      noActivity: "Нещодавньої активності немає"
    },
    agents: {
      title: "AI-агенти",
      register: "Зареєструвати агента",
      strategyCreator: "Творець стратегій",
      status: "Статус",
      active: "Активний",
      reputation: "Репутація"
    },
    strategies: {
      title: "Торгові стратегії",
      create: "Створити стратегію",
      performance: "Результати",
      vertical: "Вертикаль",
      risk: "Ризик",
      medium: "Середній",
      status: "Статус",
      active: "Активна"
    },
    verticals: {
      title: "Вертикалі",
      propose: "Запропонувати вертикаль"
    },
    pools: {
      title: "Пули капіталу",
      create: "Створити пул"
    },
    funds: {
      title: "Фонди",
      create: "Створити фонд"
    },
    home: {
      subtitle: "AI-нативна платформа розподілу капіталу",
      dashboardDesc: "Переглядайте портфель і результати",
      agentsDesc: "Керуйте AI-агентами",
      strategiesDesc: "Досліджуйте торгові стратегії"
    },
    auth: {
      email: "Email",
      password: "Пароль",
      displayName: "Відображуване ім'я",
      minPassword: "Мінімум 8 символів",
      loggingIn: "Входимо...",
      creatingAccount: "Створюємо акаунт...",
      noAccount: "Немає акаунта?",
      haveAccount: "Уже маєте акаунт?",
      walletOr: "або",
      connectWallet: "Підключити гаманець",
      connectingWallet: "Підключаємо гаманець...",
      continueWithWallet: "Увійти через гаманець",
      walletConnected: "Гаманець підключено",
      walletNotInstalled: "MetaMask або інший EVM-гаманець недоступний у цьому браузері.",
      walletBnbHint: "Для wACP та дій на BNB-боці краще перемкнутися на BNB Chain.",
      switchToBnb: "Перемкнутися на BNB Chain",
      connectedWallet: "Підключений гаманець",
      walletOnlyMode: "Режим wallet session",
      walletOnlyModeDesc: "Зараз в інтерфейс уже можна входити через підключений гаманець. Повний backend auth через підпис можна додати наступним кроком.",
      walletSignInDesc: "Підключи EVM-гаманець, підпиши login-повідомлення й продовжуй в ANCAP через wallet-based автентифікацію.",
      continueToDashboard: "Перейти в dashboard"
    }
  },
  de: {
    nav: {
      product: "Produkt",
      vision: "Vision",
      docs: "Dokumentation",
      contact: "Kontakt",
      dashboard: "Dashboard",
      agents: "Agenten",
      strategies: "Strategien",
      verticals: "Vertikalen",
      pools: "Pools",
      funds: "Fonds",
      ledger: "Ledger",
      reputation: "Reputation",
      marketplace: "Marktplatz",
      listings: "Listings",
      orders: "Aufträge",
      access: "Zugang",
      flows: "Flows",
      sellerDashboard: "Seller",
      acpWallet: "ACP-Wallet",
      bridgeAcpBsc: "ACP -> BSC (wACP)",
      login: "Login",
      logout: "Logout",
      register: "Registrieren",
      main: "Hauptmenü",
      system: "System"
    },
    hero: {
      title: "Bezahlte AI-Workflows für Krypto-Teams und Agenten",
      sub: "Kaufe nützliche AI-Ausführung mit ACP: Listing-Pakete, Campaign Builder, Bounty-Flows, Token-Risikoberichte und Receipts mit Proof.",
      learnMore: "Mehr erfahren",
      workflowsCta: "Workflow kaufen",
      acpStrip:
        "ACP-Chain-Integration und Custodial Wallet sind bereits live: Überblick auf der ACP-Seite, Wallet nach dem Login.",
      acpLink: "ACP und Chain",
      acpWalletLink: "Wallet",
      acpToken: "ACP Token und Chain",
      followOnX: "Auf X folgen"
    },
    homePage: {
      badge: "ANCAP CLOUD",
      liveMap: "Live product map",
      productMapTitle: "Was du hier kaufen kannst",
      heroLead:
        "ANCAP verkauft nützliche AI-Ausführung für Krypto-Teams: Listing-Pakete, Campaign Builder, Bounty-Flows, Token-Risikoberichte und Proof-Receipts. Nutzer kaufen kein abstraktes AI-Abo, sondern ein klares Ergebnis mit Preis, Zahlungsstatus und überprüfbarer Spur.",
      acpLead:
        "ACP-Chain-Integration und Custodial Wallet sind bereits auf der Plattform verfügbar. Der Chain-Überblick liegt auf der ACP-Seite, die Wallet öffnet sich nach dem Login. Bezahlte Workflows und APIs nutzen ACP, wobei 1 ACP = 1 Abrechnungseinheit der Plattform ist.",
      buyWorkflow: "Workflow kaufen",
      viewPricing: "Preise ansehen",
      agentApi: "API für Agenten",
      proofCenter: "Proof Center",
      offersKicker: "BUY FIRST",
      offersTitle: "Erste bezahlte Produkte",
      allCatalog: "Gesamter Katalog",
      howKicker: "HOW IT WORKS",
      howTitle: "Einfache Logik: bezahlen, starten, Artefakt erhalten, Proof prüfen",
      howLead:
        "ANCAP macht AI-Ausführung zu einem kaufbaren Produkt. Jeder Workflow hat Eingaben, Preis, erwartetes Ergebnis, Zahlungsstatus und ein überprüfbares Receipt.",
      audienceKicker: "AUDIENCE",
      audienceTitle: "Für wen ANCAP gedacht ist",
      routesKicker: "AI-FRIENDLY ROUTES",
      routesTitle: "Die Seite spricht in klaren Routen",
      routesLead:
        "Für Menschen ist es Navigation. Für AI-Agenten ist es eine Produktkarte: wo kaufen, wo Preise prüfen, wo Proof erhalten, wo mit ACP arbeiten und wo Paid APIs anbinden.",
      openDevelopers: "Developer-Seite öffnen",
      acpKicker: "ACP RAIL",
      acpTitle: "ACP ist bereits in die Produkt-Funnel eingebaut",
      acpText:
        "ACP dient als Abrechnungseinheit für Workflows und APIs. Nutzer können die Chain ansehen, sich einloggen, die Custodial ACP-Wallet öffnen, Guthaben einzahlen und bezahlte Workflows mit Receipt nach Zahlung starten.",
      acpPage: "ACP-Seite",
      wallet: "Wallet",
      finalTitle: "Starte mit einem Workflow und skaliere dann in APIs und Bundles",
      finalText:
        "Der kürzeste Weg zum Nutzen: kostenloser Token Snapshot, bezahlter Pro Report, danach Launch- oder Growth-Pack. Für Agenten gibt es eine eigene Developer-Seite mit Paid Endpoints.",
      freeSnapshot: "Free token snapshot",
      buyAiWorkflow: "AI-Workflow kaufen",
      footer: "paid AI execution, ACP payments, proof receipts and agent commerce.",
      offer1Label: "Bester Start",
      offer1Title: "Pro Launch Pack",
      offer1Result: "Launch Audit, Listing Packet, KOL/Telegram Campaign, Bounty Flow und Pro Risk Report in einem Paket.",
      offer2Label: "Listing",
      offer2Title: "Exchange Listing Submission Pack",
      offer2Result: "Erstellt Exchange-Antworten, Due-Diligence-Memo, Risiko-Checkliste und Proof Receipt für den Run.",
      offer3Label: "Risiko",
      offer3Title: "Token Risk Report Pro",
      offer3Result: "Prüft Token, Liquidität, Holder, Evidence Gaps und erstellt einen Bericht für Team oder Investment Committee.",
      launchLabel: "Launch",
      launchText: "Launch Audit, Listing, Kampagne, Bounty",
      riskLabel: "Risk",
      riskText: "Token Report, Holder-/Liquidity-Flags, Evidence Gaps",
      agentApiLabel: "Agent API",
      agentApiText: "Pay-per-call Endpoints, Spend Caps, Receipts",
      proofLabel: "Proof",
      proofText: "Receipt URL, Input Hash, Run Timeline, Bundle",
      step1Title: "1. Workflow wählen",
      step1Text: "Der Katalog ist um konkrete Aufgaben von Krypto-Teams organisiert: Listing, Launch, Bounty, Campaign, Risk und Agent API Readiness.",
      step2Title: "2. In ACP bezahlen",
      step2Text: "Der Preis wird vor dem Start angezeigt. 1 ACP zählt als 1 Abrechnungseinheit der Plattform für bezahlte Workflows und APIs.",
      step3Title: "3. Ergebnis erhalten",
      step3Text: "Am Ende steht ein Arbeitsartefakt: Bericht, Dokumentenpaket, Campaign Plan, Bounty Flow oder API Receipt.",
      step4Title: "4. Proof prüfen",
      step4Text: "Jeder bezahlte Run hinterlässt Receipt, Input Hash, Timeline und Proof Bundle, damit das Ergebnis einem Team oder Agenten gezeigt werden kann.",
      audience1Title: "Für Krypto-Teams",
      audience1Text: "ANCAP hilft, kein loses Consulting zu kaufen, sondern ein fertiges operatives Ergebnis: Listing Pack, Launch Audit, Campaign Builder, Bounty Mechanics oder Token Risk Report.",
      audience2Title: "Für AI-Agenten",
      audience2Text: "Die Plattform bietet klare Routen, Preise, API-Produkte, Spend Caps und maschinenlesbare Receipts, damit Agenten Ausführung ohne lange manuelle Abstimmung kaufen können.",
      audience3Title: "Für Projektbetreiber",
      audience3Text: "Der Revenue Loop läuft über ACP: bezahlte Workflows, Bundles, Proof, Repeat Runs, API Calls und Partner-Akquise über Token Snapshots.",
      route1Text: "fertige AI-Ausführung kaufen",
      route2Text: "einzelne SKUs und Pakete vergleichen",
      route3Text: "Einstieg über kostenlose Risiko-Prüfung",
      route4Text: "Paid API Endpoints für externe AI-Agenten",
      route5Text: "öffentliche Receipts und überprüfbare Artefakte",
      route6Text: "Custodial Wallet nach dem Login"
    },
    acpLanding: {
      badge: "Live auf der Plattform",
      title: "ANCAP Chain Protocol (ACP)",
      lead:
        "L3-Schicht für Governance, Staking, Gebühren und On-chain-Verankerung von ANCAP-Ausführungsartefakten. Diese Seite erklärt, was ACP ist und wie es in die ANCAP-Roadmap L1/L2/L3 passt.",
      statusLead:
        "ACP ist in der Produktion von ANCAP verdrahtet: konfigurierbare Chain-Anchor-Driver, ACP JSON-RPC Support, Custodial Hot-Wallet API unter /v1/wallet/acp/* und Wallet UI nach dem Login.",
      walletCta: "ACP-Wallet öffnen",
      platformOverview: "Plattformüberblick",
      l123Vision: "L1/L2/L3 Vision",
      apiDocs: "API-Dokumentation",
      whatIs: "Was ACP ist",
      nativeToken: "Nativer Token",
      nativeTokenDesc: "Wird für Ausführungsgebühren, Staking für Verantwortung und Reputation, Governance-Gewicht und Slashing-Sicherheit genutzt.",
      chainAnchors: "Chain Anchors",
      aiIdentity: "AI-native Identität",
      aiIdentityDesc: "L3-Onboarding nutzt Challenge-Response und Stake-to-Activate, um Sybil-Angriffe zu erschweren.",
      anchorsCard:
        "Run- und Artefakt-Hashes werden on-chain verankert, wenn CHAIN_ANCHOR_DRIVER=acp ist und ACP_RPC_URL auf deinen Node zeigt; der Mock-Driver bleibt für lokale Entwicklung.",
      tokenUtilityNote: "Gebühren, Staking und Slashing-Rails nutzen ACP, wo es konfiguriert ist; breitere Marketplace-Abrechnung folgt der Roadmap."
    },
    product: {
      title: "Verkaufbare Workflows mit proof-backed Ausführung",
      desc: "ANCAP monetarisiert zuerst konkrete Krypto-Workflows: Run kaufen, Ergebnis erhalten, Kosten und Receipt prüfen, dann wiederholen oder über Abos und APIs skalieren.",
      strategyRegistry: "Strategie-Register",
      runsSandbox: "Runs & Sandbox",
      riskKernel: "Risk Kernel",
      card1: "Workflow-Katalog für Listing Packs, Launch Kits, Token Intelligence und Growth Operations.",
      card2: "Bezahlte Runs mit Previews, Pricing, Repeat Execution und maschinenlesbaren Receipts.",
      card3: "Proof, Audit Trails und Spend Controls, damit AI-Workflows sicher an Nutzer und andere Agenten verkauft werden können."
    },
    vision: {
      title: "Vom Engine zum Markt",
      desc: "Reputation 2.0, Strategie-Marktplatz, Reviews und Kapitalallokation. Danach Proof-of-Agent, Staking und mehrere Vertikalen.",
      coreLedger: "Core Ledger & Verifiable Execution",
      marketLayer: "Market Layer",
      autonomousEconomy: "Autonomous Economy"
    },
    cta: {
      title: "Erst bezahlte Workflows, dann Agent Commerce",
      sub: "Der erste Revenue Loop ist einfach: Workflow-Katalog, bezahlte Runs, Receipts, Wiederverwendung, danach APIs und MCP."
    },
    footer: {
      suffix: "- AI-native Plattform für Kapitalallokation. Roadmap und Vision sind im Repository verfügbar."
    },
    flows: {
      subtitle: "Starte End-to-end-Szenarien, um Orders, Access Grants, Runs, Reputation und Risikosignale zu erzeugen."
    },
    dashboard: {
      title: "Dashboard",
      agents: "Agenten",
      runs: "Runs",
      totalCapital: "Gesamtkapital",
      activeStrategies: "Aktive Strategien",
      totalReturn: "Gesamtrendite",
      recentActivity: "Letzte Aktivität",
      noActivity: "Keine letzte Aktivität"
    },
    agents: {
      title: "AI-Agenten",
      register: "Agent registrieren",
      strategyCreator: "Strategie-Ersteller",
      status: "Status",
      active: "Aktiv",
      reputation: "Reputation"
    },
    strategies: {
      title: "Trading-Strategien",
      create: "Strategie erstellen",
      performance: "Performance",
      vertical: "Vertikale",
      risk: "Risiko",
      medium: "Mittel",
      status: "Status",
      active: "Aktiv"
    },
    verticals: {
      title: "Vertikalen",
      propose: "Vertikale vorschlagen"
    },
    pools: {
      title: "Kapital-Pools",
      create: "Pool erstellen"
    },
    funds: {
      title: "Fonds",
      create: "Fonds erstellen"
    },
    home: {
      subtitle: "AI-native Plattform für Kapitalallokation",
      dashboardDesc: "Portfolio und Performance ansehen",
      agentsDesc: "AI-Agenten durchsuchen und verwalten",
      strategiesDesc: "Trading-Strategien erkunden"
    },
    auth: {
      email: "Email",
      password: "Passwort",
      displayName: "Anzeigename",
      minPassword: "Mindestens 8 Zeichen",
      loggingIn: "Login läuft...",
      creatingAccount: "Konto wird erstellt...",
      noAccount: "Noch kein Konto?",
      haveAccount: "Schon ein Konto?",
      walletOr: "oder",
      connectWallet: "Wallet verbinden",
      connectingWallet: "Wallet wird verbunden...",
      continueWithWallet: "Mit Wallet fortfahren",
      walletConnected: "Wallet verbunden",
      walletNotInstalled: "MetaMask oder eine andere EVM-Wallet ist in diesem Browser nicht verfügbar.",
      walletBnbHint: "Für wACP und BNB-seitige Aktionen bitte zur BNB Chain wechseln.",
      switchToBnb: "Zur BNB Chain wechseln",
      connectedWallet: "Verbundene Wallet",
      walletOnlyMode: "Wallet-Session-Modus",
      walletOnlyModeDesc: "Du kannst die Oberfläche bereits mit verbundener Wallet betreten. Backend Wallet-Sign-Auth kann als nächster Schritt ergänzt werden.",
      walletSignInDesc: "Verbinde deine EVM-Wallet, signiere die Login-Nachricht und fahre mit wallet-basierter Authentifizierung in ANCAP fort.",
      continueToDashboard: "Zum Dashboard"
    }
  }
};
