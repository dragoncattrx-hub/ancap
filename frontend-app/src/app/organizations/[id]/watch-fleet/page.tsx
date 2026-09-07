"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { getApiUrl } from "@/lib/api";

type FleetSummary = {
  org_id: string;
  watches_total: number;
  watches_active: number;
  employees_covered: number;
  latest_hr_at: string | null;
  rotation_enabled: boolean;
};

export default function WatchFleetPage() {
  const params = useParams();
  const orgId = String(params?.id || "");
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/organizations/${orgId}/watch-fleet/summary`, {
          credentials: "include",
          headers: { "X-Requested-With": "XMLHttpRequest" },
        });
        if (!res.ok) throw new Error(`Fleet summary failed (${res.status})`);
        if (!cancelled) setSummary((await res.json()) as FleetSummary);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load fleet");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">
          <Link href={`/organizations/${orgId}`} className="hover:text-white/70">
            Organization
          </Link>{" "}
          / Watch fleet
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Apple Watch fleet</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
          Three watches per employee (slots A/B/C), rotation policy, and heart-rate ingest for on-shift
          presence.
        </p>

        {error && <p className="mt-4 text-sm text-amber-300">{error}</p>}

        {summary && (
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Watches</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {summary.watches_active} active / {summary.watches_total} total
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Employees covered</dt>
              <dd className="mt-1 text-2xl font-semibold">{summary.employees_covered}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Rotation</dt>
              <dd className="mt-1 text-2xl font-semibold">{summary.rotation_enabled ? "enabled" : "off"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Latest HR</dt>
              <dd className="mt-1 text-sm font-mono text-white/75">{summary.latest_hr_at ?? "—"}</dd>
            </div>
          </dl>
        )}
      </main>
    </div>
  );
}
