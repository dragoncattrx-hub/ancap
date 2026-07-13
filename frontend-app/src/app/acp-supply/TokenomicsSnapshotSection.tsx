import Link from "next/link";

type TokenomicsBucket = {
  key: string;
  label: string;
  share_pct: number;
  target_acp: string;
  address: string;
  on_chain_acp: string;
  utxo_count: number;
  status: string;
  location_note?: string | null;
};

type TokenomicsSnapshot = {
  genesis_supply_acp: string;
  buckets_sum_acp: string;
  alignment_status: string;
  buckets: TokenomicsBucket[];
  hot_pool?: {
    total_acp: string;
    utxo_count: number;
    ecosystem_on_hot_acp: string;
    operator_pool_acp: string;
  } | null;
  block_height?: number | null;
};

function statusBadge(status: string) {
  if (status === "ok" || status === "on_hot") return "text-emerald-300";
  if (status === "deficit") return "text-amber-300";
  return "text-rose-300";
}

export function TokenomicsSnapshotSection({ snapshot }: { snapshot: TokenomicsSnapshot | null }) {
  if (!snapshot) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:col-span-2">
        <h2 className="font-semibold">Genesis tokenomics (210M ACP)</h2>
        <p className="mt-3 text-sm text-amber-200">Tokenomics snapshot unavailable</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Genesis tokenomics (210M ACP)</h2>
        <span className={`text-sm font-medium ${snapshot.alignment_status === "aligned" ? "text-emerald-300" : "text-amber-300"}`}>
          {snapshot.alignment_status === "aligned" ? "Aligned" : "Partial alignment"}
        </span>
      </div>
      <p className="mt-2 text-sm text-white/65">
        Creator 33% (69.3M) · Validator 50% (105M) · Public 12% (25.2M) · Ecosystem 5% (10.5M).
        {snapshot.block_height != null ? ` Block ${snapshot.block_height}.` : ""}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-white/50">
            <tr>
              <th className="pb-2 pr-4 font-medium">Bucket</th>
              <th className="pb-2 pr-4 font-medium">Share</th>
              <th className="pb-2 pr-4 font-medium">Target</th>
              <th className="pb-2 pr-4 font-medium">On-chain</th>
              <th className="pb-2 pr-4 font-medium">UTXO</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            {snapshot.buckets.map((b) => (
              <tr key={b.key} className="border-t border-white/10">
                <td className="py-2 pr-4">
                  <div className="font-medium text-white">{b.label}</div>
                  <Link href={`/explorer/address/${encodeURIComponent(b.address)}`} className="text-xs text-emerald-300 break-all">
                    {b.address}
                  </Link>
                  {b.location_note ? <div className="mt-1 text-xs text-white/55">{b.location_note}</div> : null}
                </td>
                <td className="py-2 pr-4">{b.share_pct}%</td>
                <td className="py-2 pr-4">{b.target_acp} ACP</td>
                <td className="py-2 pr-4">{b.on_chain_acp} ACP</td>
                <td className="py-2 pr-4">{b.utxo_count}</td>
                <td className={`py-2 font-medium ${statusBadge(b.status)}`}>{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-6 text-sm text-white/70">
        <div>
          <span className="text-white/50">Buckets sum: </span>
          <strong className="text-white">{snapshot.buckets_sum_acp} ACP</strong>
        </div>
        {snapshot.hot_pool ? (
          <>
            <div>
              <span className="text-white/50">Custodial hot total: </span>
              <strong className="text-white">{snapshot.hot_pool.total_acp} ACP</strong>
            </div>
            <div>
              <span className="text-white/50">Ecosystem on hot: </span>
              <strong className="text-white">{snapshot.hot_pool.ecosystem_on_hot_acp} ACP</strong>
            </div>
            <div>
              <span className="text-white/50">Operator pool on hot: </span>
              <strong className="text-white">{snapshot.hot_pool.operator_pool_acp} ACP</strong>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
