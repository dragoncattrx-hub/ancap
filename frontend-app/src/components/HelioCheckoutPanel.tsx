"use client";

import { useEffect, useMemo, useState } from "react";
import { HelioCheckout } from "@heliofi/checkout-react";
import { getApiUrl } from "@/lib/api";

type HelioStatus = {
  configured: boolean;
  paylink_configured: boolean;
  webhook_secret_present: boolean;
  network: string;
  paylink_id?: string | null;
  primary_payment_method: string;
  default_amount: string;
  currency_hint: string;
  notes?: string[];
};

export function HelioCheckoutPanel() {
  const [status, setStatus] = useState<HelioStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("10");
  const [paidNote, setPaidNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/commerce/helio/status`, {
          headers: { "X-Requested-With": "XMLHttpRequest" },
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`Helio status ${res.status}`);
        }
        const data = (await res.json()) as HelioStatus;
        if (cancelled) return;
        setStatus(data);
        if (data.default_amount) setAmount(data.default_amount);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load Helio status");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const config = useMemo(() => {
    if (!status?.configured || !status.paylink_id) return null;
    const primary =
      status.primary_payment_method === "crypto" ? "crypto" : "fiat";
    return {
      paylinkId: status.paylink_id,
      amount: amount.trim() || status.default_amount || "10",
      display: "button" as const,
      primaryPaymentMethod: primary as "fiat" | "crypto",
      themeMode: "dark" as const,
      customTexts: {
        mainButtonTitle: "Pay with MoonPay Commerce",
        payButtonTitle: "Complete payment",
      },
      onSuccess: () => {
        setPaidNote(
          "Payment submitted. ACP credit is confirmed by the operator after the Helio webhook — keep your receipt email.",
        );
      },
      onError: () => {
        setPaidNote("Payment failed or was cancelled in the checkout widget.");
      },
    };
  }, [status, amount]);

  if (error) {
    return (
      <p className="text-sm text-amber-200/80">
        MoonPay Commerce status unavailable ({error}). Use bridge / credits meanwhile.
      </p>
    );
  }

  if (!status) {
    return <p className="text-sm text-white/50">Loading MoonPay Commerce checkout…</p>;
  }

  if (!status.configured || !config) {
    return (
      <p className="text-sm text-white/55">
        MoonPay Commerce checkout is not configured on this host yet
        {status.notes?.length ? ` — ${status.notes[0]}` : ""}.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs uppercase tracking-wide text-white/45">
        Amount ({status.currency_hint})
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full max-w-[12rem] rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
        />
      </label>
      <HelioCheckout config={config} />
      {paidNote ? <p className="text-xs leading-6 text-emerald-200/80">{paidNote}</p> : null}
      <p className="text-xs leading-6 text-white/45">
        Card / crypto via{" "}
        <a href="https://moonpay.hel.io/developer" className="underline" target="_blank" rel="noreferrer">
          MoonPay Commerce
        </a>
        . Licensed partner handles geo/KYC; ANCAP does not operate as a VASP.
      </p>
    </div>
  );
}
