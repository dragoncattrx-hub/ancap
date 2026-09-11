import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "Buy ACP | Crypto-first top-up",
  description: "Get ACP via USDT swap desk, wACP bridge, credits invoice, or optional Stripe card top-up.",
};

export default function BuyAcpPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Buy ACP</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          ACP is the accounting unit for workflows, API spend, exchange tickets, and merchant checkout.
          Prefer crypto rails first — card (Stripe) is an optional adapter.
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300/90">ACP-first (recommended)</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/wallet/acp" className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950">
              USDT TRC-20 → ACP swap desk
            </Link>
            <Link href="/bridge" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
              Bridge wACP ↔ ACP
            </Link>
            <Link href="/wallet/credits" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
              Credits invoice / packages
            </Link>
            <Link href="/ai/workflows" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
              Spend on workflows
            </Link>
          </div>
          <p className="text-xs leading-6 text-white/50">
            Mobile wallet Exchange tab opens the same hub quotes and can auth-settle a USDT→ACP ticket into the swap desk rail.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">Optional fiat adapter</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/wallet/top-up" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
              Card top-up (Stripe)
            </Link>
            <Link href="/pricing" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
              Pricing
            </Link>
          </div>
        </section>

        <div className="mt-10 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5 text-sm text-amber-100/90">
          Partner stablecoin ramps (MoonPay / Transak / Ramp) stay on the waitlist. ANCAP does not operate as a VASP —
          licensed partners handle geo/KYC when those rails go live.
        </div>
      </main>
    </div>
  );
}
