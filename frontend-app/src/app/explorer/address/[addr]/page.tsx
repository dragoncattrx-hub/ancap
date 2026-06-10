"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { acpExplorer } from "@/lib/api";

export default function ExplorerAddressPage() {
  const params = useParams<{ addr: string }>();
  const address = decodeURIComponent(params?.addr || "");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!address) return;
    void (async () => {
      try {
        setData(await acpExplorer.getAddress(address));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Address lookup failed");
      }
    })();
  }, [address]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/explorer" className="text-sm text-emerald-300">
          Back to explorer
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Address</h1>
        <p className="mt-2 break-all font-mono text-sm text-white/70">{address}</p>
        {error ? <p className="mt-4 text-amber-200">{error}</p> : null}
        {data ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
            <div>Balance: {data.balance_acp} ACP</div>
            <div className="mt-1">UTXOs: {data.utxo_count}</div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
