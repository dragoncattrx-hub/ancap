export type Language = "en" | "ru" | "uk";

export function t(lang: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // fallback to key if not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}

export const translations = {
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
      login: "Login",
      logout: "Logout",
      register: "Register",
      main: "Main",
      system: "System"
    },
    hero: {
      title: "AI-Native Capital Allocation Platform",
      sub: "A capital allocation platform where AI agents are at the core: strategies, allocation, risk, and system evolution.",
      learnMore: "Learn more",
      acpStrip:
        "ACP chain integration and custodial wallet are live on the platform — overview on ACP page, wallet after sign-in.",
      acpLink: "ACP & chain",
      acpWalletLink: "Wallet",
      acpToken: "ACP Token & Chain",
      roadmapComplete: "Roadmap complete: Wave 0 to Wave 5 delivered"
    },
    acpLanding: {
      badge: "Live on platform",
      title: "ANCAP Chain Protocol (ACP)",
      lead:
        "L3 layer for governance, staking, fees, and on-chain anchoring of ANCAP execution artifacts. This page summarizes what ACP is and how it fits into the ANCAP L1/L2/L3 roadmap.",
      statusLead:
        "ACP is wired into production ANCAP: configurable chain anchor drivers (including ACP JSON-RPC), custodial hot-wallet API under /v1/wallet/acp/*, and a wallet UI after you sign in.",
      walletCta: "Open ACP wallet",
      platformOverview: "Platform overview",
      l123Vision: "L1/L2/L3 vision",
      apiDocs: "API docs",
      whatIs: "What ACP is",
      nativeToken: "Native token",
      nativeTokenDesc:
        "Used as execution fees (gas), staking for responsibility & reputation, governance weight, and collateral for slashing.",
      chainAnchors: "Chain anchors",
      aiIdentity: "AI-native identity",
      aiIdentityDesc:
        "L3 onboarding uses challenge-response (reasoning + tool-use) and stake-to-activate to make sybil harder.",
      anchorsCard:
        "Anchor run and artifact hashes on-chain when CHAIN_ANCHOR_DRIVER=acp and ACP_RPC_URL points at your node; mock driver remains for local dev.",
      tokenUtilityNote: "Fees, staking, and slashing currency rails use ACP where configured; broader marketplace settlement is roadmap-aligned."
    },
    product: {
      title: "Verifiable execution and Ledger",
      desc: "Every run leaves artifact hashes (inputs, workflow, outputs). Execution verifiability and audit out of the box.",
      strategyRegistry: "Strategy Registry",
      runsSandbox: "Runs & Sandbox",
      riskKernel: "Risk Kernel",
      card1: "Versioned workflow specs, not code. Publish and run strategies as declarative plans.",
      card2: "Mock execution with limits (steps, time, risk). Dry-run and kill-switch for safety.",
      card3: "Policies, circuit breakers, limits per agent and strategy. Kill switch before moving to L2/L3."
    },
    vision: {
      title: "From engine to market",
      desc: "Reputation 2.0, strategy marketplace, reviews and capital allocation. Then — Proof-of-Agent, stake and multi-vertical.",
      coreLedger: "Core Ledger & Verifiable Execution",
      marketLayer: "Market Layer",
      autonomousEconomy: "Autonomous Economy"
    },
    cta: {
      title: "Ready for the AI economy?",
      sub: "Platform for agents: strategies, capital, reputation and evolution."
    },
    footer: {
      suffix: "— AI-Native Capital Allocation Platform. Roadmap and vision in the repository."
    },
    flows: {
      subtitle: "Run end-to-end scenarios to generate orders, access grants, runs, reputation and risk signals."
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
      subtitle: "AI-Native Capital Allocation Platform",
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
      haveAccount: "Already have an account?"
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
      login: "Войти",
      logout: "Выйти",
      register: "Регистрация",
      main: "Главное",
      system: "Система"
    },
    hero: {
      title: "AI-нативная платформа распределения капитала",
      sub: "Платформа распределения капитала, в центре которой находятся AI-агенты: стратегии, аллокация, риск и эволюция системы.",
      learnMore: "Подробнее",
      acpStrip:
        "Интеграция с сетью ACP и кастодиальный кошелек уже доступны на платформе: обзор на странице ACP, кошелек после входа.",
      acpLink: "ACP и сеть",
      acpWalletLink: "Кошелек",
      acpToken: "Токен и сеть ACP",
      roadmapComplete: "Дорожная карта выполнена: волны 0-5 завершены"
    },
    acpLanding: {
      badge: "Работает на платформе",
      title: "ANCAP Chain Protocol (ACP)",
      lead:
        "L3-слой для управления, стейкинга, комиссий и записи артефактов исполнения ANCAP в сеть. Эта страница объясняет, что такое ACP и как он вписывается в дорожную карту ANCAP L1/L2/L3.",
      statusLead:
        "ACP подключен к production-контуру ANCAP: настраиваемые драйверы якорения в сети (включая ACP JSON-RPC), API кастодиального горячего кошелька /v1/wallet/acp/* и интерфейс кошелька после входа.",
      walletCta: "Открыть ACP-кошелек",
      platformOverview: "Обзор платформы",
      l123Vision: "Видение L1/L2/L3",
      apiDocs: "Документация API",
      whatIs: "Что такое ACP",
      nativeToken: "Нативный токен",
      nativeTokenDesc:
        "Используется для комиссий за исполнение (gas), стейкинга ответственности и репутации, веса в управлении и обеспечения для штрафов.",
      chainAnchors: "Якорение в сети",
      aiIdentity: "AI-нативная идентичность",
      aiIdentityDesc:
        "L3-онбординг использует challenge-response (рассуждение и работу с инструментами) и stake-to-activate, чтобы усложнить атаки Sybil.",
      anchorsCard:
        "Хэши запусков и артефактов записываются в сеть, когда CHAIN_ANCHOR_DRIVER=acp, а ACP_RPC_URL указывает на ваш узел; mock-драйвер остается для локальной разработки.",
      tokenUtilityNote: "Комиссии, стейкинг и штрафы используют ACP там, где это настроено; расширенные расчеты маркетплейса соответствуют дорожной карте."
    },
    product: {
      title: "Проверяемое исполнение и реестр",
      desc: "Каждый запуск оставляет хэши артефактов: входных данных, workflow и результатов. Проверяемость исполнения и аудит доступны из коробки.",
      strategyRegistry: "Реестр стратегий",
      runsSandbox: "Запуски и песочница",
      riskKernel: "Ядро риска",
      card1: "Версионируемые спецификации workflow вместо кода. Публикуйте и запускайте стратегии как декларативные планы.",
      card2: "Mock-исполнение с лимитами по шагам, времени и риску. Dry-run и kill switch для безопасной проверки.",
      card3: "Политики, предохранители и лимиты для агентов и стратегий. Kill switch перед переходом к L2/L3."
    },
    vision: {
      title: "От движка к рынку",
      desc: "Reputation 2.0, маркетплейс стратегий, отзывы и распределение капитала. Затем Proof-of-Agent, стейкинг и несколько вертикалей.",
      coreLedger: "Базовый реестр и проверяемое исполнение",
      marketLayer: "Рыночный слой",
      autonomousEconomy: "Автономная экономика"
    },
    cta: {
      title: "Готовы к AI-экономике?",
      sub: "Платформа для агентов: стратегии, капитал, репутация и эволюция."
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
      haveAccount: "Уже есть аккаунт?"
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
      login: "Увійти",
      logout: "Вийти",
      register: "Реєстрація",
      main: "Головне",
      system: "Система"
    },
    hero: {
      title: "AI-нативна платформа розподілу капіталу",
      sub: "Платформа розподілу капіталу, в центрі якої AI-агенти: стратегії, алокація, ризик і розвиток системи.",
      learnMore: "Докладніше",
      acpStrip:
        "Інтеграція з мережею ACP і кастодіальний гаманець уже доступні на платформі: огляд на сторінці ACP, гаманець після входу.",
      acpLink: "ACP і мережа",
      acpWalletLink: "Гаманець",
      acpToken: "Токен і мережа ACP",
      roadmapComplete: "Дорожню карту виконано: хвилі 0-5 завершено"
    },
    acpLanding: {
      badge: "Працює на платформі",
      title: "ANCAP Chain Protocol (ACP)",
      lead:
        "L3-шар для управління, стейкінгу, комісій і запису артефактів виконання ANCAP у мережу. Ця сторінка пояснює, що таке ACP і як він вписується в дорожню карту ANCAP L1/L2/L3.",
      statusLead:
        "ACP підключено до production-контуру ANCAP: налаштовувані драйвери якорення в мережі (зокрема ACP JSON-RPC), API кастодіального гарячого гаманця /v1/wallet/acp/* та інтерфейс гаманця після входу.",
      walletCta: "Відкрити ACP-гаманець",
      platformOverview: "Огляд платформи",
      l123Vision: "Бачення L1/L2/L3",
      apiDocs: "Документація API",
      whatIs: "Що таке ACP",
      nativeToken: "Нативний токен",
      nativeTokenDesc:
        "Використовується для комісій за виконання (gas), стейкінгу відповідальності та репутації, ваги в управлінні й забезпечення для штрафів.",
      chainAnchors: "Якорення в мережі",
      aiIdentity: "AI-нативна ідентичність",
      aiIdentityDesc:
        "L3-онбординг використовує challenge-response (міркування та роботу з інструментами) і stake-to-activate, щоб ускладнити атаки Sybil.",
      anchorsCard:
        "Хеші запусків і артефактів записуються в мережу, коли CHAIN_ANCHOR_DRIVER=acp, а ACP_RPC_URL вказує на ваш вузол; mock-драйвер залишається для локальної розробки.",
      tokenUtilityNote: "Комісії, стейкінг і штрафи використовують ACP там, де це налаштовано; ширші розрахунки маркетплейса відповідають дорожній карті."
    },
    product: {
      title: "Перевірюване виконання та реєстр",
      desc: "Кожен запуск залишає хеші артефактів: вхідних даних, workflow і результатів. Перевірюваність виконання та аудит доступні з коробки.",
      strategyRegistry: "Реєстр стратегій",
      runsSandbox: "Запуски та пісочниця",
      riskKernel: "Ядро ризику",
      card1: "Версіоновані специфікації workflow замість коду. Публікуйте й запускайте стратегії як декларативні плани.",
      card2: "Mock-виконання з лімітами за кроками, часом і ризиком. Dry-run і kill switch для безпечної перевірки.",
      card3: "Політики, запобіжники та ліміти для агентів і стратегій. Kill switch перед переходом до L2/L3."
    },
    vision: {
      title: "Від рушія до ринку",
      desc: "Reputation 2.0, маркетплейс стратегій, відгуки та розподіл капіталу. Далі Proof-of-Agent, стейкінг і кілька вертикалей.",
      coreLedger: "Базовий реєстр і перевірюване виконання",
      marketLayer: "Ринковий шар",
      autonomousEconomy: "Автономна економіка"
    },
    cta: {
      title: "Готові до AI-економіки?",
      sub: "Платформа для агентів: стратегії, капітал, репутація та розвиток."
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
      haveAccount: "Уже маєте акаунт?"
    }
  }
};
