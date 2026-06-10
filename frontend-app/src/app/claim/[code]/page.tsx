"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, claimCodes } from "@/lib/api";

export default function RedeemClaimCodePage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params?.code || "");
  const { isAuthenticated, isLoading } = useAuth();
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onRedeem() {
    setBusy(true);
    setError("");
    try {
      setResult(await claimCodes.redeem({ code, pin: pin || undefined }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Redeem failed");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Navigation />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <Link href={`/login?next=/claim/${encodeURIComponent(code)}`} className="text-emerald-300">Log in to redeem</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold">Redeem claim code</h1>
        <p className="mt-2 break-all font-mono text-sm text-white/60">{code}</p>
        <label className="mt-6 block text-sm">
          PIN (if required)
          <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" value={pin} onChange={(e) => setPin(e.target.value)} />
        </label>
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        <button type="button" onClick={onRedeem} disabled={busy} className="mt-4 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
          {busy ? "Redeeming…" : "Redeem to wallet"}
        </button>
        {result ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
            <div>Redeemed {result.amount} {result.currency}</div>
            {result.proof_url ? (
              <Link href={result.proof_url.replace("https://ancap.cloud", "")} className="mt-2 inline-block text-emerald-300">
                View proof
              </Link>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
