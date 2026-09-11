"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { literaryAuction } from "@/lib/api";
import { ServiceReviewsPanel } from "@/components/ServiceReviewsPanel";

type Lot = {
  id: string;
  genre: string;
  title: string;
  author: string;
  blurb: string;
  starting_acp: string;
  current_acp: string;
  min_next_acp: string;
  bid_count: number;
  featured?: boolean;
  contract_hash: string;
  tx_hash?: string | null;
  review_target_id?: string | null;
};

type Catalog = {
  title: string;
  tagline: string;
  compliance_note: string;
  lots: Lot[];
  featured: Lot[];
  genres: Array<{ id: string; label: string }>;
};

function formatAcp(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ACP`;
  return `${n.toLocaleString()} ACP`;
}

export default function LiteraryAuctionPage() {
  const { user, isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewLot, setReviewLot] = useState<Lot | null>(null);

  const load = useCallback(async () => {
    try {
      const data = (await literaryAuction.catalog()) as Catalog;
      setCatalog(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load literary auction");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onBid = async (lot: Lot) => {
    if (!isAuthenticated) {
      setError("Sign in to bid");
      return;
    }
    const stake = amount.trim() || lot.min_next_acp;
    setBusy(true);
    setError("");
    try {
      const bid = (await literaryAuction.placeBid(lot.id, { amount_acp: stake })) as {
        tx_hash?: string;
        amount_acp: string;
      };
      setInfo(`Bid ${formatAcp(bid.amount_acp)} anchored ${bid.tx_hash?.slice(0, 12) || ""}`);
      setSelectedId(lot.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bid failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0c1016] text-slate-100">
      <Navigation />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm uppercase tracking-[0.2em] text-amber-400/80">Culture desk</p>
        <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
          {catalog?.title || "Literary Auction"}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-300">{catalog?.tagline}</p>
        <p className="mt-4 text-sm text-slate-500">{catalog?.compliance_note}</p>
        <p className="mt-3 text-sm">
          <Link href="/cryo" className="text-amber-200 underline">
            Cryopreservation desk
          </Link>
          {" · "}
          <Link href="/legal/cryo-constitution" className="text-amber-200 underline">
            Legal notice
          </Link>
        </p>

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
                <span className="text-sm text-slate-400">{lot.genre}</span>
              </div>
              <p className="mt-1 text-sm text-amber-200/80">{lot.author}</p>
              <p className="mt-2 text-slate-300">{lot.blurb}</p>
              <p className="mt-3 text-sm text-slate-400">
                {formatAcp(lot.current_acp)} · next {formatAcp(lot.min_next_acp)} · {lot.bid_count} bids
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onBid(lot)}
                  className="border border-amber-400/40 px-4 py-2 text-sm text-amber-100 hover:bg-amber-400/10 disabled:opacity-50"
                >
                  Bid ACP
                </button>
                {lot.review_target_id ? (
                  <button
                    type="button"
                    onClick={() => setReviewLot(lot)}
                    className="border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                  >
                    Reviews
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {reviewLot?.review_target_id ? (
          <div className="mt-12">
            <ServiceReviewsPanel
              targetType="literary_lot"
              targetId={reviewLot.review_target_id}
              label={reviewLot.title}
              reviewerUserId={isAuthenticated ? user?.id : undefined}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
