"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { WacpPublicActions } from "@/components/WacpPublicActions";
import { bridgeRail, marketData, wacpPublic } from "@/lib/api";

type MarketRow = { symbol?: string; price?: string | null; vs_currency?: string };

export default function ReservesPage() {
  const [wacp, setWacp] = useState<any>(null);
  const [reserve, setReserve] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [status, proof, prices] = await Promise.all([
          wacpPublic.status(),
          wacpPublic.reserveProof().catch(() => null),
          marketData.prices("usd").catch(() => null),
        ]);
        setWacp(status);
        setReserve(proof);
        setMarket(prices);
      } catch (err) {
        try {
          setReserve(await bridgeRail.reserveSummary());
        } catch {
          setError(err instanceof Error ? err.message : "Reserve data unavailable");
        }
      }
    })();
  }, []);

  const rows: MarketRow[] = Array.isArray(market?.prices) ? market.prices : [];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Reserves & bridge transparency</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          Live bridge addresses and reserve health from public ANCAP APIs. Always verify contract addresses on official docs before sending funds.
        </p>
        <div className="mt-8 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5 text-sm text-amber-100/90">
          Never send assets to addresses shared only in DMs or unofficial channels. Use{" "}
          <Link href="/docs/wacp/bridge" className="underline">
            official bridge documentation
          </Link>{" "}
          and{" "}
          <Link href="/docs/wacp/contracts" className="underline">
            published contracts
          </Link>
          .
        </div>
        {error ? <p className="mt-4 text-amber-200">{error}</p> : null}

        {rows.length > 0 ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">Indicative market context</h2>
              <Link href="/legal/market-data" className="text-sky-200 underline decoration-sky-400/40 underline-offset-4">
                Legal disclosure
              </Link>
            </div>
            <p className="mt-2 text-white/55">
              Spot prices via CoinGecko — not ANCAP settlement rates. {market?.attribution || ""}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {rows.map((row) => (
                <div key={row.symbol || row.price || Math.random()} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-white/45">{row.symbol}</div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {row.price ? `$${row.price}` : "—"} <span className="text-xs font-normal text-white/45">{row.vs_currency || "USD"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {wacp ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
            <h2 className="text-lg font-semibold">Bridge status</h2>
            <div className="mt-3 grid gap-2 text-white/70">
              <div>Overall: {wacp.status}</div>
              <div>Reserve health: {wacp.reserve_health}</div>
              <div className="break-all">wACP (BSC): {wacp.wacp_contract || "—"}</div>
              <div className="mt-3">
                <WacpPublicActions
                  contractAddress={wacp.wacp_contract || undefined}
                  layout="home"
                />
              </div>
              <div className="break-all">Gateway: {wacp.gateway_contract || "—"}</div>
              <div className="break-all">ACP reserve address: {wacp.reserve_acp_address || "—"}</div>
              <div>Redeem mode: {wacp.redeem_mode}</div>
            </div>
          </section>
        ) : null}
        {reserve ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
            <h2 className="text-lg font-semibold">Reserve proof snapshot</h2>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/25 p-4 text-xs text-white/75">
              {JSON.stringify(reserve, null, 2)}
            </pre>
          </section>
        ) : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["ACP supply", "/acp-supply"],
            ["Bridge UI", "/bridge"],
            ["Proof center", "/proof-center"],
            ["Platform status", "/status"],
          ].map(([title, href]) => (
            <Link key={title} href={href} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20">
              <div className="font-semibold">{title}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
