"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, creators } from "@/lib/api";

const DAYS_OPTIONS = [7, 30, 90];

function fmtAmount(value: string | number | null | undefined) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0.00";
  return num.toFixed(2);
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? "");
          if (text.includes(",") || text.includes("\n") || text.includes('"')) {
            return `"${text.replace(/"/g, '""')}"`;
          }
          return text;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function RevenueLineChart({
  rows,
}: {
  rows: { period_start: string; earned_acp: string; payout_requested_acp: string; payout_completed_acp: string }[];
}) {
  if (!rows.length) return null;

  const width = 720;
  const height = 220;
  const padding = 24;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const series = rows.map((row) => ({
    label: row.period_start,
    earned: Number(row.earned_acp || 0),
    requested: Number(row.payout_requested_acp || 0),
    completed: Number(row.payout_completed_acp || 0),
  }));
  const maxValue = Math.max(
    1,
    ...series.flatMap((row) => [row.earned, row.requested, row.completed]),
  );
  const stepX = series.length > 1 ? innerWidth / (series.length - 1) : 0;
  const toPoint = (index: number, value: number) => {
    const x = padding + stepX * index;
    const y = padding + innerHeight - (value / maxValue) * innerHeight;
    return `${x},${y}`;
  };
  const buildPath = (key: "earned" | "requested" | "completed") =>
    series.map((row, index) => toPoint(index, row[key])).join(" ");

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]/40 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Creator revenue timeline">
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--border)" strokeWidth="1" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border)" strokeWidth="1" />
        {[0, 0.5, 1].map((ratio) => {
          const y = padding + innerHeight - ratio * innerHeight;
          return (
            <line
              key={ratio}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.35"
            />
          );
        })}
        <polyline fill="none" stroke="var(--accent)" strokeWidth="3" points={buildPath("earned")} />
        <polyline fill="none" stroke="#facc15" strokeWidth="2" points={buildPath("requested")} />
        <polyline fill="none" stroke="#4ade80" strokeWidth="2" points={buildPath("completed")} />
        {series.map((row, index) => {
          const point = toPoint(index, row.earned).split(",");
          return <circle key={row.label} cx={point[0]} cy={point[1]} r="3.5" fill="var(--accent)" />;
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-4 text-xs opacity-70">
        <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />Earned ACP</span>
        <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />Payout requested</span>
        <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400" />Payout completed</span>
      </div>
    </div>
  );
}

export default function SellerEarningsDashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [earnings, setEarnings] = useState<any | null>(null);
  const [conversions, setConversions] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [earningsData, conversionsData] = await Promise.all([
        creators.getMyEarnings(days),
        creators.getMyConversions(days),
      ]);
      setEarnings(earningsData);
      setConversions(conversionsData);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        setError("Login required to view creator earnings.");
      } else {
        setError(e?.message || String(e));
      }
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadData();
    }
  }, [isAuthenticated, loadData]);

  const totals = useMemo(() => {
    const totalEarnings = Number(earnings?.total_earnings_acp || 0);
    const windowEarnings = Number(earnings?.window_earnings_acp || 0);
    const pendingPayout = Number(earnings?.pending_payout_acp || 0);
    const paidOut = Number(earnings?.paid_out_acp || 0);
    const conversionRate = earnings?.conversion_rate;
    const completedOrders = Number(earnings?.completed_order_count || 0);
    return {
      totalEarnings,
      windowEarnings,
      pendingPayout,
      paidOut,
      conversionRate,
      completedOrders,
    };
  }, [earnings]);

  const workflowRows = useMemo(() => {
    return Array.isArray(earnings?.earnings_by_workflow) ? earnings.earnings_by_workflow : [];
  }, [earnings]);

  const periodRows = useMemo(() => {
    return Array.isArray(earnings?.earnings_by_period) ? earnings.earnings_by_period : [];
  }, [earnings]);

  const conversionRows = useMemo(() => {
    return Array.isArray(conversions?.listings) ? conversions.listings : [];
  }, [conversions]);

  const handleExport = useCallback(() => {
    if (!earnings || !conversions) return;
    setExporting(true);
    try {
      downloadCsv(`creator-earnings-${days}d.csv`, [
        ["section", "metric", "value"],
        ["summary", "window_days", String(days)],
        ["summary", "total_earnings_acp", String(earnings.total_earnings_acp || "0")],
        ["summary", "window_earnings_acp", String(earnings.window_earnings_acp || "0")],
        ["summary", "pending_payout_acp", String(earnings.pending_payout_acp || "0")],
        ["summary", "paid_out_acp", String(earnings.paid_out_acp || "0")],
        ["summary", "completed_order_count", String(earnings.completed_order_count || 0)],
        ["summary", "conversion_rate_basis", String(earnings.conversion_rate_basis || "")],
        [],
        ["workflow", "strategy_id", "workflow_slug", "title", "category", "captured_amount_acp", "order_count", "latest_order_at"],
        ...workflowRows.map((row: any) => [
          "workflow",
          row.strategy_id,
          row.workflow_slug,
          row.title,
          row.category,
          row.captured_amount_acp,
          String(row.order_count || 0),
          row.latest_order_at || "",
        ]),
        [],
        ["period", "period_start", "earned_acp", "payout_requested_acp", "payout_completed_acp", "completed_orders"],
        ...periodRows.map((row: any) => [
          "period",
          row.period_start,
          row.earned_acp,
          row.payout_requested_acp,
          row.payout_completed_acp,
          String(row.completed_orders || 0),
        ]),
        [],
        ["conversion", "listing_id", "strategy_id", "title", "category", "completed"],
        ...conversionRows.map((row: any) => [
          "conversion",
          row.listing_id,
          row.strategy_id,
          row.title,
          row.category,
          String(row.counts?.completed || 0),
        ]),
      ]);
    } finally {
      setExporting(false);
    }
  }, [conversions, days, earnings, periodRows, workflowRows, conversionRows]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <Navigation />
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Seller earnings</h1>
            <p className="text-sm opacity-60 mt-1">
              Revenue, payout backlog, and creator conversion coverage for the last {days} days.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DAYS_OPTIONS.map((value) => (
              <button
                key={value}
                onClick={() => setDays(value)}
                className={`px-3 py-1.5 rounded text-sm border transition ${
                  days === value
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border)] hover:border-[var(--accent)]"
                }`}
              >
                {value}d
              </button>
            ))}
            <button
              onClick={handleExport}
              disabled={!earnings || !conversions || exporting}
              className="px-3 py-1.5 rounded text-sm border border-[var(--border)] hover:border-[var(--accent)] disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-16 opacity-60">Loading creator earnings...</div>}

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && earnings && conversions && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
                <div className="text-xs opacity-60 uppercase tracking-wider">Window revenue</div>
                <div className="text-2xl font-mono font-bold text-[var(--accent)]">{fmtAmount(totals.windowEarnings)}</div>
                <div className="text-xs opacity-60">ACP</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
                <div className="text-xs opacity-60 uppercase tracking-wider">Lifetime revenue</div>
                <div className="text-2xl font-mono font-bold">{fmtAmount(totals.totalEarnings)}</div>
                <div className="text-xs opacity-60">ACP</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
                <div className="text-xs opacity-60 uppercase tracking-wider">Pending payout</div>
                <div className="text-2xl font-mono font-bold text-yellow-400">{fmtAmount(totals.pendingPayout)}</div>
                <div className="text-xs opacity-60">ACP</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
                <div className="text-xs opacity-60 uppercase tracking-wider">Paid out</div>
                <div className="text-2xl font-mono font-bold text-green-400">{fmtAmount(totals.paidOut)}</div>
                <div className="text-xs opacity-60">ACP</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
                <div className="text-xs opacity-60 uppercase tracking-wider">Completed orders</div>
                <div className="text-2xl font-mono font-bold">{totals.completedOrders}</div>
                <div className="text-xs opacity-60">
                  {typeof totals.conversionRate === "number"
                    ? `${totals.conversionRate.toFixed(1)}% conversion`
                    : earnings.conversion_rate_basis || "Awaiting full funnel instrumentation"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-semibold">Revenue by workflow</h2>
                    <p className="text-sm opacity-60">Top earning workflow SKUs in the selected window.</p>
                  </div>
                </div>
                {workflowRows.length === 0 ? (
                  <p className="text-sm opacity-50">No paid ACP workflow revenue in this window yet.</p>
                ) : (
                  <div className="space-y-3">
                    {workflowRows.map((row: any) => (
                      <div key={`${row.strategy_id}-${row.workflow_slug}`} className="rounded-lg border border-[var(--border)] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{row.title}</div>
                            <div className="text-xs opacity-60">{row.workflow_slug} · {row.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-[var(--accent)]">{fmtAmount(row.captured_amount_acp)} ACP</div>
                            <div className="text-xs opacity-60">{row.order_count} orders</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="mb-4">
                  <h2 className="font-semibold">Conversion coverage</h2>
                  <p className="text-sm opacity-60">
                    Only completed orders are instrumented so far. Views, add-to-cart, and checkout-started stay zero until funnel events ship.
                  </p>
                </div>
                <div className="space-y-3">
                  {conversionRows.length === 0 ? (
                    <p className="text-sm opacity-50">No creator listings found for this account yet.</p>
                  ) : (
                    conversionRows.map((row: any) => (
                      <div key={row.listing_id} className="rounded-lg border border-[var(--border)] p-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{row.title}</div>
                          <div className="text-xs opacity-60">{row.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">{row.counts?.completed || 0}</div>
                          <div className="text-xs opacity-60">completed</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4">
                <h2 className="font-semibold">Daily earnings timeline</h2>
                <p className="text-sm opacity-60">Windowed ACP revenue and payout movement by day.</p>
              </div>
              {periodRows.length === 0 ? (
                <p className="text-sm opacity-50">No earnings or payout history in this window yet.</p>
              ) : (
                <div className="space-y-4">
                  <RevenueLineChart rows={periodRows} />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left opacity-60 border-b border-[var(--border)]">
                          <th className="py-2 pr-4">Day</th>
                          <th className="py-2 pr-4">Earned ACP</th>
                          <th className="py-2 pr-4">Payout requested</th>
                          <th className="py-2 pr-4">Payout completed</th>
                          <th className="py-2 pr-0">Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodRows.map((row: any) => (
                          <tr key={row.period_start} className="border-b border-[var(--border)]/60">
                            <td className="py-2 pr-4 font-mono">{row.period_start}</td>
                            <td className="py-2 pr-4 font-mono">{fmtAmount(row.earned_acp)}</td>
                            <td className="py-2 pr-4 font-mono">{fmtAmount(row.payout_requested_acp)}</td>
                            <td className="py-2 pr-4 font-mono">{fmtAmount(row.payout_completed_acp)}</td>
                            <td className="py-2 pr-0 font-mono">{row.completed_orders}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
