"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ApiError, commerce } from "@/lib/api";

export default function PayWithStablecoinPage() {
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await commerce.joinRampWaitlist({ email, interest: "stablecoin_topup", region: region || undefined });
      setNotice(result.status === "already_registered" ? "You are already on the waitlist." : "Added to partner ramp waitlist.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Waitlist signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold">Pay with stablecoin</h1>
        <p className="mt-2 text-sm text-white/65">
          Partner on-ramp integrations are rolling out after compliance review. Join the waitlist for USDC/USDT top-up access.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            Email
            <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm">
            Region (optional)
            <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" value={region} onChange={(e) => setRegion(e.target.value)} />
          </label>
          <button type="submit" disabled={busy} className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
            Join waitlist
          </button>
        </form>
        {notice ? <p className="mt-4 text-emerald-200">{notice}</p> : null}
        {error ? <p className="mt-4 text-amber-200">{error}</p> : null}
        <Link href="/buy-acp" className="mt-6 inline-block text-sm text-emerald-300">
          Buy ACP with card (Stripe)
        </Link>
      </main>
    </div>
  );
}
