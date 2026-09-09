"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { insuranceDesk } from "@/lib/api";

type Product = {
  coverage_class: string;
  label: string;
  description: string;
  pool_id: string;
  min_sum_insured_acp: string;
  max_sum_insured_acp: string;
  premium_bps: number;
  term_days_default: number;
};

type Catalog = {
  title: string;
  tagline: string;
  compliance_note: string;
  products: Product[];
};

type Quote = {
  premium_acp: string;
  sum_insured_acp: string;
  premium_bps: number;
  term_days: number;
  quote_hash: string;
};

function formatAcp(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ACP`;
  return `${n.toLocaleString()} ACP`;
}

export default function InsurancePage() {
  const { isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [selected, setSelected] = useState<string>("wallet_theft");
  const [sumInsured, setSumInsured] = useState("1000");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = (await insuranceDesk.catalog()) as Catalog;
        setCatalog(data);
        if (data.products[0]) setSelected(data.products[0].coverage_class);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load insurance catalog");
      }
    })();
  }, []);

  const onQuote = async () => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const q = (await insuranceDesk.quote({
        coverage_class: selected,
        sum_insured_acp: sumInsured,
      })) as Quote;
      setQuote(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quote failed");
    } finally {
      setBusy(false);
    }
  };

  const onBuy = async () => {
    if (!isAuthenticated) {
      setError("Sign in to buy a policy");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const policy = await insuranceDesk.createPolicy({
        coverage_class: selected,
        sum_insured_acp: sumInsured,
      });
      setInfo(`Policy issued: ${(policy as { id: string }).id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Navigation />
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <div>
          <p className="text-emerald-400 text-sm uppercase tracking-wide">ACP Insurance</p>
          <h1 className="text-3xl font-semibold mt-1">{catalog?.title ?? "Insurance Desk"}</h1>
          <p className="text-slate-400 mt-2">{catalog?.tagline}</p>
        </div>

        {catalog?.compliance_note ? (
          <p className="text-amber-200/80 text-sm border border-amber-900/50 rounded-lg p-3 bg-amber-950/30">
            {catalog.compliance_note}
          </p>
        ) : null}

        {error ? <p className="text-rose-300 text-sm">{error}</p> : null}
        {info ? <p className="text-emerald-300 text-sm">{info}</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
          {(catalog?.products ?? []).map((p) => (
            <button
              key={p.coverage_class}
              type="button"
              onClick={() => setSelected(p.coverage_class)}
              className={`text-left rounded-xl border p-4 transition ${
                selected === p.coverage_class
                  ? "border-emerald-500 bg-emerald-950/40"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
              }`}
            >
              <div className="font-medium">{p.label}</div>
              <div className="text-slate-400 text-sm mt-1">{p.description}</div>
              <div className="text-xs text-slate-500 mt-2">
                Premium {p.premium_bps} bps · {formatAcp(p.min_sum_insured_acp)}–{formatAcp(p.max_sum_insured_acp)}
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <label className="block text-sm text-slate-300">
            Sum insured (ACP)
            <input
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2"
              value={sumInsured}
              onChange={(e) => setSumInsured(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onQuote()}
              className="rounded-lg bg-slate-100 text-slate-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Quote
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onBuy()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Buy with ACP
            </button>
            <Link href="/wallet" className="rounded-lg border border-slate-700 px-4 py-2 text-sm">
              Wallet
            </Link>
          </div>
          {quote ? (
            <p className="text-sm text-slate-300">
              Premium <strong>{formatAcp(quote.premium_acp)}</strong> for {formatAcp(quote.sum_insured_acp)} ·{" "}
              {quote.term_days}d · hash {quote.quote_hash.slice(0, 12)}…
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
