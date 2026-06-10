"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, payouts } from "@/lib/api";

export default function SellerPayoutsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [amount, setAmount] = useState("10");
  const [destination, setDestination] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await payouts.list();
      setItems(res.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load payouts");
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await payouts.request({ amount, currency: "ACP", destination, method: "acp_wallet" });
      setAmount("10");
      setDestination("");
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Payout request failed");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Navigation />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <Link href="/login?next=/dashboard/seller/payouts" className="text-emerald-300">Log in for payouts</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Creator payouts</h1>
        <p className="mt-2 text-sm text-white/65">Request ACP payout to your on-chain address.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <label className="block text-sm">
            Amount (ACP)
            <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label className="block text-sm">
            Destination address
            <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" value={destination} onChange={(e) => setDestination(e.target.value)} required />
          </label>
          <label className="block text-sm">
            Note
            <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button type="submit" disabled={busy} className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
            {busy ? "Submitting…" : "Request payout"}
          </button>
        </form>
        <section className="mt-10">
          <h2 className="text-lg font-semibold">History</h2>
          <div className="mt-4 space-y-3">
            {items.length === 0 ? <p className="text-sm text-white/55">No payout requests yet.</p> : null}
            {items.map((row) => (
              <div key={row.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                <div>{row.amount?.amount} {row.amount?.currency}</div>
                <div className="mt-1 text-white/60">Status: {row.status}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
