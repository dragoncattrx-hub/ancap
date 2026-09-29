"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { payments, workflowStore } from "@/lib/api";

export default function OpsFinancePage() {
  const { t } = useLanguage();
  const [revenue, setRevenue] = useState<any>(null);
  const [topUps, setTopUps] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [rev, tops, refs] = await Promise.all([
        workflowStore.revenueSummary(30),
        workflowStore.listAdminTopUpIntents("requires_payment", 20),
        payments.listRefundRequests("pending"),
      ]);
      setRevenue(rev);
      setTopUps(tops.items || tops || []);
      setRefunds(refs.items || refs || []);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmTopUp = async (id: string) => {
    setBusy(id);
    try {
      await workflowStore.approveCreditTopUpIntent(id, {
        payment_reference: `ops-manual-${Date.now()}`,
      });
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy("");
    }
  };

  const actRefund = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      if (action === "approve") await payments.approveRefundRequest(id, {});
      else await payments.rejectRefundRequest(id, {});
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{t("opsConsole.financeTitle")}</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
        >
          {t("opsConsole.refresh")}
        </button>
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}

      <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        <h3 className="text-sm font-semibold text-emerald-200">{t("opsConsole.revenue")}</h3>
        <pre className="mt-3 overflow-x-auto text-xs text-white/70">
          {revenue ? JSON.stringify(revenue, null, 2) : t("opsConsole.loading")}
        </pre>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-emerald-200">{t("opsConsole.topUps")}</h3>
        {(topUps || []).length === 0 && <p className="text-sm text-white/40">{t("opsConsole.noItems")}</p>}
        {(topUps || []).map((item: any) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/8 px-4 py-3 text-sm">
            <div>
              <p className="font-mono text-xs text-white/80">{item.id}</p>
              <p className="text-xs text-white/40">{item.status}</p>
            </div>
            <button
              type="button"
              disabled={busy === item.id}
              onClick={() => void confirmTopUp(item.id)}
              className="rounded-lg bg-emerald-400/90 px-3 py-1.5 text-xs font-semibold text-[#041018] disabled:opacity-50"
            >
              {t("opsConsole.confirm")}
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-emerald-200">{t("opsConsole.refunds")}</h3>
        {(refunds || []).length === 0 && <p className="text-sm text-white/40">{t("opsConsole.noItems")}</p>}
        {(refunds || []).map((item: any) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs">{item.id}</p>
              <p className="text-xs text-white/45">{item.reason || item.status}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy === item.id}
                onClick={() => void actRefund(item.id, "approve")}
                className="rounded-lg border border-emerald-400/30 px-3 py-1.5 text-xs text-emerald-200"
              >
                {t("opsConsole.approve")}
              </button>
              <button
                type="button"
                disabled={busy === item.id}
                onClick={() => void actRefund(item.id, "reject")}
                className="rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs text-rose-200"
              >
                {t("opsConsole.reject")}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
