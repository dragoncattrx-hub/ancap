"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, pay } from "@/lib/api";
import { commerceEvents } from "@/lib/analytics";

type PaymentLink = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  amount: string;
  currency: string;
  status: string;
  pay_url: string;
  proof_url?: string | null;
};

export default function PayCheckoutPage() {
  const params = useParams<{ code: string }>();
  const code = params?.code || "";
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const row = await pay.getPublicPaymentLink(code);
      setLink(row);
      commerceEvents.workflowView(`pay_link_${code}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Payment link not found");
    }
  }, [code]);

  useEffect(() => {
    if (code) void load();
  }, [code, load]);

  async function onPay() {
    if (!link) return;
    setBusy(true);
    setError("");
    commerceEvents.checkoutStart("payment_link_checkout", link.amount, link.currency);
    try {
      const result = await pay.checkoutPaymentLink(code, { payment_method: "credits" });
      commerceEvents.paymentCaptured("payment_link", result.payment_intent_id);
      if (result.payment_link?.proof_url) {
        commerceEvents.receiptReady("payment_link", result.payment_link.proof_url);
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Navigation />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-white/70">Sign in to pay with ACP credits.</p>
          <Link href={`/login?next=/pay/${encodeURIComponent(code)}`} className="mt-4 inline-block text-emerald-300">
            Log in
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-lg px-4 py-10">
        {error && !link ? <p className="text-red-300">{error}</p> : null}
        {link ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs uppercase tracking-widest text-emerald-300">ANCAP Pay</div>
            <h1 className="mt-2 text-2xl font-semibold">{link.title}</h1>
            {link.description ? <p className="mt-2 text-sm text-white/65">{link.description}</p> : null}
            <div className="mt-4 text-3xl font-bold text-emerald-300">
              {link.amount} {link.currency}
            </div>
            <div className="mt-2 text-sm text-white/55">Status: {link.status}</div>
            {link.status === "pending" ? (
              <button type="button" onClick={onPay} disabled={busy} className="mt-6 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
                {busy ? "Processing…" : "Pay with ACP credits"}
              </button>
            ) : null}
            {link.proof_url ? (
              <Link href={link.proof_url.replace("https://ancap.cloud", "")} className="mt-4 block text-sm text-sky-300">
                View proof receipt
              </Link>
            ) : null}
            <Link href="/buy-acp" className="mt-4 block text-sm text-white/60">
              Need credits? Buy ACP
            </Link>
          </div>
        ) : null}
        {error && link ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </main>
    </div>
  );
}
