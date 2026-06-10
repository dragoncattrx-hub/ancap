"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, pay } from "@/lib/api";
import { commerceEvents } from "@/lib/analytics";

export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("10");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    commerceEvents.checkoutStart("payment_link_create", amount, "ACP");
    try {
      const row = await pay.createPaymentLink({ title, amount, currency: "ACP", description: description || undefined });
      router.push(`/pay/${row.code}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create payment link");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Navigation />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-white/70">Sign in to create payment links.</p>
          <Link href="/login" className="mt-4 inline-block text-emerald-300">Log in</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold">Create payment link</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            Title
            <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="block text-sm">
            Amount (ACP)
            <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label className="block text-sm">
            Description
            <textarea className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button type="submit" disabled={busy} className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
            {busy ? "Creating…" : "Create link"}
          </button>
        </form>
      </main>
    </div>
  );
}
