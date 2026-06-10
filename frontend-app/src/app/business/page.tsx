import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "ANCAP Business | Treasury & merchant",
  description: "Business treasury, merchant subscriptions, batch payouts, and compliance-ready invoicing.",
};

export default function BusinessPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Business & Treasury</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          Merchant invoicing is live in ANCAP Pay MVP. Treasury roles, approval limits, and batch payouts ship in the 61–90 day phase alongside embedded wallet business mode.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            ["Merchant dashboard", "/merchant", "Payment links, CSV export, webhooks"],
            ["Organizations", "/organizations", "Team roles and billing wallet"],
            ["Compliance", "/compliance", "MiCA-safe utility asset messaging"],
            ["Enterprise", "/pricing", "Custom SLA and treasury"],
          ].map(([title, href, text]) => (
            <Link key={title} href={href} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20">
              <div className="font-semibold">{title}</div>
              <p className="mt-2 text-sm text-white/60">{text}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
