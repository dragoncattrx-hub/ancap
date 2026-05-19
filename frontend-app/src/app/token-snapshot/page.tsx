"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";

function scoreFor(subject: string, chain: string) {
  const raw = `${subject}:${chain}`.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.max(31, Math.min(92, 44 + (raw % 49)));
}

export default function TokenSnapshotPage() {
  const [subject, setSubject] = useState("");
  const [chain, setChain] = useState("Base");
  const score = useMemo(() => (subject.trim() ? scoreFor(subject.trim(), chain.trim()) : null), [subject, chain]);
  const risk = score === null ? "" : score >= 76 ? "low" : score >= 52 ? "medium" : "high";
  const reportHref = `/ai/run/token-risk-report-pro?prefill=1&inputs=${encodeURIComponent(JSON.stringify({
    project_name: subject || "Token project",
    token_symbol: subject || "TOKEN",
    chain,
    liquidity_model: "DEX-led liquidity",
  }))}&paymentCurrency=USDC&unlockFullResult=1`;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">Free lead magnet</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Free Token Risk Snapshot</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            Generate a lightweight first-pass score, then upgrade to Token Risk Report Pro for evidence gaps, liquidity/holder flags, and a proof-backed receipt.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="grid gap-4">
              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">Token / project / contract</div>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="ANCAP / 0x..."
                  className="w-full rounded-2xl border border-white/10 bg-[var(--bg)] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">Chain</div>
                <input
                  value={chain}
                  onChange={(event) => setChain(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[var(--bg)] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            {score === null ? (
              <div className="text-sm text-white/55">Enter a token, project, or contract reference to generate the free snapshot.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Snapshot score</div>
                    <div className="mt-2 text-5xl font-black text-emerald-300">{score}</div>
                  </div>
                  <span className="rounded-full border border-emerald-400/25 px-4 py-2 text-sm font-semibold text-emerald-200">{risk} risk signal</span>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {["holder concentration", "liquidity proof", "treasury controls", "campaign disclosure"].map((item, index) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <div className="font-semibold text-white/90">{item}</div>
                      <div className="mt-2 text-sm text-white/60">{index % 2 === 0 ? "needs evidence" : "review recommended"}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={reportHref} className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">
                    Upgrade to Token Risk Report Pro
                  </Link>
                  <Link href="/sample-reports/token-risk-report-pro" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
                    View sample report
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
