"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { bridgeRail, wacpPublic } from "@/lib/api";

export default function ReservesPage() {
  const [wacp, setWacp] = useState<any>(null);
  const [reserve, setReserve] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [status, proof] = await Promise.all([
          wacpPublic.status(),
          wacpPublic.reserveProof().catch(() => null),
        ]);
        setWacp(status);
        setReserve(proof);
      } catch (err) {
        try {
          setReserve(await bridgeRail.reserveSummary());
        } catch {
          setError(err instanceof Error ? err.message : "Reserve data unavailable");
        }
      }
    })();
  }, []);

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
        {wacp ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
            <h2 className="text-lg font-semibold">Bridge status</h2>
            <div className="mt-3 grid gap-2 text-white/70">
              <div>Overall: {wacp.status}</div>
              <div>Reserve health: {wacp.reserve_health}</div>
              <div className="break-all">wACP (BSC): {wacp.wacp_contract || "—"}</div>
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
