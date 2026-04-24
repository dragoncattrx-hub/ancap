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
      product: "Product",
      vision: "Vision",
      docs: "Documentation",
      contact: "Contact",
      dashboard: "Panel",
      agents: "Agents",
      strategies: "Strategies",
      verticals: "Verticals",
      pools: "Pool",
      funds: "Funds",
      ledger: "Ledger",
      reputation: "Reputation",
      marketplace: "Marketplace",
      listings: "Listingi",
      orders: "Orders",
      access: "Access",
      flows: "Scenarios",
      sellerDashboard: "Seller",
      acpWallet: "ACP Wallet"
    },
    hero: {
      title: "AI-Native Capital Allocation Platform",
      sub: "Capital distribution platform, where the core is AI agents: strategies, allocation, risk and system evolution.",
      learnMore: "Learn more",
      acpStrip:
        "ACP network integration and custodial wallet are available on the platform - overview on the ACP page, wallet after logging in.",
      acpLink: "ACP and network",
      acpWalletLink: "Wallet"
    },
    acpLanding: {
      badge: "Integration active",
      statusLead:
        "ACP is connected to the ANCAP work circuit: anchor drivers (including ACP JSON-RPC), custodial hot-wallet API /v1/wallet/acp/* and wallet UI after login.",
      walletCta: "Open ACP wallet",
      anchorsCard:
        "Anchoring hashes of runs/artifacts on the network with CHAIN_ANCHOR_DRIVER=acp and ACP_RPC_URL; a mock driver remains for local development.",
      tokenUtilityNote: "Commissions, staking and slashing in ACP currency with the appropriate configuration; advanced marketplace calculations - according to the roadmap."
    },
    product: {
      title: "Verifiable Execution and Ledger",
      desc: "Each run leaves hashes of artifacts (inputs, workflow, outputs). Provability of execution and auditing out of the box.",
      card1: "Versionable workflow spec, or code. Publish and execute strategies as declarative plans.",
      card2: "Mock execution with limits (steps, time, risk). Dry-run and kill-switch for safety.",
      card3: "Policies, circuit breakers, limits on agents and strategies. Stop valve before entering L2/L3."
    },
    vision: {
      title: "From engine to market",
      desc: "Reputation 2.0, strategy marketplace, reviews and capital allocation. Then - Proof-of-Agent, stake and multi-verticals."
    },
    cta: {
      title: "Ready for the AI ​​economy?",
      sub: "Agent platform: strategies, capital, reputation and evolution."
    },
    footer: {
      suffix: "—AI-Native Capital Allocation Platform. Roadmap and vision in the repository."
    },
    flows: {
      subtitle: "Run end-to-end scripts to generate deals, accesses, runs, and reputation/risk signals."
    },
    dashboard: {
      title: "Control Panel",
      totalCapital: "Total capital",
      activeStrategies: "Active strategies",
      totalReturn: "Total return",
      recentActivity: "Recent Activity",
      noActivity: "No recent activity"
    },
    agents: {
      title: "AI Agents",
      register: "Register agent",
      strategyCreator: "Strategy Creator",
      status: "Status",
      active: "Active",
      reputation: "Reputation"
    },
    strategies: {
      title: "Trading strategies",
      create: "Create a strategy",
      performance: "Performance",
      vertical: "Vertical",
      risk: "Risk",
      medium: "Medium",
      status: "Status",
      active: "Active"
    },
    home: {
      subtitle: "AI-Native Capital Allocation Platform",
      dashboardDesc: "View portfolio and performance",
      agentsDesc: "Manage AI agents",
      strategiesDesc: "Exploring trading strategies"
    }
  }
};
