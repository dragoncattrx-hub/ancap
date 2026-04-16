export type Language = 'en' | 'ru';

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
      acpWallet: "ACP Wallet"
    },
    hero: {
      title: "AI-Native Capital Allocation Platform",
      sub: "A capital allocation platform where AI agents are at the core: strategies, allocation, risk, and system evolution.",
      learnMore: "Learn more",
      acpStrip:
        "ACP chain integration and custodial wallet are live on the platform — overview on ACP page, wallet after sign-in.",
      acpLink: "ACP & chain",
      acpWalletLink: "Wallet"
    },
    acpLanding: {
      badge: "Live on platform",
      statusLead:
        "ACP is wired into production ANCAP: configurable chain anchor drivers (including ACP JSON-RPC), custodial hot-wallet API under /v1/wallet/acp/*, and a wallet UI after you sign in.",
      walletCta: "Open ACP wallet",
      anchorsCard:
        "Anchor run and artifact hashes on-chain when CHAIN_ANCHOR_DRIVER=acp and ACP_RPC_URL points at your node; mock driver remains for local dev.",
      tokenUtilityNote: "Fees, staking, and slashing currency rails use ACP where configured; broader marketplace settlement is roadmap-aligned."
    },
    product: {
      title: "Verifiable execution and Ledger",
      desc: "Every run leaves artifact hashes (inputs, workflow, outputs). Execution verifiability and audit out of the box.",
      card1: "Versioned workflow specs, not code. Publish and run strategies as declarative plans.",
      card2: "Mock execution with limits (steps, time, risk). Dry-run and kill-switch for safety.",
      card3: "Policies, circuit breakers, limits per agent and strategy. Kill switch before moving to L2/L3."
    },
    vision: {
      title: "From engine to market",
      desc: "Reputation 2.0, strategy marketplace, reviews and capital allocation. Then — Proof-of-Agent, stake and multi-vertical."
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
    home: {
      subtitle: "AI-Native Capital Allocation Platform",
      dashboardDesc: "View your portfolio and performance",
      agentsDesc: "Browse and manage AI agents",
      strategiesDesc: "Explore trading strategies"
    }
  },
  ru: {
    nav: {
      product: "Продукт",
      vision: "Визия",
      docs: "Документация",
      contact: "Связаться",
      dashboard: "Панель",
      agents: "Агенты",
      strategies: "Стратегии",
      verticals: "Вертикали",
      pools: "Пулы",
      funds: "Фонды",
      ledger: "Леджер",
      reputation: "Репутация",
      marketplace: "Маркетплейс",
      listings: "Листинги",
      orders: "Заказы",
      access: "Доступ",
      flows: "Сценарии",
      sellerDashboard: "Продавец",
      acpWallet: "Кошелёк ACP"
    },
    hero: {
      title: "AI-Native Capital Allocation Platform",
      sub: "Платформа распределения капитала, где ядром являются AI-агенты: стратегии, аллокация, риск и эволюция системы.",
      learnMore: "Узнать больше",
      acpStrip:
        "Интеграция сети ACP и кастодиальный кошелёк доступны на платформе — обзор на странице ACP, кошелёк после входа.",
      acpLink: "ACP и сеть",
      acpWalletLink: "Кошелёк"
    },
    acpLanding: {
      badge: "Интеграция активна",
      statusLead:
        "ACP подключён к рабочему контуру ANCAP: драйверы якорей (в т.ч. ACP JSON-RPC), API кастодиального hot-wallet /v1/wallet/acp/* и UI кошелька после входа.",
      walletCta: "Открыть кошелёк ACP",
      anchorsCard:
        "Якорение хэшей runs/артефактов в сети при CHAIN_ANCHOR_DRIVER=acp и ACP_RPC_URL; для локальной разработки остаётся mock-драйвер.",
      tokenUtilityNote: "Комиссии, стейкинг и слэшинг в валюте ACP при соответствующей конфигурации; расширенные расчёты маркетплейса — по дорожной карте."
    },
    product: {
      title: "Верифицируемое исполнение и Ledger",
      desc: "Каждый run оставляет хэши артефактов (inputs, workflow, outputs). Доказуемость исполнения и аудит из коробки.",
      card1: "Версионируемые workflow-спеки, не код. Публикуй и запускай стратегии как декларативные планы.",
      card2: "Мок-исполнение с лимитами (шаги, время, риск). Dry-run и kill-switch для безопасности.",
      card3: "Политики, circuit breakers, лимиты по агентам и стратегиям. Стоп-кран до выхода в L2/L3."
    },
    vision: {
      title: "От движка к рынку",
      desc: "Reputation 2.0, маркетплейс стратегий, отзывы и аллокация капитала. Потом — Proof-of-Agent, stake и мультивертикали."
    },
    cta: {
      title: "Готовы к AI-экономике?",
      sub: "Платформа для агентов: стратегии, капитал, репутация и эволюция."
    },
    footer: {
      suffix: "— AI-Native Capital Allocation Platform. Дорожная карта и визия в репозитории."
    },
    flows: {
      subtitle: "Запускайте end-to-end сценарии, чтобы создавать сделки, доступы, runs и сигналы репутации/риска."
    },
    dashboard: {
      title: "Панель управления",
      totalCapital: "Общий капитал",
      activeStrategies: "Активные стратегии",
      totalReturn: "Общая доходность",
      recentActivity: "Недавняя активность",
      noActivity: "Нет недавней активности"
    },
    agents: {
      title: "AI Агенты",
      register: "Зарегистрировать агента",
      strategyCreator: "Создатель стратегий",
      status: "Статус",
      active: "Активен",
      reputation: "Репутация"
    },
    strategies: {
      title: "Торговые стратегии",
      create: "Создать стратегию",
      performance: "Производительность",
      vertical: "Вертикаль",
      risk: "Риск",
      medium: "Средний",
      status: "Статус",
      active: "Активна"
    },
    home: {
      subtitle: "AI-Native Capital Allocation Platform",
      dashboardDesc: "Просмотр портфеля и производительности",
      agentsDesc: "Управление AI агентами",
      strategiesDesc: "Изучение торговых стратегий"
    }
  }
};
