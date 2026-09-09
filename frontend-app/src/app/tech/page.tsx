"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { techAuction } from "@/lib/api";

type Lot = {
  id: string;
  category: string;
  title: string;
  stack: string;
  blurb: string;
  starting_acp: string;
  current_acp: string;
  min_next_acp: string;
  bid_count: number;
  featured?: boolean;
  contract_hash: string;
  tx_hash?: string | null;
  exponential_boost_bps?: number;
};

type Catalog = {
  title: string;
  tagline: string;
  compliance_note: string;
  lots: Lot[];
  featured: Lot[];
  technologies: Array<{ id: string; label: string; layer: string }>;
};

function formatAcp(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ACP`;
  return `${n.toLocaleString()} ACP`;
}

export default function TechAuctionPage() {
  const { isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = (await techAuction.catalog()) as Catalog;
      setCatalog(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load TECH auction");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onBid = async (lot: Lot) => {
    if (!isAuthenticated) {
      setError("Sign in to bid on technology lots");
      return;
    }
    const stake = amount.trim() || lot.min_next_acp;
    setBusy(true);
    setError("");
    try {
      const bid = (await techAuction.placeBid(lot.id, { amount_acp: stake })) as {
        tx_hash?: string;
        amount_acp: string;
      };
      setInfo(`Bid ${formatAcp(bid.amount_acp)} · tx ${bid.tx_hash?.slice(0, 12) || "anchored"}…`);
      setSelectedId(lot.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bid failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#071018] text-slate-100">
      <Navigation />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400/80">ANCAP TECH</p>
        <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
          {catalog?.title || "TECH Auction"}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          {catalog?.tagline || "License platform technologies settled in ACP via AuctionEscrow."}
        </p>
        <p className="mt-4 text-sm text-slate-500">{catalog?.compliance_note}</p>

        {catalog?.technologies?.length ? (
          <div className="mt-8 grid gap-2 sm:grid-cols-2">
            {catalog.technologies.map((t) => (
              <div key={t.id} className="border-b border-white/10 py-2 text-sm text-slate-300">
                <span className="text-cyan-300/90">{t.layer}</span> · {t.label}
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-end gap-3">
          <label className="text-sm text-slate-400">
            Bid amount (ACP)
            <input
              className="mt-1 block w-40 border border-white/15 bg-black/40 px-3 py-2 text-white"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="min next"
            />
          </label>
          <p className="text-sm text-slate-500">Network growth lowers bid increments (expo boost).</p>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
        {info ? <p className="mt-2 text-sm text-emerald-400">{info}</p> : null}

        <ul className="mt-10 space-y-6">
          {(catalog?.lots || []).map((lot) => (
            <li
              key={lot.id}
              className={`border-t border-white/10 pt-5 ${selectedId === lot.id ? "opacity-100" : ""}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl text-white">{lot.title}</h2>
                <span className="text-sm text-slate-400">{lot.category}</span>
              </div>
              <p className="mt-1 text-sm text-cyan-200/80">{lot.stack}</p>
              <p className="mt-2 text-slate-300">{lot.blurb}</p>
              <p className="mt-3 text-sm text-slate-400">
                Current {formatAcp(lot.current_acp)} · next ≥ {formatAcp(lot.min_next_acp)} ·{" "}
                {lot.bid_count} bids
                {lot.exponential_boost_bps
                  ? ` · expo −${lot.exponential_boost_bps} bps`
                  : ""}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onBid(lot)}
                className="mt-3 border border-cyan-400/40 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-400/10 disabled:opacity-50"
              >
                Bid ACP
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
