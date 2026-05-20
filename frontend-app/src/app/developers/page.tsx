import Link from "next/link";
import { Navigation } from "@/components/Navigation";

const products = [
  ["token-risk", "/paid-api/token-risk", "2.00 ACP", "Risk snapshot for token or project references"],
  ["listing-readiness", "/paid-api/listing-readiness", "1.50 ACP", "Listing readiness score for exchange/directory submissions"],
  ["wallet-risk", "/paid-api/wallet-risk", "2.00 ACP", "Wallet risk snapshot for operational checks"],
  ["bridge-proof", "/paid-api/bridge-proof", "1.00 ACP", "Compact bridge proof readiness result"],
  ["campaign-score", "/paid-api/campaign-score", "1.00 ACP", "Campaign clarity, proof quality, and spam-risk score"],
];

export const metadata = {
  title: "ANCAP Developers | Paid API for AI agents",
  description: "Pay-per-call crypto workflow APIs with API keys, spend caps, receipts, and x402-compatible payment terms.",
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">Agent/API monetization</div>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Paid API endpoints for AI agents
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            ANCAP exposes pay-per-call checks for token risk, listing readiness, wallet risk, bridge proof, and campaign scoring. Every successful call records usage, spend, request hash, and receipt metadata.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/projects" className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Create agent/API key
            </Link>
            <Link href="/billing" className="rounded-full border border-emerald-400/25 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/50 hover:text-emerald-100">
              View usage and credits
            </Link>
            <a href="/api/docs" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              Open API docs
            </a>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map(([slug, endpoint, price, description]) => (
            <article key={slug} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">{endpoint}</div>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">{slug}</h2>
              <div className="mt-2 text-lg font-black text-emerald-300">{price}</div>
              <p className="mt-3 text-sm leading-6 text-white/65">{description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Request example</h2>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/80">{`curl -X POST https://ancap.cloud/api/v1/paid-api/token-risk \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: $ANCAP_API_KEY" \\
  -d '{"subject":"TOKEN","chain":"Base","signals":{"owner":"known","liquidity":"locked"}}'`}</pre>
            <h3 className="mt-6 text-lg font-semibold">402-compatible payment terms</h3>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-emerald-400/20 bg-black/25 p-4 text-sm text-white/80">{JSON.stringify({
              status: 402,
              detail: {
                message: "Insufficient credits for paid API usage",
                x402: {
                  version: "x402-compatible-preview",
                  accepts: [{ scheme: "exact", network: "base", currency: "ACP", amount: "2.00" }],
                  resource: "https://ancap.cloud/api/v1/paid-api/token-risk",
                  pay_to: "ancap-workflow-treasury",
                },
              },
            }, null, 2)}</pre>
          </article>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-sm font-semibold text-white/90">Spend controls</div>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li>Monthly cap per agent through `/paid-api/agents/:id/spend-cap`.</li>
              <li>Prepaid credits are debited per captured API call.</li>
              <li>Usage exports are available from `/paid-api/me/usage` and Billing.</li>
              <li>Receipts include product slug, endpoint, amount, request hash, and ledger event.</li>
            </ul>
            <Link href="/ai/run/agent-api-readiness-pack" className="mt-6 inline-flex rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Buy Agent API Readiness Pack
            </Link>
          </aside>
        </section>
      </main>
    </div>
  );
}
