import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "ANCAP Compliance",
  description: "Risk disclosures, MiCA-safe utility asset messaging, and on-ramp compliance matrix.",
};

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Compliance & risk disclosures</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          ACP is positioned as a utility / accounting asset for workflow fees, API spend, and platform credits — not an investment product. ANCAP does not promise price appreciation or guaranteed returns.
        </p>
        <ul className="mt-8 space-y-4 text-sm leading-7 text-white/75">
          <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <strong className="text-white">MiCA messaging:</strong> Utility credits for paid execution; not e-money or a security token offering on this platform surface.
          </li>
          <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <strong className="text-white">On-ramps:</strong> Card and stablecoin ramps are provided by licensed partners subject to geo/KYC tiers (see COMPLIANCE_ONRAMP_MATRIX).
          </li>
          <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <strong className="text-white">Bridge risk:</strong> Cross-chain transfers carry smart-contract and custody risk. Verify contract addresses on official docs only.
          </li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/compliance/mica" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
            MiCA overview
          </Link>
          <Link href="/whitepaper/acp" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
            ACP whitepaper
          </Link>
          <Link href="/legal/terms" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
            Terms
          </Link>
        </div>
      </main>
    </div>
  );
}
