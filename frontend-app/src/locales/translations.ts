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
      bridgeAcpBsc: "ACP ÔåÆ BSC (wACP)",
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
        "ACP chain integration and custodial wallet are live on the platform ÔÇö overview on ACP page, wallet after sign-in.",
      acpLink: "ACP & chain",
      acpWalletLink: "Wallet",
      acpToken: "ACP Token & Chain",
      roadmapComplete: "Roadmap and release plan"
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
      desc: "Reputation 2.0, strategy marketplace, reviews and capital allocation. Then ÔÇö Proof-of-Agent, stake and multi-vertical.",
      coreLedger: "Core Ledger & Verifiable Execution",
      marketLayer: "Market Layer",
      autonomousEconomy: "Autonomous Economy"
    },
    cta: {
      title: "Ready for the AI economy?",
      sub: "Platform for agents: strategies, capital, reputation and evolution."
    },
    footer: {
      suffix: "ÔÇö AI-Native Capital Allocation Platform. Roadmap and vision in the repository."
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
      product: "ğƒĞÇğ¥ğ¦Ğâğ¦Ğé",
      vision: "ğÆğ©ğ¦ğÁğ¢ğ©ğÁ",
      docs: "ğöğ¥ğ¦Ğâğ+ğÁğ¢Ğéğ¦Ğåğ©ĞÅ",
      contact: "ğÜğ¥ğ¢Ğéğ¦ğ¦ĞéĞï",
      dashboard: "ğƒğ¦ğ¢ğÁğ+Ğî",
      agents: "ğÉğ¦ğÁğ¢ĞéĞï",
      strategies: "ğíĞéĞÇğ¦ĞéğÁğ¦ğ©ğ©",
      verticals: "ğÆğÁĞÇĞéğ©ğ¦ğ¦ğ+ğ©",
      pools: "ğƒĞâğ+Ğï",
      funds: "ğñğ¥ğ¢ğ¦Ğï",
      ledger: "ğáğÁğÁĞüĞéĞÇ",
      reputation: "ğáğÁğ+ĞâĞéğ¦Ğåğ©ĞÅ",
      marketplace: "ğ£ğ¦ĞÇğ¦ğÁĞéğ+ğ+ğÁğ¦Ğü",
      listings: "ğøğ©ĞüĞéğ©ğ¢ğ¦ğ©",
      orders: "ğùğ¦ĞÅğ¦ğ¦ğ©",
      access: "ğöğ¥ĞüĞéĞâğ+",
      flows: "ğíĞåğÁğ¢ğ¦ĞÇğ©ğ©",
      sellerDashboard: "ğƒĞÇğ¥ğ¦ğ¦ğ¦ğÁĞå",
      acpWallet: "ACP-ğ¦ğ¥ĞêğÁğ+ğÁğ¦",
      bridgeAcpBsc: "ACP ÔåÆ BSC (wACP)",
      login: "ğÆğ¥ğ¦Ğéğ©",
      logout: "ğÆĞïğ¦Ğéğ©",
      register: "ğáğÁğ¦ğ©ĞüĞéĞÇğ¦Ğåğ©ĞÅ",
      main: "ğôğ+ğ¦ğ¦ğ¢ğ¥ğÁ",
      system: "ğíğ©ĞüĞéğÁğ+ğ¦"
    },
    hero: {
      title: "AI-ğ¢ğ¦Ğéğ©ğ¦ğ¢ğ¦ĞÅ ğ+ğ+ğ¦ĞéĞäğ¥ĞÇğ+ğ¦ ĞÇğ¦Ğüğ+ĞÇğÁğ¦ğÁğ+ğÁğ¢ğ©ĞÅ ğ¦ğ¦ğ+ğ©Ğéğ¦ğ+ğ¦",
      sub: "ğƒğ+ğ¦ĞéĞäğ¥ĞÇğ+ğ¦ ĞÇğ¦Ğüğ+ĞÇğÁğ¦ğÁğ+ğÁğ¢ğ©ĞÅ ğ¦ğ¦ğ+ğ©Ğéğ¦ğ+ğ¦, ğ¦ ĞåğÁğ¢ĞéĞÇğÁ ğ¦ğ¥Ğéğ¥ĞÇğ¥ğ¦ ğ¢ğ¦Ğàğ¥ğ¦ĞÅĞéĞüĞÅ AI-ğ¦ğ¦ğÁğ¢ĞéĞï: ĞüĞéĞÇğ¦ĞéğÁğ¦ğ©ğ©, ğ¦ğ+ğ+ğ¥ğ¦ğ¦Ğåğ©ĞÅ, ĞÇğ©Ğüğ¦ ğ© Ğìğ¦ğ¥ğ+ĞÄĞåğ©ĞÅ Ğüğ©ĞüĞéğÁğ+Ğï.",
      learnMore: "ğƒğ¥ğ¦ĞÇğ¥ğ¦ğ¢ğÁğÁ",
      acpStrip:
        "ğÿğ¢ĞéğÁğ¦ĞÇğ¦Ğåğ©ĞÅ Ğü ĞüğÁĞéĞîĞÄ ACP ğ© ğ¦ğ¦ĞüĞéğ¥ğ¦ğ©ğ¦ğ+Ğîğ¢Ğïğ¦ ğ¦ğ¥ĞêğÁğ+ğÁğ¦ ĞâğÂğÁ ğ¦ğ¥ĞüĞéĞâğ+ğ¢Ğï ğ¢ğ¦ ğ+ğ+ğ¦ĞéĞäğ¥ĞÇğ+ğÁ: ğ¥ğ¦ğÀğ¥ĞÇ ğ¢ğ¦ ĞüĞéĞÇğ¦ğ¢ğ©ĞåğÁ ACP, ğ¦ğ¥ĞêğÁğ+ğÁğ¦ ğ+ğ¥Ğüğ+ğÁ ğ¦Ğàğ¥ğ¦ğ¦.",
      acpLink: "ACP ğ© ĞüğÁĞéĞî",
      acpWalletLink: "ğÜğ¥ĞêğÁğ+ğÁğ¦",
      acpToken: "ğóğ¥ğ¦ğÁğ¢ ğ© ĞüğÁĞéĞî ACP",
      roadmapComplete: "ğöğ¥ĞÇğ¥ğÂğ¢ğ¦ĞÅ ğ¦ğ¦ĞÇĞéğ¦ ğ© ğ+ğ+ğ¦ğ¢ ĞÇğÁğ+ğ©ğÀğ¥ğ¦"
    },
    acpLanding: {
      badge: "ğáğ¦ğ¦ğ¥Ğéğ¦ğÁĞé ğ¢ğ¦ ğ+ğ+ğ¦ĞéĞäğ¥ĞÇğ+ğÁ",
      title: "ANCAP Chain Protocol (ACP)",
      lead:
        "L3-Ğüğ+ğ¥ğ¦ ğ¦ğ+ĞÅ Ğâğ+ĞÇğ¦ğ¦ğ+ğÁğ¢ğ©ĞÅ, ĞüĞéğÁğ¦ğ¦ğ©ğ¢ğ¦ğ¦, ğ¦ğ¥ğ+ğ©ĞüĞüğ©ğ¦ ğ© ğÀğ¦ğ+ğ©Ğüğ© ğ¦ĞÇĞéğÁĞäğ¦ğ¦Ğéğ¥ğ¦ ğ©Ğüğ+ğ¥ğ+ğ¢ğÁğ¢ğ©ĞÅ ANCAP ğ¦ ĞüğÁĞéĞî. ğ¡Ğéğ¦ ĞüĞéĞÇğ¦ğ¢ğ©Ğåğ¦ ğ¥ğ¦ĞèĞÅĞüğ¢ĞÅğÁĞé, ĞçĞéğ¥ Ğéğ¦ğ¦ğ¥ğÁ ACP ğ© ğ¦ğ¦ğ¦ ğ¥ğ¢ ğ¦ğ+ğ©ĞüĞïğ¦ğ¦ğÁĞéĞüĞÅ ğ¦ ğ¦ğ¥ĞÇğ¥ğÂğ¢ĞâĞÄ ğ¦ğ¦ĞÇĞéĞâ ANCAP L1/L2/L3.",
      statusLead:
        "ACP ğ+ğ¥ğ¦ğ¦ğ+ĞÄĞçğÁğ¢ ğ¦ production-ğ¦ğ¥ğ¢ĞéĞâĞÇĞâ ANCAP: ğ¢ğ¦ĞüĞéĞÇğ¦ğ©ğ¦ğ¦ğÁğ+ĞïğÁ ğ¦ĞÇğ¦ğ¦ğ¦ğÁĞÇĞï ĞÅğ¦ğ¥ĞÇğÁğ¢ğ©ĞÅ ğ¦ ĞüğÁĞéğ© (ğ¦ğ¦ğ+ĞÄĞçğ¦ĞÅ ACP JSON-RPC), API ğ¦ğ¦ĞüĞéğ¥ğ¦ğ©ğ¦ğ+Ğîğ¢ğ¥ğ¦ğ¥ ğ¦ğ¥ĞÇĞÅĞçğÁğ¦ğ¥ ğ¦ğ¥ĞêğÁğ+Ğîğ¦ğ¦ /v1/wallet/acp/* ğ© ğ©ğ¢ĞéğÁĞÇĞäğÁğ¦Ğü ğ¦ğ¥ĞêğÁğ+Ğîğ¦ğ¦ ğ+ğ¥Ğüğ+ğÁ ğ¦Ğàğ¥ğ¦ğ¦.",
      walletCta: "ğ×Ğéğ¦ĞÇĞïĞéĞî ACP-ğ¦ğ¥ĞêğÁğ+ğÁğ¦",
      platformOverview: "ğ×ğ¦ğÀğ¥ĞÇ ğ+ğ+ğ¦ĞéĞäğ¥ĞÇğ+Ğï",
      l123Vision: "ğÆğ©ğ¦ğÁğ¢ğ©ğÁ L1/L2/L3",
      apiDocs: "ğöğ¥ğ¦Ğâğ+ğÁğ¢Ğéğ¦Ğåğ©ĞÅ API",
      whatIs: "ğºĞéğ¥ Ğéğ¦ğ¦ğ¥ğÁ ACP",
      nativeToken: "ğØğ¦Ğéğ©ğ¦ğ¢Ğïğ¦ Ğéğ¥ğ¦ğÁğ¢",
      nativeTokenDesc:
        "ğÿĞüğ+ğ¥ğ+ĞîğÀĞâğÁĞéĞüĞÅ ğ¦ğ+ĞÅ ğ¦ğ¥ğ+ğ©ĞüĞüğ©ğ¦ ğÀğ¦ ğ©Ğüğ+ğ¥ğ+ğ¢ğÁğ¢ğ©ğÁ (gas), ĞüĞéğÁğ¦ğ¦ğ©ğ¢ğ¦ğ¦ ğ¥Ğéğ¦ğÁĞéĞüĞéğ¦ğÁğ¢ğ¢ğ¥ĞüĞéğ© ğ© ĞÇğÁğ+ĞâĞéğ¦Ğåğ©ğ©, ğ¦ğÁĞüğ¦ ğ¦ Ğâğ+ĞÇğ¦ğ¦ğ+ğÁğ¢ğ©ğ© ğ© ğ¥ğ¦ğÁĞüğ+ğÁĞçğÁğ¢ğ©ĞÅ ğ¦ğ+ĞÅ ĞêĞéĞÇğ¦Ğäğ¥ğ¦.",
      chainAnchors: "ğ»ğ¦ğ¥ĞÇğÁğ¢ğ©ğÁ ğ¦ ĞüğÁĞéğ©",
      aiIdentity: "AI-ğ¢ğ¦Ğéğ©ğ¦ğ¢ğ¦ĞÅ ğ©ğ¦ğÁğ¢Ğéğ©Ğçğ¢ğ¥ĞüĞéĞî",
      aiIdentityDesc:
        "L3-ğ¥ğ¢ğ¦ğ¥ĞÇğ¦ğ©ğ¢ğ¦ ğ©Ğüğ+ğ¥ğ+ĞîğÀĞâğÁĞé challenge-response (ĞÇğ¦ĞüĞüĞâğÂğ¦ğÁğ¢ğ©ğÁ ğ© ĞÇğ¦ğ¦ğ¥ĞéĞâ Ğü ğ©ğ¢ĞüĞéĞÇĞâğ+ğÁğ¢Ğéğ¦ğ+ğ©) ğ© stake-to-activate, ĞçĞéğ¥ğ¦Ğï ĞâĞüğ+ğ¥ğÂğ¢ğ©ĞéĞî ğ¦Ğéğ¦ğ¦ğ© Sybil.",
      anchorsCard:
        "ğÑĞìĞêğ© ğÀğ¦ğ+ĞâĞüğ¦ğ¥ğ¦ ğ© ğ¦ĞÇĞéğÁĞäğ¦ğ¦Ğéğ¥ğ¦ ğÀğ¦ğ+ğ©ĞüĞïğ¦ğ¦ĞÄĞéĞüĞÅ ğ¦ ĞüğÁĞéĞî, ğ¦ğ¥ğ¦ğ¦ğ¦ CHAIN_ANCHOR_DRIVER=acp, ğ¦ ACP_RPC_URL Ğâğ¦ğ¦ğÀĞïğ¦ğ¦ğÁĞé ğ¢ğ¦ ğ¦ğ¦Ğê ĞâğÀğÁğ+; mock-ğ¦ĞÇğ¦ğ¦ğ¦ğÁĞÇ ğ¥ĞüĞéğ¦ğÁĞéĞüĞÅ ğ¦ğ+ĞÅ ğ+ğ¥ğ¦ğ¦ğ+Ğîğ¢ğ¥ğ¦ ĞÇğ¦ğÀĞÇğ¦ğ¦ğ¥Ğéğ¦ğ©.",
      tokenUtilityNote: "ğÜğ¥ğ+ğ©ĞüĞüğ©ğ©, ĞüĞéğÁğ¦ğ¦ğ©ğ¢ğ¦ ğ© ĞêĞéĞÇğ¦ĞäĞï ğ©Ğüğ+ğ¥ğ+ĞîğÀĞâĞÄĞé ACP Ğéğ¦ğ+, ğ¦ğ¦ğÁ ĞìĞéğ¥ ğ¢ğ¦ĞüĞéĞÇğ¥ğÁğ¢ğ¥; ĞÇğ¦ĞüĞêğ©ĞÇğÁğ¢ğ¢ĞïğÁ ĞÇğ¦ĞüĞçğÁĞéĞï ğ+ğ¦ĞÇğ¦ğÁĞéğ+ğ+ğÁğ¦Ğüğ¦ Ğüğ¥ğ¥Ğéğ¦ğÁĞéĞüĞéğ¦ĞâĞÄĞé ğ¦ğ¥ĞÇğ¥ğÂğ¢ğ¥ğ¦ ğ¦ğ¦ĞÇĞéğÁ."
    },
    product: {
      title: "ğƒĞÇğ¥ğ¦ğÁĞÇĞÅğÁğ+ğ¥ğÁ ğ©Ğüğ+ğ¥ğ+ğ¢ğÁğ¢ğ©ğÁ ğ© ĞÇğÁğÁĞüĞéĞÇ",
      desc: "ğÜğ¦ğÂğ¦Ğïğ¦ ğÀğ¦ğ+ĞâĞüğ¦ ğ¥ĞüĞéğ¦ğ¦ğ+ĞÅğÁĞé ĞàĞìĞêğ© ğ¦ĞÇĞéğÁĞäğ¦ğ¦Ğéğ¥ğ¦: ğ¦Ğàğ¥ğ¦ğ¢ĞïĞà ğ¦ğ¦ğ¢ğ¢ĞïĞà, workflow ğ© ĞÇğÁğÀĞâğ+ĞîĞéğ¦Ğéğ¥ğ¦. ğƒĞÇğ¥ğ¦ğÁĞÇĞÅğÁğ+ğ¥ĞüĞéĞî ğ©Ğüğ+ğ¥ğ+ğ¢ğÁğ¢ğ©ĞÅ ğ© ğ¦Ğâğ¦ğ©Ğé ğ¦ğ¥ĞüĞéĞâğ+ğ¢Ğï ğ©ğÀ ğ¦ğ¥ĞÇğ¥ğ¦ğ¦ğ©.",
      strategyRegistry: "ğáğÁğÁĞüĞéĞÇ ĞüĞéĞÇğ¦ĞéğÁğ¦ğ©ğ¦",
      runsSandbox: "ğùğ¦ğ+ĞâĞüğ¦ğ© ğ© ğ+ğÁĞüğ¥Ğçğ¢ğ©Ğåğ¦",
      riskKernel: "ğ»ğ¦ĞÇğ¥ ĞÇğ©Ğüğ¦ğ¦",
      card1: "ğÆğÁĞÇĞüğ©ğ¥ğ¢ğ©ĞÇĞâğÁğ+ĞïğÁ Ğüğ+ğÁĞåğ©Ğäğ©ğ¦ğ¦Ğåğ©ğ© workflow ğ¦ğ+ğÁĞüĞéğ¥ ğ¦ğ¥ğ¦ğ¦. ğƒĞâğ¦ğ+ğ©ğ¦Ğâğ¦ĞéğÁ ğ© ğÀğ¦ğ+ĞâĞüğ¦ğ¦ğ¦ĞéğÁ ĞüĞéĞÇğ¦ĞéğÁğ¦ğ©ğ© ğ¦ğ¦ğ¦ ğ¦ğÁğ¦ğ+ğ¦ĞÇğ¦Ğéğ©ğ¦ğ¢ĞïğÁ ğ+ğ+ğ¦ğ¢Ğï.",
      card2: "Mock-ğ©Ğüğ+ğ¥ğ+ğ¢ğÁğ¢ğ©ğÁ Ğü ğ+ğ©ğ+ğ©Ğéğ¦ğ+ğ© ğ+ğ¥ Ğêğ¦ğ¦ğ¦ğ+, ğ¦ĞÇğÁğ+ğÁğ¢ğ© ğ© ĞÇğ©Ğüğ¦Ğâ. Dry-run ğ© kill switch ğ¦ğ+ĞÅ ğ¦ğÁğÀğ¥ğ+ğ¦Ğüğ¢ğ¥ğ¦ ğ+ĞÇğ¥ğ¦ğÁĞÇğ¦ğ©.",
      card3: "ğƒğ¥ğ+ğ©Ğéğ©ğ¦ğ©, ğ+ĞÇğÁğ¦ğ¥ĞàĞÇğ¦ğ¢ğ©ĞéğÁğ+ğ© ğ© ğ+ğ©ğ+ğ©ĞéĞï ğ¦ğ+ĞÅ ğ¦ğ¦ğÁğ¢Ğéğ¥ğ¦ ğ© ĞüĞéĞÇğ¦ĞéğÁğ¦ğ©ğ¦. Kill switch ğ+ğÁĞÇğÁğ¦ ğ+ğÁĞÇğÁĞàğ¥ğ¦ğ¥ğ+ ğ¦ L2/L3."
    },
    vision: {
      title: "ğ×Ğé ğ¦ğ¦ğ©ğÂğ¦ğ¦ ğ¦ ĞÇĞïğ¢ğ¦Ğâ",
      desc: "Reputation 2.0, ğ+ğ¦ĞÇğ¦ğÁĞéğ+ğ+ğÁğ¦Ğü ĞüĞéĞÇğ¦ĞéğÁğ¦ğ©ğ¦, ğ¥ĞéğÀĞïğ¦Ğï ğ© ĞÇğ¦Ğüğ+ĞÇğÁğ¦ğÁğ+ğÁğ¢ğ©ğÁ ğ¦ğ¦ğ+ğ©Ğéğ¦ğ+ğ¦. ğùğ¦ĞéğÁğ+ Proof-of-Agent, ĞüĞéğÁğ¦ğ¦ğ©ğ¢ğ¦ ğ© ğ¢ğÁĞüğ¦ğ¥ğ+Ğîğ¦ğ¥ ğ¦ğÁĞÇĞéğ©ğ¦ğ¦ğ+ğÁğ¦.",
      coreLedger: "ğæğ¦ğÀğ¥ğ¦Ğïğ¦ ĞÇğÁğÁĞüĞéĞÇ ğ© ğ+ĞÇğ¥ğ¦ğÁĞÇĞÅğÁğ+ğ¥ğÁ ğ©Ğüğ+ğ¥ğ+ğ¢ğÁğ¢ğ©ğÁ",
      marketLayer: "ğáĞïğ¢ğ¥Ğçğ¢Ğïğ¦ Ğüğ+ğ¥ğ¦",
      autonomousEconomy: "ğÉğ¦Ğéğ¥ğ¢ğ¥ğ+ğ¢ğ¦ĞÅ Ğìğ¦ğ¥ğ¢ğ¥ğ+ğ©ğ¦ğ¦"
    },
    cta: {
      title: "ğôğ¥Ğéğ¥ğ¦Ğï ğ¦ AI-Ğìğ¦ğ¥ğ¢ğ¥ğ+ğ©ğ¦ğÁ?",
      sub: "ğƒğ+ğ¦ĞéĞäğ¥ĞÇğ+ğ¦ ğ¦ğ+ĞÅ ğ¦ğ¦ğÁğ¢Ğéğ¥ğ¦: ĞüĞéĞÇğ¦ĞéğÁğ¦ğ©ğ©, ğ¦ğ¦ğ+ğ©Ğéğ¦ğ+, ĞÇğÁğ+ĞâĞéğ¦Ğåğ©ĞÅ ğ© Ğìğ¦ğ¥ğ+ĞÄĞåğ©ĞÅ."
    },
    footer: {
      suffix: "- AI-ğ¢ğ¦Ğéğ©ğ¦ğ¢ğ¦ĞÅ ğ+ğ+ğ¦ĞéĞäğ¥ĞÇğ+ğ¦ ĞÇğ¦Ğüğ+ĞÇğÁğ¦ğÁğ+ğÁğ¢ğ©ĞÅ ğ¦ğ¦ğ+ğ©Ğéğ¦ğ+ğ¦. ğöğ¥ĞÇğ¥ğÂğ¢ğ¦ĞÅ ğ¦ğ¦ĞÇĞéğ¦ ğ© ğ¦ğ©ğ¦ğÁğ¢ğ©ğÁ ğ¦ğ¥ĞüĞéĞâğ+ğ¢Ğï ğ¦ ĞÇğÁğ+ğ¥ğÀğ©Ğéğ¥ĞÇğ©ğ©."
    },
    flows: {
      subtitle: "ğùğ¦ğ+ĞâĞüğ¦ğ¦ğ¦ĞéğÁ end-to-end ĞüĞåğÁğ¢ğ¦ĞÇğ©ğ© ğ¦ğ+ĞÅ ğ¦ğÁğ¢ğÁĞÇğ¦Ğåğ©ğ© ğÀğ¦ĞÅğ¦ğ¥ğ¦, ğ+ĞÇğ¦ğ¦ ğ¦ğ¥ĞüĞéĞâğ+ğ¦, ğÀğ¦ğ+ĞâĞüğ¦ğ¥ğ¦, ğ¦ Ğéğ¦ğ¦ğÂğÁ Ğüğ©ğ¦ğ¢ğ¦ğ+ğ¥ğ¦ ĞÇğÁğ+ĞâĞéğ¦Ğåğ©ğ© ğ© ĞÇğ©Ğüğ¦ğ¦."
    },
    dashboard: {
      title: "ğƒğ¦ğ¢ğÁğ+Ğî Ğâğ+ĞÇğ¦ğ¦ğ+ğÁğ¢ğ©ĞÅ",
      agents: "ğÉğ¦ğÁğ¢ĞéĞï",
      runs: "ğùğ¦ğ+ĞâĞüğ¦ğ©",
      totalCapital: "ğ×ğ¦Ğëğ©ğ¦ ğ¦ğ¦ğ+ğ©Ğéğ¦ğ+",
      activeStrategies: "ğÉğ¦Ğéğ©ğ¦ğ¢ĞïğÁ ĞüĞéĞÇğ¦ĞéğÁğ¦ğ©ğ©",
      totalReturn: "ğ×ğ¦Ğëğ¦ĞÅ ğ¦ğ¥Ğàğ¥ğ¦ğ¢ğ¥ĞüĞéĞî",
      recentActivity: "ğØğÁğ¦ğ¦ğ¦ğ¢ĞÅĞÅ ğ¦ğ¦Ğéğ©ğ¦ğ¢ğ¥ĞüĞéĞî",
      noActivity: "ğØğÁğ¦ğ¦ğ¦ğ¢ğÁğ¦ ğ¦ğ¦Ğéğ©ğ¦ğ¢ğ¥ĞüĞéğ© ğ¢ğÁĞé"
    },
    agents: {
      title: "AI-ğ¦ğ¦ğÁğ¢ĞéĞï",
      register: "ğùğ¦ĞÇğÁğ¦ğ©ĞüĞéĞÇğ©ĞÇğ¥ğ¦ğ¦ĞéĞî ğ¦ğ¦ğÁğ¢Ğéğ¦",
      strategyCreator: "ğíğ¥ğÀğ¦ğ¦ĞéğÁğ+Ğî ĞüĞéĞÇğ¦ĞéğÁğ¦ğ©ğ¦",
      status: "ğíĞéğ¦ĞéĞâĞü",
      active: "ğÉğ¦Ğéğ©ğ¦ğÁğ¢",
      reputation: "ğáğÁğ+ĞâĞéğ¦Ğåğ©ĞÅ"
    },
    strategies: {
      title: "ğóğ¥ĞÇğ¦ğ¥ğ¦ĞïğÁ ĞüĞéĞÇğ¦ĞéğÁğ¦ğ©ğ©",
      create: "ğíğ¥ğÀğ¦ğ¦ĞéĞî ĞüĞéĞÇğ¦ĞéğÁğ¦ğ©ĞÄ",
      performance: "ğáğÁğÀĞâğ+ĞîĞéğ¦ĞéĞï",
      vertical: "ğÆğÁĞÇĞéğ©ğ¦ğ¦ğ+Ğî",
      risk: "ğáğ©Ğüğ¦",
      medium: "ğíĞÇğÁğ¦ğ¢ğ©ğ¦",
      status: "ğíĞéğ¦ĞéĞâĞü",
      active: "ğÉğ¦Ğéğ©ğ¦ğ¢ğ¦"
    },
    verticals: {
      title: "ğÆğÁĞÇĞéğ©ğ¦ğ¦ğ+ğ©",
      propose: "ğƒĞÇğÁğ¦ğ+ğ¥ğÂğ©ĞéĞî ğ¦ğÁĞÇĞéğ©ğ¦ğ¦ğ+Ğî"
    },
    pools: {
      title: "ğƒĞâğ+Ğï ğ¦ğ¦ğ+ğ©Ğéğ¦ğ+ğ¦",
      create: "ğíğ¥ğÀğ¦ğ¦ĞéĞî ğ+Ğâğ+"
    },
    funds: {
      title: "ğñğ¥ğ¢ğ¦Ğï",
      create: "ğíğ¥ğÀğ¦ğ¦ĞéĞî Ğäğ¥ğ¢ğ¦"
    },
    home: {
      subtitle: "AI-ğ¢ğ¦Ğéğ©ğ¦ğ¢ğ¦ĞÅ ğ+ğ+ğ¦ĞéĞäğ¥ĞÇğ+ğ¦ ĞÇğ¦Ğüğ+ĞÇğÁğ¦ğÁğ+ğÁğ¢ğ©ĞÅ ğ¦ğ¦ğ+ğ©Ğéğ¦ğ+ğ¦",
      dashboardDesc: "ğƒĞÇğ¥Ğüğ+ğ¦ĞéĞÇğ©ğ¦ğ¦ğ¦ĞéğÁ ğ+ğ¥ĞÇĞéĞäğÁğ+Ğî ğ© ĞÇğÁğÀĞâğ+ĞîĞéğ¦ĞéĞï",
      agentsDesc: "ğúğ+ĞÇğ¦ğ¦ğ+ĞÅğ¦ĞéğÁ AI-ğ¦ğ¦ğÁğ¢Ğéğ¦ğ+ğ©",
      strategiesDesc: "ğÿğÀĞâĞçğ¦ğ¦ĞéğÁ Ğéğ¥ĞÇğ¦ğ¥ğ¦ĞïğÁ ĞüĞéĞÇğ¦ĞéğÁğ¦ğ©ğ©"
    },
    auth: {
      email: "Email",
      password: "ğƒğ¦ĞÇğ¥ğ+Ğî",
      displayName: "ğ×Ğéğ¥ğ¦ĞÇğ¦ğÂğ¦ğÁğ+ğ¥ğÁ ğ©ğ+ĞÅ",
      minPassword: "ğ£ğ©ğ¢ğ©ğ+Ğâğ+ 8 Ğüğ©ğ+ğ¦ğ¥ğ+ğ¥ğ¦",
      loggingIn: "ğÆĞàğ¥ğ¦ğ©ğ+...",
      creatingAccount: "ğíğ¥ğÀğ¦ğ¦ğÁğ+ ğ¦ğ¦ğ¦ğ¦Ğâğ¢Ğé...",
      noAccount: "ğØğÁĞé ğ¦ğ¦ğ¦ğ¦Ğâğ¢Ğéğ¦?",
      haveAccount: "ğúğÂğÁ ğÁĞüĞéĞî ğ¦ğ¦ğ¦ğ¦Ğâğ¢Ğé?"
    }
  },
  uk: {
    nav: {
      product: "ğƒĞÇğ¥ğ¦Ğâğ¦Ğé",
      vision: "ğæğ¦ĞçğÁğ¢ğ¢ĞÅ",
      docs: "ğöğ¥ğ¦Ğâğ+ğÁğ¢Ğéğ¦ĞåĞûĞÅ",
      contact: "ğÜğ¥ğ¢Ğéğ¦ğ¦Ğéğ©",
      dashboard: "ğƒğ¦ğ¢ğÁğ+Ğî",
      agents: "ğÉğ¦ğÁğ¢Ğéğ©",
      strategies: "ğíĞéĞÇğ¦ĞéğÁğ¦ĞûĞù",
      verticals: "ğÆğÁĞÇĞéğ©ğ¦ğ¦ğ+Ğû",
      pools: "ğƒĞâğ+ğ©",
      funds: "ğñğ¥ğ¢ğ¦ğ©",
      ledger: "ğáğÁĞöĞüĞéĞÇ",
      reputation: "ğáğÁğ+ĞâĞéğ¦ĞåĞûĞÅ",
      marketplace: "ğ£ğ¦ĞÇğ¦ğÁĞéğ+ğ+ğÁğ¦Ğü",
      listings: "ğøĞûĞüĞéğ©ğ¢ğ¦ğ©",
      orders: "ğùğ¦ĞÅğ¦ğ¦ğ©",
      access: "ğöğ¥ĞüĞéĞâğ+",
      flows: "ğíĞåğÁğ¢ğ¦ĞÇĞûĞù",
      sellerDashboard: "ğƒĞÇğ¥ğ¦ğ¦ğ¦ğÁĞåĞî",
      acpWallet: "ACP-ğ¦ğ¦ğ+ğ¦ğ¢ğÁĞåĞî",
      bridgeAcpBsc: "ACP ÔåÆ BSC (wACP)",
      login: "ğúğ¦Ğûğ¦Ğéğ©",
      logout: "ğÆğ©ğ¦Ğéğ©",
      register: "ğáğÁĞöĞüĞéĞÇğ¦ĞåĞûĞÅ",
      main: "ğôğ¥ğ+ğ¥ğ¦ğ¢ğÁ",
      system: "ğíğ©ĞüĞéğÁğ+ğ¦"
    },
    hero: {
      title: "AI-ğ¢ğ¦Ğéğ©ğ¦ğ¢ğ¦ ğ+ğ+ğ¦ĞéĞäğ¥ĞÇğ+ğ¦ ĞÇğ¥ğÀğ+ğ¥ğ¦Ğûğ+Ğâ ğ¦ğ¦ğ+ĞûĞéğ¦ğ+Ğâ",
      sub: "ğƒğ+ğ¦ĞéĞäğ¥ĞÇğ+ğ¦ ĞÇğ¥ğÀğ+ğ¥ğ¦Ğûğ+Ğâ ğ¦ğ¦ğ+ĞûĞéğ¦ğ+Ğâ, ğ¦ ĞåğÁğ¢ĞéĞÇĞû ĞÅğ¦ğ¥Ğù AI-ğ¦ğ¦ğÁğ¢Ğéğ©: ĞüĞéĞÇğ¦ĞéğÁğ¦ĞûĞù, ğ¦ğ+ğ¥ğ¦ğ¦ĞåĞûĞÅ, ĞÇğ©ğÀğ©ğ¦ Ğû ĞÇğ¥ğÀğ¦ğ©Ğéğ¥ğ¦ Ğüğ©ĞüĞéğÁğ+ğ©.",
      learnMore: "ğöğ¥ğ¦ğ+ğ¦ğ¦ğ¢ĞûĞêğÁ",
      acpStrip:
        "ğåğ¢ĞéğÁğ¦ĞÇğ¦ĞåĞûĞÅ ğÀ ğ+ğÁĞÇğÁğÂğÁĞÄ ACP Ğû ğ¦ğ¦ĞüĞéğ¥ğ¦Ğûğ¦ğ+Ğîğ¢ğ©ğ¦ ğ¦ğ¦ğ+ğ¦ğ¢ğÁĞåĞî ĞâğÂğÁ ğ¦ğ¥ĞüĞéĞâğ+ğ¢Ğû ğ¢ğ¦ ğ+ğ+ğ¦ĞéĞäğ¥ĞÇğ+Ğû: ğ¥ğ¦ğ+ĞÅğ¦ ğ¢ğ¦ ĞüĞéğ¥ĞÇĞûğ¢ĞåĞû ACP, ğ¦ğ¦ğ+ğ¦ğ¢ğÁĞåĞî ğ+ĞûĞüğ+ĞÅ ğ¦Ğàğ¥ğ¦Ğâ.",
      acpLink: "ACP Ğû ğ+ğÁĞÇğÁğÂğ¦",
      acpWalletLink: "ğôğ¦ğ+ğ¦ğ¢ğÁĞåĞî",
      acpToken: "ğóğ¥ğ¦ğÁğ¢ Ğû ğ+ğÁĞÇğÁğÂğ¦ ACP",
      roadmapComplete: "ğöğ¥ĞÇğ¥ğÂğ¢ĞÄ ğ¦ğ¦ĞÇĞéĞâ ğ¦ğ©ğ¦ğ¥ğ¢ğ¦ğ¢ğ¥: Ğàğ¦ğ©ğ+Ğû 0-5 ğÀğ¦ğ¦ğÁĞÇĞêğÁğ¢ğ¥"
    },
    acpLanding: {
      badge: "ğƒĞÇğ¦ĞåĞÄĞö ğ¢ğ¦ ğ+ğ+ğ¦ĞéĞäğ¥ĞÇğ+Ğû",
      title: "ANCAP Chain Protocol (ACP)",
      lead:
        "L3-Ğêğ¦ĞÇ ğ¦ğ+ĞÅ Ğâğ+ĞÇğ¦ğ¦ğ+Ğûğ¢ğ¢ĞÅ, ĞüĞéğÁğ¦ğ¦Ğûğ¢ğ¦Ğâ, ğ¦ğ¥ğ+ĞûĞüĞûğ¦ Ğû ğÀğ¦ğ+ğ©ĞüĞâ ğ¦ĞÇĞéğÁĞäğ¦ğ¦ĞéĞûğ¦ ğ¦ğ©ğ¦ğ¥ğ¢ğ¦ğ¢ğ¢ĞÅ ANCAP Ğâ ğ+ğÁĞÇğÁğÂĞâ. ğªĞÅ ĞüĞéğ¥ĞÇĞûğ¢ğ¦ğ¦ ğ+ğ¥ĞÅĞüğ¢ĞÄĞö, Ğëğ¥ Ğéğ¦ğ¦ğÁ ACP Ğû ĞÅğ¦ ğ¦Ğûğ¢ ğ¦ğ+ğ©ĞüĞâĞöĞéĞîĞüĞÅ ğ¦ ğ¦ğ¥ĞÇğ¥ğÂğ¢ĞÄ ğ¦ğ¦ĞÇĞéĞâ ANCAP L1/L2/L3.",
      statusLead:
        "ACP ğ+Ğûğ¦ğ¦ğ+ĞÄĞçğÁğ¢ğ¥ ğ¦ğ¥ production-ğ¦ğ¥ğ¢ĞéĞâĞÇĞâ ANCAP: ğ¢ğ¦ğ+ğ¦ĞêĞéğ¥ğ¦Ğâğ¦ğ¦ğ¢Ğû ğ¦ĞÇğ¦ğ¦ğ¦ğÁĞÇğ© ĞÅğ¦ğ¥ĞÇğÁğ¢ğ¢ĞÅ ğ¦ ğ+ğÁĞÇğÁğÂĞû (ğÀğ¥ğ¦ĞÇğÁğ+ğ¦ ACP JSON-RPC), API ğ¦ğ¦ĞüĞéğ¥ğ¦Ğûğ¦ğ+Ğîğ¢ğ¥ğ¦ğ¥ ğ¦ğ¦ĞÇĞÅĞçğ¥ğ¦ğ¥ ğ¦ğ¦ğ+ğ¦ğ¢ĞåĞÅ /v1/wallet/acp/* Ğéğ¦ Ğûğ¢ĞéğÁĞÇĞäğÁğ¦Ğü ğ¦ğ¦ğ+ğ¦ğ¢ĞåĞÅ ğ+ĞûĞüğ+ĞÅ ğ¦Ğàğ¥ğ¦Ğâ.",
      walletCta: "ğÆĞûğ¦ğ¦ĞÇğ©Ğéğ© ACP-ğ¦ğ¦ğ+ğ¦ğ¢ğÁĞåĞî",
      platformOverview: "ğ×ğ¦ğ+ĞÅğ¦ ğ+ğ+ğ¦ĞéĞäğ¥ĞÇğ+ğ©",
      l123Vision: "ğæğ¦ĞçğÁğ¢ğ¢ĞÅ L1/L2/L3",
      apiDocs: "ğöğ¥ğ¦Ğâğ+ğÁğ¢Ğéğ¦ĞåĞûĞÅ API",
      whatIs: "ğ®ğ¥ Ğéğ¦ğ¦ğÁ ACP",
      nativeToken: "ğØğ¦Ğéğ©ğ¦ğ¢ğ©ğ¦ Ğéğ¥ğ¦ğÁğ¢",
      nativeTokenDesc:
        "ğÆğ©ğ¦ğ¥ĞÇğ©ĞüĞéğ¥ğ¦ĞâĞöĞéĞîĞüĞÅ ğ¦ğ+ĞÅ ğ¦ğ¥ğ+ĞûĞüĞûğ¦ ğÀğ¦ ğ¦ğ©ğ¦ğ¥ğ¢ğ¦ğ¢ğ¢ĞÅ (gas), ĞüĞéğÁğ¦ğ¦Ğûğ¢ğ¦Ğâ ğ¦Ğûğ¦ğ+ğ¥ğ¦Ğûğ¦ğ¦ğ+Ğîğ¢ğ¥ĞüĞéĞû Ğéğ¦ ĞÇğÁğ+ĞâĞéğ¦ĞåĞûĞù, ğ¦ğ¦ğ¦ğ© ğ¦ Ğâğ+ĞÇğ¦ğ¦ğ+Ğûğ¢ğ¢Ğû ğ¦ ğÀğ¦ğ¦ğÁğÀğ+ğÁĞçğÁğ¢ğ¢ĞÅ ğ¦ğ+ĞÅ ĞêĞéĞÇğ¦ĞäĞûğ¦.",
      chainAnchors: "ğ»ğ¦ğ¥ĞÇğÁğ¢ğ¢ĞÅ ğ¦ ğ+ğÁĞÇğÁğÂĞû",
      aiIdentity: "AI-ğ¢ğ¦Ğéğ©ğ¦ğ¢ğ¦ Ğûğ¦ğÁğ¢Ğéğ©Ğçğ¢ĞûĞüĞéĞî",
      aiIdentityDesc:
        "L3-ğ¥ğ¢ğ¦ğ¥ĞÇğ¦ğ©ğ¢ğ¦ ğ¦ğ©ğ¦ğ¥ĞÇğ©ĞüĞéğ¥ğ¦ĞâĞö challenge-response (ğ+ĞûĞÇğ¦Ğâğ¦ğ¦ğ¢ğ¢ĞÅ Ğéğ¦ ĞÇğ¥ğ¦ğ¥ĞéĞâ ğÀ Ğûğ¢ĞüĞéĞÇĞâğ+ğÁğ¢Ğéğ¦ğ+ğ©) Ğû stake-to-activate, Ğëğ¥ğ¦ ĞâĞüğ¦ğ+ğ¦ğ¦ğ¢ğ©Ğéğ© ğ¦Ğéğ¦ğ¦ğ© Sybil.",
      anchorsCard:
        "ğÑğÁĞêĞû ğÀğ¦ğ+ĞâĞüğ¦Ğûğ¦ Ğû ğ¦ĞÇĞéğÁĞäğ¦ğ¦ĞéĞûğ¦ ğÀğ¦ğ+ğ©ĞüĞâĞÄĞéĞîĞüĞÅ ğ¦ ğ+ğÁĞÇğÁğÂĞâ, ğ¦ğ¥ğ+ğ© CHAIN_ANCHOR_DRIVER=acp, ğ¦ ACP_RPC_URL ğ¦ğ¦ğ¦ğÀĞâĞö ğ¢ğ¦ ğ¦ğ¦Ğê ğ¦ĞâğÀğ¥ğ+; mock-ğ¦ĞÇğ¦ğ¦ğ¦ğÁĞÇ ğÀğ¦ğ+ğ©Ğêğ¦ĞöĞéĞîĞüĞÅ ğ¦ğ+ĞÅ ğ+ğ¥ğ¦ğ¦ğ+Ğîğ¢ğ¥Ğù ĞÇğ¥ğÀĞÇğ¥ğ¦ğ¦ğ©.",
      tokenUtilityNote: "ğÜğ¥ğ+ĞûĞüĞûĞù, ĞüĞéğÁğ¦ğ¦Ğûğ¢ğ¦ Ğû ĞêĞéĞÇğ¦Ğäğ© ğ¦ğ©ğ¦ğ¥ĞÇğ©ĞüĞéğ¥ğ¦ĞâĞÄĞéĞî ACP Ğéğ¦ğ+, ğ¦ğÁ ĞåğÁ ğ¢ğ¦ğ+ğ¦ĞêĞéğ¥ğ¦ğ¦ğ¢ğ¥; Ğêğ©ĞÇĞêĞû ĞÇğ¥ğÀĞÇğ¦ĞàĞâğ¢ğ¦ğ© ğ+ğ¦ĞÇğ¦ğÁĞéğ+ğ+ğÁğ¦Ğüğ¦ ğ¦Ğûğ¦ğ+ğ¥ğ¦Ğûğ¦ğ¦ĞÄĞéĞî ğ¦ğ¥ĞÇğ¥ğÂğ¢Ğûğ¦ ğ¦ğ¦ĞÇĞéĞû."
    },
    product: {
      title: "ğƒğÁĞÇğÁğ¦ĞûĞÇĞÄğ¦ğ¦ğ¢ğÁ ğ¦ğ©ğ¦ğ¥ğ¢ğ¦ğ¢ğ¢ĞÅ Ğéğ¦ ĞÇğÁĞöĞüĞéĞÇ",
      desc: "ğÜğ¥ğÂğÁğ¢ ğÀğ¦ğ+ĞâĞüğ¦ ğÀğ¦ğ+ğ©Ğêğ¦Ğö ĞàğÁĞêĞû ğ¦ĞÇĞéğÁĞäğ¦ğ¦ĞéĞûğ¦: ğ¦ĞàĞûğ¦ğ¢ğ©Ğà ğ¦ğ¦ğ¢ğ©Ğà, workflow Ğû ĞÇğÁğÀĞâğ+ĞîĞéğ¦ĞéĞûğ¦. ğƒğÁĞÇğÁğ¦ĞûĞÇĞÄğ¦ğ¦ğ¢ĞûĞüĞéĞî ğ¦ğ©ğ¦ğ¥ğ¢ğ¦ğ¢ğ¢ĞÅ Ğéğ¦ ğ¦Ğâğ¦ğ©Ğé ğ¦ğ¥ĞüĞéĞâğ+ğ¢Ğû ğÀ ğ¦ğ¥ĞÇğ¥ğ¦ğ¦ğ©.",
      strategyRegistry: "ğáğÁĞöĞüĞéĞÇ ĞüĞéĞÇğ¦ĞéğÁğ¦Ğûğ¦",
      runsSandbox: "ğùğ¦ğ+ĞâĞüğ¦ğ© Ğéğ¦ ğ+ĞûĞüğ¥Ğçğ¢ğ©ĞåĞÅ",
      riskKernel: "ğ»ğ¦ĞÇğ¥ ĞÇğ©ğÀğ©ğ¦Ğâ",
      card1: "ğÆğÁĞÇĞüĞûğ¥ğ¢ğ¥ğ¦ğ¦ğ¢Ğû Ğüğ+ğÁĞåğ©ĞäĞûğ¦ğ¦ĞåĞûĞù workflow ğÀğ¦ğ+ĞûĞüĞéĞî ğ¦ğ¥ğ¦Ğâ. ğƒĞâğ¦ğ+Ğûğ¦Ğâğ¦ĞéğÁ ğ¦ ğÀğ¦ğ+ĞâĞüğ¦ğ¦ğ¦ĞéğÁ ĞüĞéĞÇğ¦ĞéğÁğ¦ĞûĞù ĞÅğ¦ ğ¦ğÁğ¦ğ+ğ¦ĞÇğ¦Ğéğ©ğ¦ğ¢Ğû ğ+ğ+ğ¦ğ¢ğ©.",
      card2: "Mock-ğ¦ğ©ğ¦ğ¥ğ¢ğ¦ğ¢ğ¢ĞÅ ğÀ ğ+Ğûğ+ĞûĞéğ¦ğ+ğ© ğÀğ¦ ğ¦ĞÇğ¥ğ¦ğ¦ğ+ğ©, Ğçğ¦Ğüğ¥ğ+ Ğû ĞÇğ©ğÀğ©ğ¦ğ¥ğ+. Dry-run Ğû kill switch ğ¦ğ+ĞÅ ğ¦ğÁğÀğ+ğÁĞçğ¢ğ¥Ğù ğ+ğÁĞÇğÁğ¦ĞûĞÇğ¦ğ©.",
      card3: "ğƒğ¥ğ+ĞûĞéğ©ğ¦ğ©, ğÀğ¦ğ+ğ¥ğ¦ĞûğÂğ¢ğ©ğ¦ğ© Ğéğ¦ ğ+Ğûğ+ĞûĞéğ© ğ¦ğ+ĞÅ ğ¦ğ¦ğÁğ¢ĞéĞûğ¦ Ğû ĞüĞéĞÇğ¦ĞéğÁğ¦Ğûğ¦. Kill switch ğ+ğÁĞÇğÁğ¦ ğ+ğÁĞÇğÁĞàğ¥ğ¦ğ¥ğ+ ğ¦ğ¥ L2/L3."
    },
    vision: {
      title: "ğÆĞûğ¦ ĞÇĞâĞêĞûĞÅ ğ¦ğ¥ ĞÇğ©ğ¢ğ¦Ğâ",
      desc: "Reputation 2.0, ğ+ğ¦ĞÇğ¦ğÁĞéğ+ğ+ğÁğ¦Ğü ĞüĞéĞÇğ¦ĞéğÁğ¦Ğûğ¦, ğ¦Ğûğ¦ğ¦Ğâğ¦ğ© Ğéğ¦ ĞÇğ¥ğÀğ+ğ¥ğ¦Ğûğ+ ğ¦ğ¦ğ+ĞûĞéğ¦ğ+Ğâ. ğöğ¦ğ+Ğû Proof-of-Agent, ĞüĞéğÁğ¦ğ¦Ğûğ¢ğ¦ Ğû ğ¦Ğûğ+Ğîğ¦ğ¦ ğ¦ğÁĞÇĞéğ©ğ¦ğ¦ğ+ğÁğ¦.",
      coreLedger: "ğæğ¦ğÀğ¥ğ¦ğ©ğ¦ ĞÇğÁĞöĞüĞéĞÇ Ğû ğ+ğÁĞÇğÁğ¦ĞûĞÇĞÄğ¦ğ¦ğ¢ğÁ ğ¦ğ©ğ¦ğ¥ğ¢ğ¦ğ¢ğ¢ĞÅ",
      marketLayer: "ğáğ©ğ¢ğ¦ğ¥ğ¦ğ©ğ¦ Ğêğ¦ĞÇ",
      autonomousEconomy: "ğÉğ¦Ğéğ¥ğ¢ğ¥ğ+ğ¢ğ¦ ğÁğ¦ğ¥ğ¢ğ¥ğ+Ğûğ¦ğ¦"
    },
    cta: {
      title: "ğôğ¥Ğéğ¥ğ¦Ğû ğ¦ğ¥ AI-ğÁğ¦ğ¥ğ¢ğ¥ğ+Ğûğ¦ğ©?",
      sub: "ğƒğ+ğ¦ĞéĞäğ¥ĞÇğ+ğ¦ ğ¦ğ+ĞÅ ğ¦ğ¦ğÁğ¢ĞéĞûğ¦: ĞüĞéĞÇğ¦ĞéğÁğ¦ĞûĞù, ğ¦ğ¦ğ+ĞûĞéğ¦ğ+, ĞÇğÁğ+ĞâĞéğ¦ĞåĞûĞÅ Ğéğ¦ ĞÇğ¥ğÀğ¦ğ©Ğéğ¥ğ¦."
    },
    footer: {
      suffix: "- AI-ğ¢ğ¦Ğéğ©ğ¦ğ¢ğ¦ ğ+ğ+ğ¦ĞéĞäğ¥ĞÇğ+ğ¦ ĞÇğ¥ğÀğ+ğ¥ğ¦Ğûğ+Ğâ ğ¦ğ¦ğ+ĞûĞéğ¦ğ+Ğâ. ğöğ¥ĞÇğ¥ğÂğ¢ĞÅ ğ¦ğ¦ĞÇĞéğ¦ ğ¦ ğ¦ğ¦ĞçğÁğ¢ğ¢ĞÅ ğ¦ğ¥ĞüĞéĞâğ+ğ¢Ğû ğ¦ ĞÇğÁğ+ğ¥ğÀğ©Ğéğ¥ĞÇĞûĞù."
    },
    flows: {
      subtitle: "ğùğ¦ğ+ĞâĞüğ¦ğ¦ğ¦ĞéğÁ end-to-end ĞüĞåğÁğ¢ğ¦ĞÇĞûĞù ğ¦ğ+ĞÅ ğ¦ğÁğ¢ğÁĞÇğ¦ĞåĞûĞù ğÀğ¦ĞÅğ¦ğ¥ğ¦, ğ+ĞÇğ¦ğ¦ ğ¦ğ¥ĞüĞéĞâğ+Ğâ, ğÀğ¦ğ+ĞâĞüğ¦Ğûğ¦, ğ¦ Ğéğ¦ğ¦ğ¥ğÂ Ğüğ©ğ¦ğ¢ğ¦ğ+Ğûğ¦ ĞÇğÁğ+ĞâĞéğ¦ĞåĞûĞù Ğéğ¦ ĞÇğ©ğÀğ©ğ¦Ğâ."
    },
    dashboard: {
      title: "ğƒğ¦ğ¢ğÁğ+Ğî ğ¦ğÁĞÇĞâğ¦ğ¦ğ¢ğ¢ĞÅ",
      agents: "ğÉğ¦ğÁğ¢Ğéğ©",
      runs: "ğùğ¦ğ+ĞâĞüğ¦ğ©",
      totalCapital: "ğùğ¦ğ¦ğ¦ğ+Ğîğ¢ğ©ğ¦ ğ¦ğ¦ğ+ĞûĞéğ¦ğ+",
      activeStrategies: "ğÉğ¦Ğéğ©ğ¦ğ¢Ğû ĞüĞéĞÇğ¦ĞéğÁğ¦ĞûĞù",
      totalReturn: "ğùğ¦ğ¦ğ¦ğ+Ğîğ¢ğ¦ ğ¦ğ¥ĞàĞûğ¦ğ¢ĞûĞüĞéĞî",
      recentActivity: "ğØğÁĞëğ¥ğ¦ğ¦ğ¦ğ¢ĞÅ ğ¦ğ¦Ğéğ©ğ¦ğ¢ĞûĞüĞéĞî",
      noActivity: "ğØğÁĞëğ¥ğ¦ğ¦ğ¦ğ¢Ğîğ¥Ğù ğ¦ğ¦Ğéğ©ğ¦ğ¢ğ¥ĞüĞéĞû ğ¢ğÁğ+ğ¦Ğö"
    },
    agents: {
      title: "AI-ğ¦ğ¦ğÁğ¢Ğéğ©",
      register: "ğùğ¦ĞÇğÁĞöĞüĞéĞÇĞâğ¦ğ¦Ğéğ© ğ¦ğ¦ğÁğ¢Ğéğ¦",
      strategyCreator: "ğóğ¦ğ¥ĞÇğÁĞåĞî ĞüĞéĞÇğ¦ĞéğÁğ¦Ğûğ¦",
      status: "ğíĞéğ¦ĞéĞâĞü",
      active: "ğÉğ¦Ğéğ©ğ¦ğ¢ğ©ğ¦",
      reputation: "ğáğÁğ+ĞâĞéğ¦ĞåĞûĞÅ"
    },
    strategies: {
      title: "ğóğ¥ĞÇğ¦ğ¥ğ¦Ğû ĞüĞéĞÇğ¦ĞéğÁğ¦ĞûĞù",
      create: "ğíĞéğ¦ğ¥ĞÇğ©Ğéğ© ĞüĞéĞÇğ¦ĞéğÁğ¦ĞûĞÄ",
      performance: "ğáğÁğÀĞâğ+ĞîĞéğ¦Ğéğ©",
      vertical: "ğÆğÁĞÇĞéğ©ğ¦ğ¦ğ+Ğî",
      risk: "ğáğ©ğÀğ©ğ¦",
      medium: "ğíğÁĞÇğÁğ¦ğ¢Ğûğ¦",
      status: "ğíĞéğ¦ĞéĞâĞü",
      active: "ğÉğ¦Ğéğ©ğ¦ğ¢ğ¦"
    },
    verticals: {
      title: "ğÆğÁĞÇĞéğ©ğ¦ğ¦ğ+Ğû",
      propose: "ğùğ¦ğ+ĞÇğ¥ğ+ğ¥ğ¢Ğâğ¦ğ¦Ğéğ© ğ¦ğÁĞÇĞéğ©ğ¦ğ¦ğ+Ğî"
    },
    pools: {
      title: "ğƒĞâğ+ğ© ğ¦ğ¦ğ+ĞûĞéğ¦ğ+Ğâ",
      create: "ğíĞéğ¦ğ¥ĞÇğ©Ğéğ© ğ+Ğâğ+"
    },
    funds: {
      title: "ğñğ¥ğ¢ğ¦ğ©",
      create: "ğíĞéğ¦ğ¥ĞÇğ©Ğéğ© Ğäğ¥ğ¢ğ¦"
    },
    home: {
      subtitle: "AI-ğ¢ğ¦Ğéğ©ğ¦ğ¢ğ¦ ğ+ğ+ğ¦ĞéĞäğ¥ĞÇğ+ğ¦ ĞÇğ¥ğÀğ+ğ¥ğ¦Ğûğ+Ğâ ğ¦ğ¦ğ+ĞûĞéğ¦ğ+Ğâ",
      dashboardDesc: "ğƒğÁĞÇğÁğ¦ğ+ĞÅğ¦ğ¦ğ¦ĞéğÁ ğ+ğ¥ĞÇĞéĞäğÁğ+Ğî Ğû ĞÇğÁğÀĞâğ+ĞîĞéğ¦Ğéğ©",
      agentsDesc: "ğÜğÁĞÇĞâğ¦ĞéğÁ AI-ğ¦ğ¦ğÁğ¢Ğéğ¦ğ+ğ©",
      strategiesDesc: "ğöğ¥Ğüğ+Ğûğ¦ğÂĞâğ¦ĞéğÁ Ğéğ¥ĞÇğ¦ğ¥ğ¦Ğû ĞüĞéĞÇğ¦ĞéğÁğ¦ĞûĞù"
    },
    auth: {
      email: "Email",
      password: "ğƒğ¦ĞÇğ¥ğ+Ğî",
      displayName: "ğÆĞûğ¦ğ¥ğ¦ĞÇğ¦ğÂĞâğ¦ğ¦ğ¢ğÁ Ğûğ+'ĞÅ",
      minPassword: "ğ£Ğûğ¢Ğûğ+Ğâğ+ 8 Ğüğ©ğ+ğ¦ğ¥ğ+Ğûğ¦",
      loggingIn: "ğÆĞàğ¥ğ¦ğ©ğ+ğ¥...",
      creatingAccount: "ğíĞéğ¦ğ¥ĞÇĞÄĞöğ+ğ¥ ğ¦ğ¦ğ¦Ğâğ¢Ğé...",
      noAccount: "ğØğÁğ+ğ¦Ğö ğ¦ğ¦ğ¦Ğâğ¢Ğéğ¦?",
      haveAccount: "ğúğÂğÁ ğ+ğ¦ĞöĞéğÁ ğ¦ğ¦ğ¦Ğâğ¢Ğé?"
    }
  }
};
