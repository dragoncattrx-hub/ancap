"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, claimCodes } from "@/lib/api";

export default function ClaimCodesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [amount, setAmount] = useState("5");
  const [campaign, setCampaign] = useState("");
  const [created, setCreated] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setCreated(await claimCodes.create({ amount, currency: "ACP", campaign_label: campaign || undefined }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create claim code");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Navigation />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <Link href="/login?next=/claim" className="text-emerald-300">Log in to create claim codes</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold">Claim codes</h1>
        <p className="mt-2 text-sm text-white/65">Lock ACP balance into a one-time redeemable voucher with proof receipt.</p>
        <form onSubmit={onCreate} className="mt-6 space-y-4">
          <label className="block text-sm">
            Amount (ACP)
            <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label className="block text-sm">
            Campaign label
            <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button type="submit" disabled={busy} className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
            {busy ? "Creating…" : "Create claim code"}
          </button>
        </form>
        {created ? (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5 text-sm">
            <div className="font-mono text-base">{created.code}</div>
            <Link href={`/claim/${encodeURIComponent(created.code)}`} className="mt-3 inline-block text-emerald-300">
              Redeem page
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
