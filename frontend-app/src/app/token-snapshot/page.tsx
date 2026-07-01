"use client";

import { useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { getApiUrl } from "@/lib/api";

type SnapshotCheck = {
  key: string;
  label: string;
  status: "pass" | "warn" | "needs_evidence";
  note: string;
};

type SnapshotResult = {
  subject: string;
  chain: string;
  score: number;
  risk_level: "low" | "medium" | "high";
  is_contract_address: boolean;
  onchain_verified: boolean;
  token_name: string | null;
  token_symbol: string | null;
  token_decimals: number | null;
  total_supply: string | null;
  checks: SnapshotCheck[];
  disclaimer: string;
};

const statusStyles: Record<SnapshotCheck["status"], string> = {
  pass: "text-emerald-300",
  warn: "text-amber-300",
  needs_evidence: "text-white/60",
};

const statusLabels: Record<SnapshotCheck["status"], string> = {
  pass: "verified",
  warn: "warning",
  needs_evidence: "needs evidence",
};

export default function TokenSnapshotPage() {
  const [subject, setSubject] = useState("");
  const [chain, setChain] = useState("BSC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SnapshotResult | null>(null);

  const runSnapshot = async () => {
    const trimmed = subject.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getApiUrl()}/token-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: trimmed, chain: chain.trim() || "bsc" }),
      });
      if (!res.ok) {
        throw new Error(res.status === 429 ? "Too many snapshots — try again in a minute." : "Snapshot service unavailable, try again.");
      }
      setResult((await res.json()) as SnapshotResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Snapshot failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const score = result?.score ?? null;
  const risk = result?.risk_level ?? "";
  const reportHref = `/ai/run/token-risk-report-pro?prefill=1&inputs=${encodeURIComponent(JSON.stringify({
    project_name: result?.token_name || subject || "Token project",
    token_symbol: result?.token_symbol || subject || "TOKEN",
    chain,
    liquidity_model: "DEX-led liquidity",
  }))}&paymentCurrency=ACP&unlockFullResult=1`;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">Free lead magnet</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Free Token Risk Snapshot</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            Real on-chain first-pass check (contract code + ERC-20 interface on BSC/Ethereum), then upgrade to Token Risk Report Pro for evidence gaps, liquidity/holder flags, and a proof-backed receipt.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="https://t.me/ancap24news" target="_blank" rel="noopener noreferrer" className="rounded-full border border-sky-300/25 bg-sky-400/[0.08] px-5 py-2.5 text-sm font-semibold text-sky-100 transition hover:border-sky-200/45 hover:text-white">
              Telegram growth loop
            </a>
            <a href="https://x.com/ancap24news" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              Follow on X
            </a>
            <Link href="/referrals" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              Referral program
            </Link>
          </div>
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
              <button
                type="button"
                onClick={() => void runSnapshot()}
                disabled={loading || !subject.trim()}
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Running snapshot..." : "Run free snapshot"}
              </button>
              {error && <div className="text-sm text-amber-300">{error}</div>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            {score === null ? (
              <div className="text-sm text-white/55">Enter a token, project, or 0x contract address and run the free snapshot.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Snapshot score</div>
                    <div className="mt-2 text-5xl font-black text-emerald-300">{score}</div>
                    {result?.onchain_verified && (
                      <div className="mt-2 text-xs text-emerald-200/85">
                        On-chain verified{result.token_symbol ? `: ${result.token_symbol}` : ""}
                        {result.token_name ? ` (${result.token_name})` : ""}
                      </div>
                    )}
                  </div>
                  <span className="rounded-full border border-emerald-400/25 px-4 py-2 text-sm font-semibold text-emerald-200">{risk} risk signal</span>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {(result?.checks ?? []).map((check) => (
                    <div key={check.key} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-white/90">{check.label}</div>
                        <span className={`text-xs font-semibold uppercase tracking-wide ${statusStyles[check.status]}`}>{statusLabels[check.status]}</span>
                      </div>
                      <div className="mt-2 text-sm text-white/60">{check.note}</div>
                    </div>
                  ))}
                </div>
                {result?.disclaimer && <p className="mt-4 text-xs leading-5 text-white/45">{result.disclaimer}</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={reportHref} className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">
                    Upgrade to Token Risk Report Pro
                  </Link>
                  <Link href="/sample-reports/token-risk-report-pro" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
                    View sample report
                  </Link>
                  <Link href="/ai/bundles/pro-launch-pack" className="rounded-full border border-emerald-400/25 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/50 hover:text-emerald-100">
                    Upgrade to Pro Launch Pack
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
