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
    price: { amount: "10", currency: "USDC" },
    accepted_currencies: ["USDC", "wACP", "ACP"],
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
    price: { amount: "19", currency: "USDC" },
    accepted_currencies: ["USDC", "wACP", "ACP"],
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
    price: { amount: "12", currency: "USDC" },
    accepted_currencies: ["USDC", "wACP", "ACP"],
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
    price: { amount: "15", currency: "USDC" },
    accepted_currencies: ["USDC", "wACP", "ACP"],
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
    price: { amount: "14", currency: "USDC" },
    accepted_currencies: ["USDC", "wACP", "ACP"],
    estimated_time_minutes: 20,
    preview_items: ["Risk summary", "Trust notes", "Flag categories"],
    output_items: ["Risk snapshot", "Trust signals", "Operational flags", "Receipt"],
    receipt_items: ["workflow_slug", "price_snapshot", "asset_reference", "status_timeline"],
    tags: ["risk", "token", "intelligence"],
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
    price: { amount: "49", currency: "USDC" },
    accepted_currencies: ["USDC", "wACP", "ACP"],
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
    price: { amount: "59", currency: "USDC" },
    accepted_currencies: ["USDC", "wACP", "ACP"],
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
    price: { amount: "149", currency: "USDC" },
    accepted_currencies: ["USDC", "wACP", "ACP"],
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
];

export const fallbackWorkflowCreditPackages: WorkflowCreditPackage[] = [
  {
    slug: "starter-credits",
    title: "Starter Credits",
    description: "Enough balance to run one launch workflow or test the paid execution loop.",
    price: { amount: "25", currency: "USDC" },
    credit_amount: { amount: "25", currency: "USDC" },
    accepted_currencies: ["USDC", "wACP", "ACP"],
    bonus_percent: 0,
    recommended_for: ["first paid workflow", "proof bundle test"],
  },
  {
    slug: "launch-credits",
    title: "Launch Credits",
    description: "Best fit for the Launch Pack plus one or two follow-up reruns.",
    price: { amount: "95", currency: "USDC" },
    credit_amount: { amount: "100", currency: "USDC" },
    accepted_currencies: ["USDC", "wACP", "ACP"],
    bonus_percent: 5,
    recommended_for: ["launch pack", "campaign iteration"],
  },
  {
    slug: "growth-credits",
    title: "Growth Credits",
    description: "A larger balance for repeated launch, growth, and risk workflows.",
    price: { amount: "225", currency: "USDC" },
    credit_amount: { amount: "250", currency: "USDC" },
    accepted_currencies: ["USDC", "wACP", "ACP"],
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
