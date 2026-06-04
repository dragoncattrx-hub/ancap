import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "ANCAP Project Whitepaper",
  description:
    "Whitepaper for ANCAP: AI Native Capital Allocation Platform, smart payments, ACP settlement, AI payment decoding, proof receipts, and crypto-native execution flows.",
};

const sections = [
  {
    title: "1. Purpose",
    body:
      "ANCAP stands for AI Native Capital Allocation Platform. It is being built as a practical crypto payment and execution layer where users, merchants, operators, and AI agents can understand payment requests, prepare safe payment intents, allocate capital with clearer intent, settle through ACP-aware rails, and receive proof-backed execution artifacts instead of vague chatbot output.",
  },
  {
    title: "2. Problem",
    body:
      "Crypto teams lose time on repeated operational work: exchange listing materials, campaign drafts, bounty coordination, risk summaries, wallet checks, API docs, compliance evidence, and partner reporting. AI agents also need machine-readable services they can pay for and verify without sales calls or manual invoices.",
  },
  {
    title: "3. Solution",
    body:
      "ANCAP packages repeatable AI work as paid workflow SKUs and extends that logic into smart payments. A buyer can choose a workflow, receive a quoted ACP price, pay through the platform wallet or checkout intent, track run status, and receive a result with receipt metadata and proof links. The roadmap also includes planned AI Payment Scanner flows where a photo, QR code, invoice, receipt, or payment screen can be decoded into a safe payment intent before user confirmation, but that scanner layer is not shipped today.",
  },
  {
    title: "4. Core Architecture",
    body:
      "The platform combines FastAPI services, PostgreSQL, Redis, Next.js, ACP wallet/billing, paid API metering, LLM execution, search, receipts, and public proof surfaces. The catalog is designed for both humans and AI agents through the web UI, OpenAPI docs, llms.txt, and agent-products.json.",
  },
  {
    title: "5. Trust Model",
    body:
      "ANCAP sells execution artifacts, not investment advice or guaranteed outcomes. Every paid workflow should expose the template used, input hash, price snapshot, status timeline, LLM usage metadata where applicable, and proof receipt. Fallback or degraded execution must be marked clearly and should not be presented as a full premium result.",
  },
  {
    title: "6. Creator Economy",
    body:
      "Human creators and AI-agent creators can turn specialized workflows into paid listings. A creator defines the title, category, ACP price, input schema, output items, proof policy, and publish status. ANCAP can apply review, validation, ranking, referral, and take-rate logic before listings receive distribution.",
  },
  {
    title: "7. Monetization",
    body:
      "Primary revenue comes from pay-per-run workflows, bundles, paid API calls, credit packages, creator marketplace take rates, referral-attributed paid runs, smart payment service fees, future voucher or claim-code issuance/redeem fees, and enterprise/API agreements. ACP remains the primary accounting currency and fee utility layer for the platform.",
  },
  {
    title: "8. Governance and Compliance Direction",
    body:
      "The project roadmap includes AI governance controls, ISO-style operational evidence, provider reliability diagnostics, audit logs, data protection pages, cookie preferences, and legal terms. These controls make the platform easier to inspect by buyers, partners, agents, and operators.",
  },
];

const roadmap = [
  "Production LLM execution with provider health, retry/backoff, usage events, and clear degraded-mode receipts.",
  "ACP checkout with invoice state, payment reference, polling, proof receipt, revenue metrics, and creator earnings.",
  "Public trust layer: proof center, sample reports, project whitepaper, ACP crypto-asset paper, terms, privacy, and cookies.",
  "Growth funnels for buyers, creators, and developers: sample reports, free token snapshot, paid upsell, API keys, spend caps.",
  "AI Payment Scanner (planned, not shipped yet): photo upload, QR decode, OCR for receipts and invoices, payment preview, smart swap, and ACP fee rails.",
  "ANCAP Claim Codes (planned, not shipped yet): lock crypto, generate redeemable codes, redeem in wallet or web, and use proof-backed voucher flows for growth and distribution.",
  "B2B layer: organizations, webhooks, audit log, role-based access, exportable evidence, and partner dashboards.",
];

export default function ProjectWhitepaperPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">Project whitepaper</div>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            ANCAP: AI Native Capital Allocation Platform
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            ANCAP combines smart payments, ACP-settled execution, AI-assisted payment decoding, and verifiable
            crypto-native workflow flows. The goal is a practical layer where users and agents can understand what
            to pay, where capital should move, and how to verify the result after execution.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/ai/workflows" className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Open workflow store
            </Link>
            <Link href="/whitepaper/acp" className="rounded-full border border-emerald-400/25 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/50 hover:text-emerald-100">
              Read ACP paper
            </Link>
            <Link href="/legal/terms" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              User agreement
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Buyers", "Buy launch, listing, campaign, bounty, risk, and governance deliverables for ACP."],
            ["Creators", "Publish paid workflow offers and earn from completed runs with proof receipts."],
            ["Agents", "Use AI-readable catalogs, paid API, spend caps, and machine-readable receipts."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/68">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-5">
          {sections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/70 sm:text-base">{section.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-sky-300/15 bg-sky-400/[0.055] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-sky-100/75">Implementation roadmap</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">What ANCAP is building next</h2>
          <div className="mt-5 grid gap-3">
            {roadmap.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/74">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-6">
          <h2 className="text-xl font-semibold text-amber-100">Important notice</h2>
          <p className="mt-3 text-sm leading-7 text-white/72">
            This whitepaper is product documentation. It is not an investment prospectus, legal opinion, tax advice,
            securities offering, or promise of profit. ACP utility, legal treatment, and availability can vary by
            jurisdiction and must be reviewed before regulated distribution.
          </p>
        </section>
      </main>
    </div>
  );
}
