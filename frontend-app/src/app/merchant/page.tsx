"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, merchant } from "@/lib/api";

export default function MerchantDashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await merchant.dashboard());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  async function downloadCsv() {
    const res = await merchant.exportCsv();
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ancap-merchant-payments.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Navigation />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <Link href="/login?next=/merchant" className="text-emerald-300">Log in to open merchant dashboard</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Merchant dashboard</h1>
            <p className="mt-2 text-sm text-white/65">Sales, payment links, and CSV export.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/pay/create" className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">New link</Link>
            <button type="button" onClick={downloadCsv} className="rounded-full border border-white/15 px-4 py-2 text-sm">Export CSV</button>
          </div>
        </div>
        {error ? <p className="mt-4 text-red-300">{error}</p> : null}
        {data ? (
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              ["Total links", data.total_links],
              ["Paid", data.paid_links],
              ["Pending", data.pending_links],
              ["Volume (ACP)", data.total_volume_acp],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-widest text-white/50">{label}</div>
                <div className="mt-2 text-2xl font-semibold">{value}</div>
              </div>
            ))}
          </div>
        ) : null}
        {data?.recent_links?.length ? (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Recent payment links</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-white/60">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_links.map((row: any) => (
                    <tr key={row.id} className="border-t border-white/10">
                      <td className="px-4 py-3">{row.title}</td>
                      <td className="px-4 py-3">{row.amount} {row.currency}</td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3">
                        <Link href={`/pay/${row.code}`} className="text-emerald-300">Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
