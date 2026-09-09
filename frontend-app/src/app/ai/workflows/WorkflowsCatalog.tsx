"use client";

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import type { WorkflowBundle, WorkflowTemplate } from "@/lib/workflowStore";

const PREMIUM_SLUGS = [
  "token-launch-audit-pack",
  "exchange-listing-submission-pack",
  "kol-telegram-campaign-builder",
  "token-risk-report-pro",
  "agent-api-readiness-pack",
  "ai-iso-governance-readiness-pack",
];

export function WorkflowsCatalog({
  workflows,
  bundles,
}: {
  workflows: WorkflowTemplate[];
  bundles: WorkflowBundle[];
}) {
  const { t } = useLanguage();
  const premiumWorkflows = workflows.filter((workflow) => PREMIUM_SLUGS.includes(workflow.slug));
  const steps = [
    [t("workflowsPage.step1Title"), t("workflowsPage.step1Text")],
    [t("workflowsPage.step2Title"), t("workflowsPage.step2Text")],
    [t("workflowsPage.step3Title"), t("workflowsPage.step3Text")],
    [t("workflowsPage.step4Title"), t("workflowsPage.step4Text")],
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="mb-3 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            {t("workflowsPage.kicker")}
          </div>
          <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {t("workflowsPage.title")}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
            {t("workflowsPage.lead")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              {t("workflowsPage.openDashboard")}
            </Link>
            <Link href="/pricing" className="rounded-full border border-emerald-400/25 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/50 hover:text-emerald-100">
              {t("workflowsPage.pricing")}
            </Link>
            <Link href="/sample-reports/token-risk-report-pro" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              {t("workflowsPage.sampleReport")}
            </Link>
            <Link href="/dashboard/seller" className="rounded-full border border-sky-300/25 bg-sky-400/[0.08] px-5 py-2.5 text-sm font-semibold text-sky-100 transition hover:border-sky-200/45 hover:text-white">
              {t("workflowsPage.publishWorkflow")}
            </Link>
            <a href="/api/docs" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              {t("workflowsPage.apiDocs")}
            </a>
          </div>
        </section>

        <section className="mb-10 grid gap-4 md:grid-cols-4">
          {steps.map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/90">{title}</div>
              <p className="mt-2 text-sm leading-6 text-white/62">{text}</p>
            </div>
          ))}
        </section>

        {premiumWorkflows.length > 0 && (
          <section className="mb-10 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.05] p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">{t("workflowsPage.premiumKicker")}</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{t("workflowsPage.premiumTitle")}</h2>
              </div>
              <Link href="/token-snapshot" className="rounded-full border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100">
                {t("workflowsPage.startFreeSnapshot")}
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {premiumWorkflows.map((workflow) => (
                <article key={workflow.slug} className="rounded-2xl border border-white/10 bg-black/15 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-400/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                        {workflow.category}
                      </span>
                      <span className="rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                        {t("workflowsPage.slaMinutes").replace("{n}", String(workflow.estimated_time_minutes || 15))}
                      </span>
                      <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-100">
                        {t("workflowsPage.verifiedByAncap")}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-300">{workflow.price.amount} {workflow.price.currency}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em]">{workflow.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/68">{workflow.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href={`/ai/run/${workflow.slug}`} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
                      {t("workflowsPage.buyWorkflow")}
                    </Link>
                    <Link href={`/sample-reports/${workflow.slug}`} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:text-white">
                      {t("workflowsPage.sampleOutput")}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">{t("workflowsPage.coreLoopKicker")}</div>
            <div className="mt-3 text-lg font-semibold">{t("workflowsPage.coreLoopTitle")}</div>
            <p className="mt-3 text-sm leading-6 text-white/65">{t("workflowsPage.coreLoopText")}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">{t("workflowsPage.buyersKicker")}</div>
            <div className="mt-3 text-lg font-semibold">{t("workflowsPage.buyersTitle")}</div>
            <p className="mt-3 text-sm leading-6 text-white/65">{t("workflowsPage.buyersText")}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">{t("workflowsPage.monetizationKicker")}</div>
            <div className="mt-3 text-lg font-semibold">{t("workflowsPage.monetizationTitle")}</div>
            <p className="mt-3 text-sm leading-6 text-white/65">{t("workflowsPage.monetizationText")}</p>
          </div>
        </section>

        {bundles.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">{t("workflowsPage.bundlesKicker")}</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{t("workflowsPage.bundlesTitle")}</h2>
              </div>
              <div className="text-sm text-white/45">{t("workflowsPage.bundlesAside")}</div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {bundles.map((bundle) => (
                <article key={bundle.slug} className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-400/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                        {bundle.category}
                      </span>
                      <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-100">
                        {t("workflowsPage.verifiedByAncap")}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-300">
                      {bundle.price.amount} {bundle.price.currency} ·{" "}
                      {bundle.discount_percent > 0
                        ? t("workflowsPage.bundleDiscount").replace("{n}", String(bundle.discount_percent))
                        : t("workflowsPage.premiumPack")}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">{bundle.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/72">{bundle.description}</p>
                  <div className="mt-4 text-sm text-white/50">
                    {t("workflowsPage.estimatedBundle")
                      .replace("{minutes}", String(bundle.estimated_time_minutes))
                      .replace("{count}", String(bundle.workflow_slugs.length))}
                  </div>
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
                      {t("workflowsPage.openBundle")}
                    </Link>
                    <Link href="/wallet/credits" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
                      {t("workflowsPage.checkCredits")}
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
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">{t("workflowsPage.catalogKicker")}</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{t("workflowsPage.catalogTitle")}</h2>
            </div>
            <div className="text-sm text-white/45">{t("workflowsPage.catalogAside")}</div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {workflows.map((workflow) => (
              <article key={workflow.slug} className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/12 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
                    {workflow.category}
                  </span>
                  <span className="text-sm font-semibold text-emerald-300">
                    {t("workflowsPage.fromPrice")
                      .replace("{amount}", workflow.price.amount)
                      .replace("{currency}", workflow.price.currency)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold tracking-[-0.02em]">{workflow.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-white/68">{workflow.description}</p>
                <div className="mt-4 text-sm text-white/50">
                  {t("workflowsPage.estimatedTime").replace("{minutes}", String(workflow.estimated_time_minutes))}
                </div>
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
                    {t("workflowsPage.openWorkflow")}
                  </Link>
                  <Link href={`/sample-reports/${workflow.slug}`} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:text-white">
                    {t("workflowsPage.sampleOutput")}
                  </Link>
                  <Link href="/ai/runs" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:text-white">
                    {t("workflowsPage.viewRuns")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-sky-300/15 bg-sky-400/[0.055] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-sky-100/75">{t("workflowsPage.agentsKicker")}</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{t("workflowsPage.agentsTitle")}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">{t("workflowsPage.agentsLead")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/seller" className="rounded-full bg-sky-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              {t("workflowsPage.sellerDashboard")}
            </Link>
            <a href="/agent-products.json" className="rounded-full border border-sky-300/25 px-5 py-2.5 text-sm font-semibold text-sky-100 transition hover:border-sky-200/45 hover:text-white">
              {t("workflowsPage.agentProductJson")}
            </a>
            <Link href="/proof-center" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              {t("workflowsPage.proofCenter")}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
