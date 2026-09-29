"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { platformAdmin } from "@/lib/api";

export default function OpsUsersPage() {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<any | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await platformAdmin.listUsers({ q: q.trim() || undefined, limit: 50, offset: 0 });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    try {
      setDetail(await platformAdmin.getUser(id));
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium">{t("opsConsole.navUsers")}</h2>
        <p className="text-xs text-white/40">{t("opsConsole.usersTotal").replace("{n}", String(total))}</p>
      </div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("opsConsole.searchUsers")}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-semibold text-[#041018]"
        >
          {t("opsConsole.refresh")}
        </button>
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-white/8">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-3">{t("opsConsole.colEmail")}</th>
              <th className="px-4 py-3">{t("opsConsole.colName")}</th>
              <th className="px-4 py-3">{t("opsConsole.colCreated")}</th>
              <th className="px-4 py-3">{t("opsConsole.colWallets")}</th>
              <th className="px-4 py-3">{t("opsConsole.colRuns")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-xs text-emerald-100/90">{u.email}</td>
                <td className="px-4 py-3 text-white/70">{u.display_name || t("opsConsole.none")}</td>
                <td className="px-4 py-3 text-xs text-white/45">
                  {u.created_at ? new Date(u.created_at).toLocaleString() : t("opsConsole.none")}
                </td>
                <td className="px-4 py-3 text-xs text-white/55">
                  {[u.has_acp_wallet ? "ACP" : null, u.has_evm_wallet ? "EVM" : null].filter(Boolean).join(" · ") ||
                    t("opsConsole.none")}
                </td>
                <td className="px-4 py-3 tabular-nums">{u.workflow_runs}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => void openDetail(u.id)}
                    className="text-xs text-emerald-300 hover:underline"
                  >
                    {t("opsConsole.detail")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-sm text-white/40">{t("opsConsole.noItems")}</p>}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDetail(null)}>
          <div
            className="w-full max-w-lg rounded-2xl border border-emerald-400/20 bg-[#0a1218] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm text-emerald-200">{detail.email}</p>
                <p className="mt-1 text-xs text-white/40">{detail.id}</p>
              </div>
              <button type="button" className="text-xs text-white/50" onClick={() => setDetail(null)}>
                {t("opsConsole.close")}
              </button>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-white/40">{t("opsConsole.colName")}</dt>
                <dd>{detail.display_name || t("opsConsole.none")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/40">{t("opsConsole.acpWallet")}</dt>
                <dd className="break-all font-mono text-xs">{detail.acp_address || t("opsConsole.none")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/40">{t("opsConsole.evmWallet")}</dt>
                <dd className="break-all font-mono text-xs">{detail.evm_address || t("opsConsole.none")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/40">{t("opsConsole.stripe")}</dt>
                <dd className="font-mono text-xs">{detail.stripe_customer_id || t("opsConsole.none")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/40">{t("opsConsole.colRuns")}</dt>
                <dd>{detail.workflow_runs}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/40">{t("opsConsole.capturedPayments")}</dt>
                <dd>{detail.captured_payments}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
