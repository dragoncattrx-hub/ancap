import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "ACP Crypto-Asset Whitepaper",
  description:
    "ACP crypto-asset information paper: platform utility, accounting role, wallet use, paid workflow settlement, risks, and compliance notes.",
};

const utilities = [
  ["Workflow settlement", "ACP is the primary unit used to quote, pay for, and receipt workflow runs."],
  ["Paid API metering", "API products can debit ACP credits per call and return machine-readable receipt metadata."],
  ["Creator earnings", "Creators can price listings in ACP and receive earnings from completed runs after platform rules and reviews."],
  ["Proof receipts", "Receipts may include ACP amount, workflow slug, run status, input hash, output manifest, and proof link."],
  ["Platform accounting", "For platform pricing, 1 ACP is treated as 1 internal accounting unit. This is not a fiat peg or redemption promise."],
];

const risks = [
  "ACP may have limited liquidity and utility outside the ANCAP ecosystem.",
  "Crypto assets can be volatile and may lose value.",
  "Network, bridge, wallet, smart-contract, custody, or key-management failures can cause loss or delay.",
  "Regulatory treatment can change and may restrict access in some jurisdictions.",
  "AI workflow outputs can be incomplete or wrong and must be reviewed before business, legal, or financial use.",
];

export default function AcpWhitepaperPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-violet-300/20 bg-violet-400/[0.07] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-violet-100/75">Crypto-asset whitepaper</div>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            ACP: utility asset for ANCAP workflow commerce
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            ACP is designed as the primary platform asset for paid AI-workflow execution, credits, receipts,
            creator payouts, and agent/API commerce inside ANCAP. This document explains intended utility,
            accounting treatment, user risks, and compliance boundaries.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/wallet/acp" className="rounded-full bg-violet-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Open ACP wallet
            </Link>
            <Link href="/pricing" className="rounded-full border border-violet-300/25 px-5 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-200/50 hover:text-white">
              View ACP pricing
            </Link>
            <Link href="/whitepaper" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              Project whitepaper
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Asset role</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              ACP is a platform utility and accounting asset for ANCAP services. It is used to express workflow
              prices, run credits, creator revenue, paid API spend, and proof receipt amounts. ACP is not described
              by ANCAP as equity, debt, a deposit, a stablecoin, a claim on company revenue, or a guaranteed right
              to profit.
            </p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Supply and technical details</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              The live implementation may include native ACP, wrapped ACP, custodial wallet balances, and bridge
              components. Before external distribution, token supply, contract addresses, chain identifiers,
              mint/burn controls, treasury policy, bridge limits, and audit reports must be published from the
              production deployment and verified by the operator.
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Utility inside ANCAP</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {utilities.map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/66">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-amber-100">Risk factors</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/72">
              {risks.map((risk) => (
                <li key={risk} className="rounded-2xl border border-white/10 bg-black/18 p-3">{risk}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-3xl border border-sky-300/15 bg-sky-400/[0.055] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Regulatory references</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Crypto-asset rules differ by country. In the European Union, Regulation (EU) 2023/1114 on Markets in
              Crypto-assets (MiCA) creates a framework for crypto-asset issuers and service providers. ANCAP should
              obtain jurisdiction-specific legal review before any public token offer, exchange listing, custody,
              promotion, or cross-border service launch.
            </p>
            <div className="mt-5 grid gap-3 text-sm">
              <a className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sky-100 transition hover:border-sky-300/35" href="https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32023R1114">
                EUR-Lex: Regulation (EU) 2023/1114
              </a>
              <a className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sky-100 transition hover:border-sky-300/35" href="https://finance.ec.europa.eu/regulation-and-supervision/financial-services-legislation/implementing-and-delegated-acts/markets-crypto-assets-regulation_en">
                European Commission: Markets in Crypto-assets Regulation
              </a>
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">No investment promise</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            ACP is described here for platform utility. ANCAP does not promise income, yield, buybacks, market value,
            redemption, appreciation, or investment returns. Users should buy ACP only for permitted platform use and
            only after understanding wallet, network, legal, tax, and operational risks.
          </p>
        </section>
      </main>
    </div>
  );
}
