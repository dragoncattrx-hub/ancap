import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "Buy ACP | Top up credits",
  description: "Top up ACP credits with card (Stripe) or bridge from wACP.",
};

export default function BuyAcpPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Buy ACP credits</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          ACP is the utility accounting asset for workflows, API spend, and merchant checkout. Top up with card via Stripe or use bridge partners for stablecoin on-ramps (compliance review required for live ramp partners).
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/wallet/top-up" className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950">
            Card top-up (Stripe)
          </Link>
          <Link href="/wallet/credits" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
            Credits wallet
          </Link>
          <Link href="/bridge" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
            Bridge wACP
          </Link>
        </div>
        <div className="mt-10 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5 text-sm text-amber-100/90">
          Partner stablecoin top-up (MoonPay / Transak / Ramp) is on the waitlist. ANCAP does not operate as a VASP — ramps are provided by licensed partners after geo/KYC review.
        </div>
      </main>
    </div>
  );
}
