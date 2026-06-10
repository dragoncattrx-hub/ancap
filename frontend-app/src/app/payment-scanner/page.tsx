"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, paymentScanner } from "@/lib/api";

export default function PaymentScannerPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function onParse(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setConfirmed(false);
    try {
      setPreview(await paymentScanner.parse(raw, "paste"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Parse failed");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Navigation />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <Link href="/login?next=/payment-scanner" className="text-emerald-300">
            Log in to use Payment Scanner
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-semibold">AI Payment Scanner</h1>
        <p className="mt-2 text-sm text-white/65">
          Paste a payment URI, invoice text, or QR payload. Review the preview and manually confirm before executing Smart Pay.
        </p>
        <form onSubmit={onParse} className="mt-6 space-y-3">
          <textarea
            className="min-h-[140px] w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm"
            placeholder="acp:address?amount=10 or invoice text..."
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {busy ? "Parsing…" : "Preview payment"}
          </button>
        </form>
        {error ? <p className="mt-4 text-amber-200">{error}</p> : null}
        {preview ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
            <div>Network: {preview.detected_network || "unknown"}</div>
            <div className="mt-1">Address: {preview.address || "—"}</div>
            <div className="mt-1">
              Amount: {preview.amount || "—"} {preview.currency || ""}
            </div>
            <div className="mt-1">Confidence: {(preview.confidence * 100).toFixed(0)}%</div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-white/65">
              {(preview.parse_notes || []).map((note: string) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <label className="mt-5 flex items-center gap-2">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              I reviewed this preview and want to proceed manually
            </label>
            {confirmed && preview.address ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/explorer/address/${encodeURIComponent(preview.address)}`}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold"
                >
                  Open address
                </Link>
                <Link href="/wallet" className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
                  Continue in wallet
                </Link>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
