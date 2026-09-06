"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { getApiUrl } from "@/lib/api";

type DeskSummary = {
  org_id: string;
  intakes_total: number;
  intakes_open: number;
  positions_active: number;
  collateral_credit_acp_total: string;
};

export default function SecuritiesDeskPage() {
  const [orgId, setOrgId] = useState("");
  const [summary, setSummary] = useState<DeskSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("ancap_securities_org_id");
    if (saved) setOrgId(saved);
  }, []);

  async function loadSummary() {
    const id = orgId.trim();
    if (!id) {
      setError("Organization id required");
      return;
    }
    window.localStorage.setItem("ancap_securities_org_id", id);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getApiUrl()}/organizations/${id}/securities/summary`, {
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) throw new Error(`Summary failed (${res.status})`);
      setSummary((await res.json()) as DeskSummary);
    } catch (err) {
      setSummary(null);
      setError(err instanceof Error ? err.message : "Failed to load desk");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">
          <Link href="/treasury" className="hover:text-white/70">
            Treasury
          </Link>{" "}
          / Securities
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Securities desk</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
          Intake promissory notes, equity, and other instruments for org custody and ACP collateral credit
          (register-only MVP).
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="text-white/55">Organization id</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 font-mono text-sm outline-none focus:border-white/35"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="uuid"
            />
          </label>
          <button
            type="button"
            onClick={loadSummary}
            disabled={loading}
            className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm hover:bg-white/[0.1] disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load desk"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-amber-300">{error}</p>}

        {summary && (
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Intakes</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {summary.intakes_open} open / {summary.intakes_total} total
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Active positions</dt>
              <dd className="mt-1 text-2xl font-semibold">{summary.positions_active}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Collateral credit (ACP)</dt>
              <dd className="mt-1 text-2xl font-semibold">{summary.collateral_credit_acp_total}</dd>
            </div>
          </dl>
        )}
      </main>
    </div>
  );
}
