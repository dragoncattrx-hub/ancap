"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { paidApi } from "@/lib/api";

export default function DevelopersUsagePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [usage, setUsage] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        setUsage(await paidApi.listMyUsage(100));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load usage");
      }
    })();
  }, [isAuthenticated]);

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Navigation />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <Link href="/login?next=/developers/usage" className="text-emerald-300">
            Log in to view API usage
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/developers" className="text-sm text-emerald-300">
          Developers
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Paid API usage (30d window)</h1>
        {error ? <p className="mt-4 text-amber-200">{error}</p> : null}
        {usage?.totals_by_currency ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {Object.entries(usage.totals_by_currency).map(([currency, amount]) => (
              <div key={currency} className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm">
                <div className="text-white/55">Captured spend</div>
                <div className="text-lg font-semibold text-emerald-200">
                  {String(amount)} {currency}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-white/60">
              <tr>
                <th className="px-4 py-3">Endpoint</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {(usage?.items || []).map((row: any) => (
                <tr key={row.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-mono text-xs">{row.endpoint}</td>
                  <td className="px-4 py-3">{row.product_slug || "—"}</td>
                  <td className="px-4 py-3">
                    {row.amount_value} {row.amount_currency}
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3 text-white/55">{row.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <a href="/api/v1/paid-api/me/usage/export" className="mt-6 inline-block text-sm text-emerald-300">
          Export CSV
        </a>
      </main>
    </div>
  );
}
