"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { getApiUrl } from "@/lib/api";

type BreakdownItem = {
  source: string;
  amount: string;
  count: number;
};

type TreasuryStatus = {
  onchain: {
    address: string;
    balance_acp: string;
    balance_units: string;
    utxo_count: number;
    rpc_ok: boolean;
    error: string | null;
  };
  ledger: {
    account_id: string | null;
    currency: string;
    balance: string;
    revenue_total: string;
    expenses_total: string;
    revenue_30d: string;
    expenses_30d: string;
  };
  revenue_breakdown_30d: BreakdownItem[];
  expense_breakdown_30d: BreakdownItem[];
  fee_policy: Record<string, string>;
};

const FEE_LABELS: Record<string, string> = {
  order_fee_percent: "Marketplace order fee",
  run_fee_percent: "Contract run fee",
  listing_fee_percent: "Listing creation fee",
  merchant_default_fee_bps: "Merchant fee (bps)",
  referral_signup_bonus_acp: "Referral signup bonus (ACP)",
  referral_commission_share_rate: "Referral commission share",
  staking_rewards_fees_share_percent: "Fees recycled to stakers",
};

function formatAcp(value: string | undefined): string {
  if (!value) return "0";
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function TreasuryPage() {
  const [status, setStatus] = useState<TreasuryStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/treasury/status`);
        if (!res.ok) throw new Error("Treasury status unavailable");
        const data = (await res.json()) as TreasuryStatus;
        if (!cancelled) setStatus(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load treasury");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const net30d = status
    ? Number(status.ledger.revenue_30d) - Number(status.ledger.expenses_30d)
    : 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">Financial transparency</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Project Treasury</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            Platform revenue flows into the project treasury; platform expenses (referral bonuses, staking
            rewards, faucet) are paid out of it. The on-chain wallet and the internal ledger are both public.
          </p>
        </section>

        {error && <div className="mb-6 text-sm text-amber-300">{error}</div>}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">On-chain project wallet</div>
            <div className="mt-3 text-4xl font-black text-emerald-300">
              {formatAcp(status?.onchain.balance_acp)} <span className="text-lg font-semibold text-white/60">ACP</span>
            </div>
            <div className="mt-3 break-all font-mono text-xs text-white/55">{status?.onchain.address}</div>
            <div className="mt-2 text-xs text-white/45">
              {status?.onchain.rpc_ok ? `UTXOs: ${status.onchain.utxo_count}` : status?.onchain.error || "Loading…"}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Internal platform ledger ({status?.ledger.currency || "ACP"})</div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-white/45">Revenue (30d)</div>
                <div className="text-2xl font-bold text-emerald-300">{formatAcp(status?.ledger.revenue_30d)}</div>
              </div>
              <div>
                <div className="text-xs text-white/45">Expenses (30d)</div>
                <div className="text-2xl font-bold text-amber-300">{formatAcp(status?.ledger.expenses_30d)}</div>
              </div>
              <div>
                <div className="text-xs text-white/45">Net (30d)</div>
                <div className={`text-2xl font-bold ${net30d >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {formatAcp(String(net30d))}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/45">Revenue (all time)</div>
                <div className="text-2xl font-bold text-white/85">{formatAcp(status?.ledger.revenue_total)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 text-xs uppercase tracking-[0.18em] text-white/45">Revenue sources (30d)</div>
            {(status?.revenue_breakdown_30d ?? []).length === 0 && (
              <div className="text-sm text-white/50">No revenue events in the last 30 days.</div>
            )}
            <div className="grid gap-2">
              {(status?.revenue_breakdown_30d ?? []).map((item) => (
                <div key={item.source} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-sm text-white/80">{item.source} <span className="text-xs text-white/40">×{item.count}</span></div>
                  <div className="text-sm font-semibold text-emerald-300">{formatAcp(item.amount)} ACP</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 text-xs uppercase tracking-[0.18em] text-white/45">Expense outflows (30d)</div>
            {(status?.expense_breakdown_30d ?? []).length === 0 && (
              <div className="text-sm text-white/50">No expense events in the last 30 days.</div>
            )}
            <div className="grid gap-2">
              {(status?.expense_breakdown_30d ?? []).map((item) => (
                <div key={item.source} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-sm text-white/80">{item.source} <span className="text-xs text-white/40">×{item.count}</span></div>
                  <div className="text-sm font-semibold text-amber-300">{formatAcp(item.amount)} ACP</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4 text-xs uppercase tracking-[0.18em] text-white/45">Active fee policy</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(status?.fee_policy ?? {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                <div className="text-sm text-white/80">{FEE_LABELS[key] || key}</div>
                <div className="text-sm font-semibold text-white/90">
                  {key.endsWith("_percent") ? `${value}%` : key.endsWith("_rate") ? `${Number(value) * 100}%` : value}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/referrals" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              Referral program
            </Link>
            <Link href="/acp" className="rounded-full border border-emerald-400/25 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/50 hover:text-emerald-100">
              ACP explorer
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
