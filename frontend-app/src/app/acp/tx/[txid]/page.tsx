"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { walletAcp } from "@/lib/api";
import { sanitizeAcpTxid } from "@/lib/acpExplorer";

type TxIo = {
  address?: string | null;
  units: string;
  acp: string;
  vout?: number | null;
};

type TxDetails = {
  txid: string;
  block_height: number;
  block_hash?: string | null;
  block_time: string;
  confirmations: number;
  total_input_units: string;
  total_input_acp: string;
  total_output_units: string;
  total_output_acp: string;
  fee_units: string;
  fee_acp: string;
  inputs: TxIo[];
  outputs: TxIo[];
};

export default function AcpTransactionPage() {
  const params = useParams<{ txid: string }>();
  const rawTxid = decodeURIComponent(params?.txid || "").trim();
  const txid = useMemo(() => sanitizeAcpTxid(rawTxid), [rawTxid]);
  const [tx, setTx] = useState<TxDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!txid) {
        setError("Missing ACP transaction id");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = (await walletAcp.getTransaction(txid)) as TxDetails;
        if (active) setTx(data);
      } catch (e: unknown) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load ACP transaction");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [txid]);

  return (
    <div className="relative min-h-screen text-zinc-100">
      <NetworkBackground />
      <Navigation />
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">ACP Explorer</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">ACP transaction</h1>
            <p className="mt-2 break-all font-mono text-xs text-zinc-400">{txid || rawTxid || "—"}</p>
          </div>
          <Link href="/bridge/acp-bsc" className="btn btn-ghost btn-sm self-start">
            Back to bridge
          </Link>
        </div>

        {loading ? <p className="mt-6 text-sm text-zinc-400">Loading…</p> : null}
        {error ? (
          <div className="mt-6 rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            <div>{error}</div>
            {error.includes("ACP transaction not found") ? (
              <p className="mt-2 text-xs text-red-200/80">
                The txid is valid but this node cannot find it right now. It may be wrong, not yet indexed, or from a different ACP network.
              </p>
            ) : null}
          </div>
        ) : null}

        {tx ? (
          <>
            <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <h2 className="text-lg font-medium text-zinc-200">Summary</h2>
              <dl className="mt-3 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Block height</dt>
                  <dd>{tx.block_height}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Confirmations</dt>
                  <dd>{tx.confirmations}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Block time</dt>
                  <dd>{tx.block_time}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Fee</dt>
                  <dd>{tx.fee_acp} ACP</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Total inputs</dt>
                  <dd>{tx.total_input_acp} ACP</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Total outputs</dt>
                  <dd>{tx.total_output_acp} ACP</dd>
                </div>
                {tx.block_hash ? (
                  <div className="sm:col-span-2">
                    <dt className="text-zinc-500">Block hash</dt>
                    <dd className="break-all font-mono text-xs text-zinc-300">{tx.block_hash}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <h2 className="text-lg font-medium text-zinc-200">Inputs</h2>
                {tx.inputs.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500">No spend inputs recorded (likely genesis or coinbase-style transaction).</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-xs text-zinc-300">
                    {tx.inputs.map((item, idx) => (
                      <li key={`${item.address || "unknown"}-${item.vout ?? idx}-${idx}`} className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                        <div className="break-all font-mono text-zinc-400">{item.address || "unknown"}</div>
                        <div className="mt-1">{item.acp} ACP</div>
                        {item.vout !== null && item.vout !== undefined ? <div className="text-zinc-500">prev vout: {item.vout}</div> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <h2 className="text-lg font-medium text-zinc-200">Outputs</h2>
                {tx.outputs.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500">No outputs found.</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-xs text-zinc-300">
                    {tx.outputs.map((item, idx) => (
                      <li key={`${item.address || "unknown"}-${item.vout ?? idx}-${idx}`} className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                        <div className="break-all font-mono text-zinc-400">{item.address || "unknown"}</div>
                        <div className="mt-1">{item.acp} ACP</div>
                        {item.vout !== null && item.vout !== undefined ? <div className="text-zinc-500">vout: {item.vout}</div> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
