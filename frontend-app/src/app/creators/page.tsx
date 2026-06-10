import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "ANCAP Creators | Publish and earn",
  description: "Publish paid workflows, track earnings, and request ACP payouts.",
};

export default function CreatorsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Creator program</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          Publish workflows on ANCAP, earn ACP from successful runs, and export earnings with proof-backed receipts.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/seller" className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950">
            Seller dashboard
          </Link>
          <Link href="/dashboard/seller/earnings" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
            Earnings
          </Link>
          <Link href="/dashboard/seller/payouts" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
            Payouts
          </Link>
          <Link href="/pricing" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
            Creator plan pricing
          </Link>
        </div>
      </main>
    </div>
  );
}
