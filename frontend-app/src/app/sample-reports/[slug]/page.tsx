import Link from "next/link";
import { notFound } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { getFallbackWorkflowTemplate } from "@/lib/workflowStore";

const sampleBySlug: Record<string, { score: string; sections: string[]; summary: string }> = {
  "token-risk-report-pro": {
    score: "71 / 100",
    summary: "Medium risk until liquidity, holder concentration, and treasury controls are proven.",
    sections: ["Risk scorecard", "Evidence gaps", "Liquidity and holder flags", "Buyer-ready summary"],
  },
  "exchange-listing-submission-pack": {
    score: "Listing-ready after evidence pack",
    summary: "Reviewer-facing exchange answers with safe token utility language and due-diligence checklist.",
    sections: ["Exchange form answers", "Reviewer memo", "Submission sequence", "Claims to avoid"],
  },
  "token-launch-audit-pack": {
    score: "78 / 100",
    summary: "Conditional go: launch narrative is usable, but liquidity proof and evidence links need tightening.",
    sections: ["Launch readiness score", "Gap matrix", "Priority fixes", "Proof requests"],
  },
  "kol-telegram-campaign-builder": {
    score: "Campaign ready",
    summary: "KOL and Telegram funnel built around proof posts, partner scripts, and paid-run attribution.",
    sections: ["KOL brief", "Telegram funnel", "Partner scripts", "Attribution plan"],
  },
  "agent-api-readiness-pack": {
    score: "Agent commerce ready",
    summary: "Endpoint offer, pay-per-call pricing, x402-compatible terms, spend caps, and receipt schema.",
    sections: ["Endpoint offer", "x402 response plan", "Spend controls", "Developer docs outline"],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workflow = getFallbackWorkflowTemplate(slug);
  return {
    title: workflow ? `${workflow.title} sample report | ANCAP` : "Sample report | ANCAP",
    description: workflow?.summary || "Proof-backed AI workflow sample report.",
  };
}

export default async function SampleReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workflow = getFallbackWorkflowTemplate(slug);
  const sample = sampleBySlug[slug];
  if (!workflow || !sample) notFound();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/ai/workflows" className="text-sm text-emerald-300 hover:text-emerald-200">
            Back to workflow store
          </Link>
        </div>

        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">Sample output</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">{workflow.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">{sample.summary}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Sample score</div>
              <div className="mt-2 text-xl font-semibold text-emerald-300">{sample.score}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Price</div>
              <div className="mt-2 text-xl font-semibold text-white/92">{workflow.price.amount} {workflow.price.currency}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Proof</div>
              <div className="mt-2 text-xl font-semibold text-white/92">Receipt-ready</div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.72fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">What the full report includes</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {sample.sections.map((section) => (
                <div key={section} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="font-semibold text-white/90">{section}</div>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    Delivered as a structured artifact with request inputs, generated result, and receipt metadata.
                  </p>
                </div>
              ))}
            </div>
            <pre className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">{JSON.stringify({
              workflow_slug: workflow.slug,
              sample_score: sample.score,
              paid_output_sections: sample.sections,
              receipt_items: workflow.receipt_items,
              upgrade_cta: `/ai/run/${workflow.slug}`,
            }, null, 2)}</pre>
          </article>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-sm font-semibold text-white/90">Ready to generate your own?</div>
            <p className="mt-3 text-sm leading-6 text-white/65">
              The live workflow creates a persistent run, pricing snapshot, payment intent, and proof bundle for the exact inputs you submit.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link href={`/ai/run/${workflow.slug}`} className="rounded-full bg-emerald-400 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:opacity-90">
                Buy this workflow
              </Link>
              <Link href="/token-snapshot" className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
                Start with free snapshot
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
