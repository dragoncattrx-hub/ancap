"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, pay } from "@/lib/api";

export default function InvoicesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [customerEmail, setCustomerEmail] = useState("");
  const [description, setDescription] = useState("Services");
  const [amount, setAmount] = useState("25");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const invoice = await pay.createInvoice({
        customer_email: customerEmail || undefined,
        create_payment_link: true,
        due_in_days: 14,
        line_items: [{ description, quantity: 1, unit_amount: amount, currency: "ACP" }],
      });
      setResult(invoice);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create invoice");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Navigation />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <Link href="/login?next=/invoices" className="text-emerald-300">Log in to create invoices</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold">Create invoice</h1>
        <p className="mt-2 text-sm text-white/65">MVP invoice with optional payment link attachment.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            Customer email
            <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
          </label>
          <label className="block text-sm">
            Line item
            <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </label>
          <label className="block text-sm">
            Amount (ACP)
            <input className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button type="submit" disabled={busy} className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
            {busy ? "Creating…" : "Create invoice"}
          </button>
        </form>
        {result ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
            <div>Invoice {result.invoice_number}</div>
            <div className="mt-2 text-white/65">Status: {result.status}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              {result.payment_link ? (
                <Link href={`/pay/${result.payment_link.code}`} className="text-emerald-300">
                  Open payment link
                </Link>
              ) : null}
              {result.id ? (
                <a href={pay.invoiceExportUrl(result.id)} className="text-emerald-300">
                  Download export (TXT)
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
