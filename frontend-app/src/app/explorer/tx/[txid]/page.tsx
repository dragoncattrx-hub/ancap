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
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!txid) return;
    void acpExplorer
      .getTx(txid, full ? "full" : "redacted")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Transaction not found"));
  }, [txid, full]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Transaction</h1>
        <p className="mt-2 break-all font-mono text-xs text-white/60">{txid}</p>
        <p className="mt-3 text-sm text-white/55">
          Default view is privacy-redacted. Full wire is still public to anyone running a node.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md border border-white/20 px-3 py-2 text-sm"
          onClick={() => setFull((v) => !v)}
        >
          {full ? "Show redacted summary" : "Reveal full decode"}
        </button>
        {error ? <p className="mt-4 text-red-300">{error}</p> : null}
        {data ? (
          <pre className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs">
            {JSON.stringify(full ? data.transaction || data : data.summary || data, null, 2)}
          </pre>
        ) : null}
      </main>
    </div>
  );
}
