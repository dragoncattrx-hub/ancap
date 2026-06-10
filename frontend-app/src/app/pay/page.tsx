import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "ANCAP Pay | Payment links and invoices",
  description: "Create payment links, crypto invoices, and QR checkout with proof receipts.",
};

export default function PayLandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">ANCAP Pay</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Get paid in ACP with proof</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
          Payment links, invoices, and QR checkout share one ledger-backed PaymentIntent flow with merchant webhooks and CSV export.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/pay/create" className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950">
            Create payment link
          </Link>
          <Link href="/invoices" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
            Create invoice
          </Link>
          <Link href="/merchant" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
            Merchant dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
