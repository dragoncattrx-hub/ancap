"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { acpExplorer } from "@/lib/api";

export default function ExplorerTxPage() {
  const params = useParams<{ txid: string }>();
  const txid = params?.txid || "";
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!txid) return;
    void acpExplorer
      .getTx(txid)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Transaction not found"));
  }, [txid]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Transaction</h1>
        <p className="mt-2 break-all font-mono text-xs text-white/60">{txid}</p>
        {error ? <p className="mt-4 text-red-300">{error}</p> : null}
        {data ? (
          <pre className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs">
            {JSON.stringify(data.transaction, null, 2)}
          </pre>
        ) : null}
      </main>
    </div>
  );
}
