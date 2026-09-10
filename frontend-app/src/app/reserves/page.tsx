"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { WacpPublicActions } from "@/components/WacpPublicActions";
import { bridgeRail, cryptoBenchmark, marketData, wacpPublic } from "@/lib/api";

type MarketRow = { symbol?: string; price?: string | null; vs_currency?: string };
type BenchmarkClass = {
  id: string;
  title: string;
  baseline: string;
  result: "pass" | "fail" | "pending";
  notes: string[];
};

const resultStyles: Record<BenchmarkClass["result"], string> = {
  pass: "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-100",
  fail: "border-rose-400/30 bg-rose-400/[0.08] text-rose-100",
  pending: "border-amber-400/30 bg-amber-400/[0.08] text-amber-100",
};

export default function ReservesPage() {
  const [wacp, setWacp] = useState<any>(null);
  const [reserve, setReserve] = useState<any>(null);
  const [benchmark, setBenchmark] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const settled = await Promise.allSettled([
        wacpPublic.status(),
        wacpPublic.reserveProof(),
        cryptoBenchmark.scorecard(),
        marketData.prices("usd"),
      ]);
      const [statusRes, proofRes, scorecardRes, pricesRes] = settled;

      if (statusRes.status === "fulfilled") {
        setWacp(statusRes.value);
      } else {
        setError(statusRes.reason instanceof Error ? statusRes.reason.message : "Bridge status unavailable");
      }

      if (proofRes.status === "fulfilled") {
        setReserve(proofRes.value);
      } else {
        try {
          setReserve(await bridgeRail.reserveSummary());
        } catch {
          // keep page usable with status/scorecard even if proof fails
        }
      }

      if (scorecardRes.status === "fulfilled") {
        setBenchmark(scorecardRes.value);
      }
      if (pricesRes.status === "fulfilled") {
        setMarket(pricesRes.value);
      }
    })();
  }, []);

  const rows: MarketRow[] = Array.isArray(market?.prices) ? market.prices : [];
  const classes: BenchmarkClass[] = Array.isArray(benchmark?.classes) ? benchmark.classes : [];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Reserves & bridge transparency</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          Live bridge addresses and reserve health from public ANCAP APIs. Benchmarks follow a QOBLIB-style rule: claims are only as strong as the published baseline behind them.
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

        {benchmark ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">Crypto benchmark scorecard</h2>
              <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${resultStyles[benchmark.overall as BenchmarkClass["result"]] || resultStyles.pending}`}>
                Overall: {benchmark.overall}
              </span>
            </div>
            <p className="mt-2 text-white/55">{benchmark.summary}</p>
            <div className="mt-4 grid gap-3">
              {classes.map((cls) => (
                <div key={cls.id} className={`rounded-xl border p-4 ${resultStyles[cls.result]}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="font-medium">{cls.title}</div>
                    <div className="text-xs uppercase tracking-wide">{cls.result}</div>
                  </div>
                  <p className="mt-2 text-xs text-white/60">Baseline: {cls.baseline}</p>
                  {cls.notes?.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-white/70">
                      {cls.notes.slice(0, 3).map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

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
              {rows.map((row, index) => (
                <div key={row.symbol || `row-${index}`} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
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
