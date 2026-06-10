"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { acpExplorer, system } from "@/lib/api";

export default function StatusPage() {
  const [apiHealth, setApiHealth] = useState<any>(null);
  const [chain, setChain] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [health, explorer] = await Promise.all([
          system.health().catch(() => null),
          acpExplorer.status().catch(() => null),
        ]);
        setApiHealth(health);
        setChain(explorer);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Status unavailable");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Platform status</h1>
        <p className="mt-2 text-sm text-white/65">Public API and ACP node health.</p>
        {error ? <p className="mt-4 text-red-300">{error}</p> : null}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-widest text-white/50">API</div>
            <div className="mt-2 text-lg font-semibold text-emerald-300">{apiHealth ? "Operational" : "Checking…"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-widest text-white/50">ACP chain</div>
            <div className="mt-2 text-lg font-semibold">{chain?.status === "ok" ? "Synced" : "Unavailable"}</div>
            {chain?.block_height != null ? (
              <div className="mt-1 text-sm text-white/60">Block height: {chain.block_height}</div>
            ) : null}
          </div>
        </div>
        <Link href="/explorer" className="mt-6 inline-block text-sm text-emerald-300">
          Open explorer
        </Link>
      </main>
    </div>
  );
}
