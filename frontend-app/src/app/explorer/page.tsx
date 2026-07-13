"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { acpExplorer } from "@/lib/api";
import { buildAcpTxHref } from "@/lib/acpExplorer";

function shortHash(hash: string | null | undefined): string {
  const value = String(hash || "").trim();
  if (!value) return "—";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export default function ExplorerPage() {
  const [status, setStatus] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [searchTx, setSearchTx] = useState("");
  const [searchAddr, setSearchAddr] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [s, b] = await Promise.all([acpExplorer.status(), acpExplorer.blocks(12)]);
        setStatus(s);
        setBlocks(b.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Explorer unavailable");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const txid = searchTx.trim();
    if (!txid) return;
    window.location.href = buildAcpTxHref(txid, "/explorer/tx");
  }

  function onAddressSearch(event: FormEvent) {
    event.preventDefault();
    const addr = searchAddr.trim();
    if (!addr) return;
    window.location.href = `/explorer/address/${encodeURIComponent(addr)}`;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-semibold">ACP Explorer</h1>
        <p className="mt-2 text-sm text-white/65">Beta explorer for block height, latest blocks, and transaction lookup.</p>
        {error ? <p className="mt-4 text-amber-200">{error}</p> : null}
        {status ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
            <div>Chain ID: {status.chain_id}</div>
            <div className="mt-1">Height: {status.block_height}</div>
            <div className="mt-1 break-all text-white/55">Best hash: {status.best_block_hash}</div>
          </div>
        ) : null}
        <form onSubmit={onSearch} className="mt-6 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            placeholder="Search transaction id"
            value={searchTx}
            onChange={(e) => setSearchTx(e.target.value)}
          />
          <button type="submit" className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
            Search tx
          </button>
        </form>
        <form onSubmit={onAddressSearch} className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            placeholder="Search ACP address"
            value={searchAddr}
            onChange={(e) => setSearchAddr(e.target.value)}
          />
          <button type="submit" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold">
            Search address
          </button>
        </form>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Latest blocks</h2>
          {loading ? <p className="mt-4 text-sm text-white/55">Loading blocks…</p> : null}
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-white/60">
                <tr>
                  <th className="px-4 py-3">Height</th>
                  <th className="px-4 py-3">Hash</th>
                  <th className="px-4 py-3">Tx count</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((row) => (
                  <tr key={row.height} className="border-t border-white/10">
                    <td className="px-4 py-3">{row.height}</td>
                    <td className="px-4 py-3 font-mono text-xs text-white/70" title={row.hash || undefined}>
                      {shortHash(row.hash)}
                    </td>
                    <td className="px-4 py-3">{row.tx_count ?? 0}</td>
                  </tr>
                ))}
                {!loading && blocks.length === 0 ? (
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-3 text-white/55" colSpan={3}>
                      No blocks indexed yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
        <Link href="/reserves" className="mt-6 inline-block text-sm text-emerald-300">
          View reserves dashboard
        </Link>
      </main>
    </div>
  );
}
