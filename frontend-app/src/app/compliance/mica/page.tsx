import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "MiCA Readiness | ANCAP",
  description: "MiCA-safe positioning for ACP utility credits and workflow commerce.",
};

export default function MicaCompliancePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold">MiCA-safe messaging</h1>
        <p className="mt-4 text-sm leading-7 text-white/68">
          ANCAP markets paid workflow execution, merchant tools, and API access settled in ACP credits. Marketing avoids profit promises, speculative price targets, or investment solicitations.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/68">
          Teams requiring formal MiCA readiness artifacts can run the{" "}
          <Link href="/ai/bundles/compliance-pack" className="text-emerald-300">MiCA Readiness Pack</Link> workflow bundle.
        </p>
        <Link href="/compliance" className="mt-8 inline-block text-sm text-emerald-300">
          Back to compliance hub
        </Link>
      </main>
    </div>
  );
}
