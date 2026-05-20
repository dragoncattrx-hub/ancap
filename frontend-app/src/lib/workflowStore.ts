export type WorkflowTemplate = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  price: { amount: string; currency: string };
  accepted_currencies: string[];
  estimated_time_minutes: number;
  preview_items: string[];
  output_items: string[];
  receipt_items: string[];
  status?: string;
  tags: string[];
};

export type WorkflowBundle = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  workflow_slugs: string[];
  price: { amount: string; currency: string };
  accepted_currencies: string[];
  discount_percent: number;
  estimated_time_minutes: number;
  output_items: string[];
  tags: string[];
};

export type WorkflowCreditPackage = {
  slug: string;
  title: string;
  description: string;
  price: { amount: string; currency: string };
  credit_amount: { amount: string; currency: string };
  accepted_currencies: string[];
  bonus_percent: number;
  recommended_for: string[];
};

export const fallbackWorkflowTemplates: WorkflowTemplate[] = [
  {
    slug: "token-listing-pack",
    title: "Token Listing Pack",
    category: "Launch",
    summary: "Generate reusable listing answers for exchanges, token pages, and directories.",
    description: "Creates short and long project copy, listing form answers, and exchange-friendly token descriptions.",
    price: { amount: "10", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    estimated_time_minutes: 20,
    preview_items: ["Short project summary", "Listing answer preview", "Output structure"],
    output_items: ["Token bio", "Project description", "Listing answers", "Receipt"],
    receipt_items: ["workflow_slug", "price_snapshot", "input_hash", "status_timeline"],
    tags: ["listing", "launch", "token"],
  },
  {
    slug: "crypto-campaign-builder",
    title: "Crypto Campaign Builder",
    category: "Marketing",
    summary: "Build a launch or growth plan for Telegram, X, community actions, and referral loops.",
    description: "Creates a structured 7/14/30-day campaign plan with messaging, actions, and execution checklist.",
    price: { amount: "19", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    estimated_time_minutes: 30,
    preview_items: ["Campaign skeleton", "Channel mix", "Execution phases"],
    output_items: ["Campaign plan", "Post ideas", "Contest mechanics", "Receipt"],
    receipt_items: ["workflow_slug", "price_snapshot", "input_hash", "proof_metadata"],
    tags: ["marketing", "growth", "campaign"],
  },
  {
    slug: "telegram-growth-kit",
    title: "Telegram Growth Kit",
    category: "Community",
    summary: "Design a Telegram operating kit with rules, posting flow, onboarding, and moderation guidance.",
    description: "Produces a practical operating pack for crypto communities that want cleaner growth and moderation structure.",
    price: { amount: "12", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    estimated_time_minutes: 25,
    preview_items: ["Rule set preview", "Welcome flow preview", "Ops structure"],
    output_items: ["Rules", "Welcome flow", "Moderator checklist", "Receipt"],
    receipt_items: ["workflow_slug", "price_snapshot", "template_version", "completion_receipt"],
    tags: ["telegram", "community", "moderation"],
  },
  {
    slug: "airdrop-bounty-builder",
    title: "Airdrop / Bounty Builder",
    category: "Campaigns",
    summary: "Create tasks, reward logic, anti-sybil rules, and proof policy for bounty campaigns.",
    description: "Helps teams structure incentive campaigns without turning them into low-quality spam farms.",
    price: { amount: "15", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    estimated_time_minutes: 30,
    preview_items: ["Task structure", "Reward logic", "Verification outline"],
    output_items: ["Task matrix", "Reward table", "Proof policy", "Receipt"],
    receipt_items: ["workflow_slug", "price_snapshot", "input_hash", "verification_policy"],
    tags: ["bounty", "airdrop", "campaign"],
  },
  {
    slug: "token-risk-report",
    title: "Token Risk Report",
    category: "Risk",
    summary: "Produce a structured risk and trust snapshot for a token, wallet cluster, or liquidity setup.",
    description: "Summarizes concentration, liquidity, trust signals, and operational flags into a usable risk report shell.",
    price: { amount: "14", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    estimated_time_minutes: 20,
    preview_items: ["Risk summary", "Trust notes", "Flag categories"],
    output_items: ["Risk snapshot", "Trust signals", "Operational flags", "Receipt"],
    receipt_items: ["workflow_slug", "price_snapshot", "asset_reference", "status_timeline"],
    tags: ["risk", "token", "intelligence"],
  },
  {
    slug: "token-launch-audit-pack",
    title: "Token Launch Audit Pack",
    category: "Audit",
    summary: "Audit launch readiness across token narrative, liquidity proof, campaign plan, and trust signals.",
    description: "Produces a launch-readiness audit with scoring, gaps, mitigation tasks, and a proof-backed delivery receipt.",
    price: { amount: "79", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    estimated_time_minutes: 55,
    preview_items: ["Launch readiness score", "Gap matrix", "Priority fixes"],
    output_items: ["Audit scorecard", "Launch risk matrix", "Fix backlog", "Proof receipt"],
    receipt_items: ["workflow_slug", "price_snapshot", "input_hash", "provider_cost_estimate", "margin_snapshot", "status_timeline"],
    tags: ["audit", "launch", "risk", "premium"],
  },
  {
    slug: "exchange-listing-submission-pack",
    title: "Exchange Listing Submission Pack",
    category: "Listings",
    summary: "Prepare exchange-facing answers, due-diligence pack, market narrative, and submission checklist.",
    description: "Creates a premium exchange listing submission pack designed for cleaner reviewer handoff and repeat submissions.",
    price: { amount: "149", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    estimated_time_minutes: 90,
    preview_items: ["Exchange answer map", "Reviewer checklist", "Submission sequence"],
    output_items: ["Exchange form answers", "Due-diligence packet", "Reviewer memo", "Proof receipt"],
    receipt_items: ["workflow_slug", "price_snapshot", "input_hash", "listing_readiness", "margin_snapshot", "status_timeline"],
    tags: ["listing", "exchange", "launch", "premium"],
  },
  {
    slug: "kol-telegram-campaign-builder",
    title: "KOL / Telegram Campaign Builder",
    category: "Growth",
    summary: "Build KOL briefs, Telegram campaign mechanics, proof policy, and attribution-ready growth flow.",
    description: "Packages a campaign that can be handed to community operators, Telegram admins, and KOL partners without losing proof discipline.",
    price: { amount: "99", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    estimated_time_minutes: 70,
    preview_items: ["KOL brief preview", "Telegram funnel", "Attribution plan"],
    output_items: ["KOL brief kit", "Telegram campaign plan", "Partner scripts", "Proof receipt"],
    receipt_items: ["workflow_slug", "price_snapshot", "input_hash", "campaign_attribution", "margin_snapshot", "status_timeline"],
    tags: ["kol", "telegram", "growth", "premium"],
  },
  {
    slug: "token-risk-report-pro",
    title: "Token Risk Report Pro",
    category: "Risk",
    summary: "Create a pro-grade token risk report with scoring, evidence requests, wallet/liquidity checks, and buyer-ready summary.",
    description: "Turns a lightweight token snapshot into a premium report with structured risks, evidence gaps, and recommended next checks.",
    price: { amount: "59", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    estimated_time_minutes: 50,
    preview_items: ["Pro risk score", "Evidence gaps", "Buyer-ready summary"],
    output_items: ["Risk scorecard", "Evidence request list", "Liquidity and holder flags", "Proof receipt"],
    receipt_items: ["workflow_slug", "price_snapshot", "asset_reference", "risk_score", "margin_snapshot", "status_timeline"],
    tags: ["risk", "token", "report", "premium"],
  },
  {
    slug: "agent-api-readiness-pack",
    title: "Agent API Readiness Pack",
    category: "Developers",
    summary: "Package a crypto API or workflow for AI-agent buyers with pricing, x402 metadata, docs, and spend controls.",
    description: "Creates the commercial surface an external agent needs: endpoint offer, pricing copy, 402 response plan, curl examples, and receipt schema.",
    price: { amount: "99", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    estimated_time_minutes: 65,
    preview_items: ["Endpoint offer map", "x402 payment shape", "Spend-control checklist"],
    output_items: ["Developer offer page", "API pricing matrix", "x402 response plan", "Proof receipt"],
    receipt_items: ["workflow_slug", "price_snapshot", "input_hash", "x402_payment_terms", "margin_snapshot", "status_timeline"],
    tags: ["api", "x402", "agents", "premium"],
  },
];

export const fallbackWorkflowBundles: WorkflowBundle[] = [
  {
    slug: "launch-pack",
    title: "ANCAP Crypto Launch Pack",
    category: "Launch Suite",
    summary: "Five paid crypto launch workflows sold together as a higher-ticket execution bundle.",
    description: "Creates listing copy, launch campaign plan, Telegram operating kit, bounty structure, and token risk snapshot in one checkout.",
    workflow_slugs: [
      "token-listing-pack",
      "crypto-campaign-builder",
      "telegram-growth-kit",
      "airdrop-bounty-builder",
      "token-risk-report",
    ],
    price: { amount: "49", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    discount_percent: 30,
    estimated_time_minutes: 125,
    output_items: [
      "Listing pack",
      "Campaign plan",
      "Telegram growth kit",
      "Airdrop / bounty structure",
      "Token risk report",
      "Five proof-backed workflow receipts",
    ],
    tags: ["bundle", "launch", "growth", "risk"],
  },
  {
    slug: "growth-pack",
    title: "ANCAP Growth Pack",
    category: "Growth Suite",
    summary: "Repeatable campaign and community workflows for teams that iterate every week.",
    description: "Creates two campaign plans, two Telegram operating passes, and one bounty structure for recurring growth execution.",
    workflow_slugs: [
      "crypto-campaign-builder",
      "telegram-growth-kit",
      "airdrop-bounty-builder",
      "crypto-campaign-builder",
      "telegram-growth-kit",
    ],
    price: { amount: "59", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    discount_percent: 23,
    estimated_time_minutes: 140,
    output_items: [
      "Two campaign plans",
      "Two Telegram growth passes",
      "Bounty task matrix",
      "Five proof-backed workflow receipts",
    ],
    tags: ["bundle", "growth", "community", "campaign"],
  },
  {
    slug: "concierge-pack",
    title: "ANCAP Concierge Pack",
    category: "Concierge",
    summary: "A premium bundle for teams that want generated artifacts plus operator review.",
    description: "Creates all five launch workflows and prices the run as a concierge engagement with room for manual review and delivery polish.",
    workflow_slugs: [
      "token-listing-pack",
      "crypto-campaign-builder",
      "telegram-growth-kit",
      "airdrop-bounty-builder",
      "token-risk-report",
    ],
    price: { amount: "149", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    discount_percent: 0,
    estimated_time_minutes: 180,
    output_items: [
      "Full launch workflow set",
      "Premium review budget",
      "Custom delivery polish",
      "Five proof-backed workflow receipts",
    ],
    tags: ["bundle", "concierge", "premium", "launch"],
  },
  {
    slug: "pro-launch-pack",
    title: "ANCAP Pro Launch Pack",
    category: "Premium Launch",
    summary: "Higher-ticket launch execution pack for teams that need listing, audit, KOL, bounty, and pro risk artifacts together.",
    description: "Bundles the premium launch audit, exchange submission pack, KOL/Telegram campaign, bounty builder, and pro token risk report into one proof-backed checkout.",
    workflow_slugs: [
      "token-launch-audit-pack",
      "exchange-listing-submission-pack",
      "kol-telegram-campaign-builder",
      "airdrop-bounty-builder",
      "token-risk-report-pro",
    ],
    price: { amount: "349", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    discount_percent: 13,
    estimated_time_minutes: 295,
    output_items: [
      "Launch readiness audit",
      "Exchange listing submission pack",
      "KOL / Telegram campaign kit",
      "Airdrop / bounty structure",
      "Token Risk Report Pro",
      "Five proof-backed workflow receipts",
    ],
    tags: ["bundle", "launch", "premium", "risk", "growth"],
  },
  {
    slug: "agent-commerce-pack",
    title: "ANCAP Agent Commerce Pack",
    category: "Agent Commerce",
    summary: "A B2B pack for API owners and AI-agent builders who want pay-per-call monetization fast.",
    description: "Combines API readiness, campaign positioning, listing copy, and proof-center setup so external agents can discover, pay, and verify ANCAP-style execution.",
    workflow_slugs: [
      "agent-api-readiness-pack",
      "crypto-campaign-builder",
      "token-listing-pack",
      "token-risk-report-pro",
    ],
    price: { amount: "249", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    discount_percent: 5,
    estimated_time_minutes: 165,
    output_items: [
      "Agent/API paid endpoint offer",
      "x402-compatible payment terms",
      "Developer pricing matrix",
      "Proof-center receipt schema",
    ],
    tags: ["bundle", "api", "x402", "agents"],
  },
];

export const fallbackWorkflowCreditPackages: WorkflowCreditPackage[] = [
  {
    slug: "starter-credits",
    title: "Starter Credits",
    description: "Enough balance to run one launch workflow or test the paid execution loop.",
    price: { amount: "25", currency: "ACP" },
    credit_amount: { amount: "25", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    bonus_percent: 0,
    recommended_for: ["first paid workflow", "proof bundle test"],
  },
  {
    slug: "launch-credits",
    title: "Launch Credits",
    description: "Best fit for the Launch Pack plus one or two follow-up reruns.",
    price: { amount: "95", currency: "ACP" },
    credit_amount: { amount: "100", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    bonus_percent: 5,
    recommended_for: ["launch pack", "campaign iteration"],
  },
  {
    slug: "growth-credits",
    title: "Growth Credits",
    description: "A larger balance for repeated launch, growth, and risk workflows.",
    price: { amount: "225", currency: "ACP" },
    credit_amount: { amount: "250", currency: "ACP" },
    accepted_currencies: ["ACP", "wACP"],
    bonus_percent: 11,
    recommended_for: ["teams", "multiple assets", "repeat campaigns"],
  },
];

export function getFallbackWorkflowTemplate(slug: string): WorkflowTemplate | null {
  return fallbackWorkflowTemplates.find((item) => item.slug === slug) || null;
}

export function getFallbackWorkflowBundle(slug: string): WorkflowBundle | null {
  return fallbackWorkflowBundles.find((item) => item.slug === slug) || null;
}

export function getFallbackWorkflowCreditPackage(slug: string): WorkflowCreditPackage | null {
  return fallbackWorkflowCreditPackages.find((item) => item.slug === slug) || null;
}
