"use client";

import { useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { workflowStore } from "@/lib/api";

export default function ProofCenterPage() {
  const [runId, setRunId] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("run") || "";
  });
  const [proof, setProof] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadProof() {
    if (!runId.trim()) return;
    try {
      setLoading(true);
      setError("");
      const data = await workflowStore.getProofBundle(runId.trim());
      setProof(data);
    } catch (e: any) {
      setError(e?.message || "Could not load proof bundle. Sign in may be required for private runs.");
      setProof(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">Trust layer</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Proof Center</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            Verify paid workflow receipts, proof hashes, payment evidence, execution metadata, and chain receipt status.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/ai/workflows" className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Buy workflow
            </Link>
            <a href="/agent-products.json" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              Agent catalog
            </a>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          {[
            ["Receipt", "Workflow slug, price snapshot, ledger event, and status timeline."],
            ["Input hash", "A deterministic reference to submitted inputs without exposing private details."],
            ["Output items", "The delivered report sections, campaign assets, or API response artifacts."],
            ["Share URL", "A proof link that can be sent to a team, buyer, partner, or AI agent."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/90">{title}</div>
              <p className="mt-2 text-sm leading-6 text-white/62">{text}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.72fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-sm font-semibold text-white/90">Lookup workflow proof</div>
            <div className="mt-4 grid gap-3">
              <input
                value={runId}
                onChange={(event) => setRunId(event.target.value)}
                placeholder="workflow run id"
                className="w-full rounded-2xl border border-white/10 bg-[var(--bg)] px-4 py-3 text-sm text-white outline-none"
              />
              <button
                type="button"
                onClick={loadProof}
                disabled={loading}
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Loading..." : "Load proof bundle"}
              </button>
              {runId && (
                <Link href={`/ai/runs/${runId}`} className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
                  Open run detail
                </Link>
              )}
            </div>
            {error && <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            {!proof ? (
              <div>
                <div className="text-sm text-white/55">
                  Proof bundles are generated for paid workflow runs and include receipt items, payment confirmation, execution metadata, settlement attempts, and a deterministic proof hash.
                </div>
                <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">{JSON.stringify({
                  workflow_slug: "token-risk-report-pro",
                  price_snapshot: { amount: "59", currency: "ACP" },
                  input_hash: "sha256:...",
                  status_timeline: ["quoted", "paid", "running", "completed"],
                  output_items: ["Risk scorecard", "Evidence gaps", "Proof receipt"],
                  ledger_event: "credit_reserved_or_captured",
                  share_url: "https://ancap.cloud/proof-center?run=RUN_ID",
                }, null, 2)}</pre>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Proof hash</div>
                    <div className="mt-2 break-all text-sm font-semibold text-emerald-300">{proof.proof_hash}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Payment</div>
                    <div className="mt-2 text-lg font-semibold text-white/92">{proof.summary?.payment_confirmed ? "confirmed" : "pending"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Chain receipts</div>
                    <div className="mt-2 text-lg font-semibold text-white/92">{proof.summary?.chain_receipt_count ?? 0}</div>
                  </div>
                </div>
                <pre className="mt-5 max-h-[620px] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">{JSON.stringify(proof, null, 2)}</pre>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
