"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { getApiUrl } from "@/lib/api";

type EdgeStatus = {
  feature_enabled: boolean;
  nodes_total: number;
  nodes_nominal: number;
  attestations_verified: number;
  next_gate: string;
  notes: string;
};

export default function OrbitalEdgeAdminPage() {
  const [status, setStatus] = useState<EdgeStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/orbital-edge/status`);
        if (!res.ok) throw new Error(`Status failed (${res.status})`);
        if (!cancelled) setStatus((await res.json()) as EdgeStatus);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load orbital edge");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">Admin / Orbital edge</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Sealed orbital edge</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
          Control-plane registry for SpaceX-path encrypted ANCAP edge nodes. Writes require{" "}
          <code className="text-white/85">FF_ORBITAL_EDGE</code>.
        </p>

        {error && <p className="mt-4 text-sm text-amber-300">{error}</p>}

        {status && (
          <section className="mt-8 space-y-4">
            <p className="text-sm text-white/70">{status.notes}</p>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Feature</dt>
                <dd className="mt-1 text-2xl font-semibold">{status.feature_enabled ? "on" : "off"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Next gate</dt>
                <dd className="mt-1 text-lg font-medium">{status.next_gate}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Nodes</dt>
                <dd className="mt-1 text-2xl font-semibold">
                  {status.nodes_nominal} nominal / {status.nodes_total} total
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Verified attestations</dt>
                <dd className="mt-1 text-2xl font-semibold">{status.attestations_verified}</dd>
              </div>
            </dl>
          </section>
        )}
      </main>
    </div>
  );
}
