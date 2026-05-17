import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { fallbackWorkflowBundles, fallbackWorkflowTemplates, type WorkflowBundle, type WorkflowTemplate } from "@/lib/workflowStore";

const API_BASE = process.env.NODE_ENV === "development" ? "http://127.0.0.1:8001" : "https://ancap.cloud/api/v1";

async function getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  try {
    const res = await fetch(`${API_BASE}/workflow-store/templates`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return fallbackWorkflowTemplates;
    }

    const data = (await res.json()) as { items: WorkflowTemplate[] };
    return data.items?.length ? data.items : fallbackWorkflowTemplates;
  } catch {
    return fallbackWorkflowTemplates;
  }
}

async function getWorkflowBundles(): Promise<WorkflowBundle[]> {
  try {
    const res = await fetch(`${API_BASE}/workflow-store/bundles`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return fallbackWorkflowBundles;
    }

    const data = (await res.json()) as { items: WorkflowBundle[] };
    return data.items?.length ? data.items : fallbackWorkflowBundles;
  } catch {
    return fallbackWorkflowBundles;
  }
}

export default async function WorkflowsPage() {
  const workflows = await getWorkflowTemplates();
  const bundles = await getWorkflowBundles();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="mb-3 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            AI Workflow Store
          </div>
          <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Paid AI workflows for crypto teams, agents, and launch operations
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
            ANCAP is shifting from a vague AI/Web3 showcase to monetizable execution: buy a workflow, get a structured result,
            receive a receipt, and rerun or scale it. Pay in ACP, wACP, or USDC as billing gets wired in.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Open dashboard
            </Link>
            <a href="/api/docs" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              API docs
            </a>
          </div>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Core loop</div>
            <div className="mt-3 text-lg font-semibold">AI task → crypto payment → verified result → receipt</div>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Every paid run should end with a useful artifact, cost visibility, and a proof trail strong enough to justify repeat spend.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Best early buyers</div>
            <div className="mt-3 text-lg font-semibold">Crypto teams, launch operators, growth managers</div>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Start with launch, listing, growth, bounty, and risk workflows that map directly to painful recurring tasks.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Monetization</div>
            <div className="mt-3 text-lg font-semibold">Pay-per-run first, subscriptions and APIs second</div>
            <p className="mt-3 text-sm leading-6 text-white/65">
              The first version should sell outcomes immediately. Marketplace and deeper agent commerce come after basic revenue loops work.
            </p>
          </div>
        </section>

        {bundles.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Bundles</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Higher-ticket workflow packs</h2>
              </div>
              <div className="text-sm text-white/45">One checkout, multiple proof-backed runs</div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {bundles.map((bundle) => (
                <article key={bundle.slug} className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full border border-emerald-400/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                      {bundle.category}
                    </span>
                    <span className="text-sm font-semibold text-emerald-300">
                      {bundle.price.amount} {bundle.price.currency} · {bundle.discount_percent > 0 ? `${bundle.discount_percent}% bundle discount` : "premium pack"}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">{bundle.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/72">{bundle.description}</p>
                  <div className="mt-4 text-sm text-white/50">Estimated time: {bundle.estimated_time_minutes} min · {bundle.workflow_slugs.length} workflows</div>
                  <ul className="mt-4 grid gap-2 text-sm text-white/75 sm:grid-cols-2">
                    {bundle.output_items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={`/ai/bundles/${bundle.slug}`} className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90">
                      Open bundle
                    </Link>
                    <Link href="/wallet/credits" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
                      Check credits
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Initial catalog</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">First sellable workflows</h2>
            </div>
            <div className="text-sm text-white/45">Preview shell — billing and run execution next</div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {workflows.map((workflow) => (
              <article key={workflow.slug} className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/12 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
                    {workflow.category}
                  </span>
                  <span className="text-sm font-semibold text-emerald-300">from {workflow.price.amount} {workflow.price.currency}</span>
                </div>
                <h3 className="text-xl font-semibold tracking-[-0.02em]">{workflow.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-white/68">{workflow.description}</p>
                <div className="mt-4 text-sm text-white/50">Estimated time: {workflow.estimated_time_minutes} min</div>
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  {workflow.output_items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/ai/run/${workflow.slug}`} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
                    Open workflow
                  </Link>
                  <Link href="/ai/runs" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:text-white">
                    View workflow runs
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
