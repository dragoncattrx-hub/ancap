"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { platformAdmin } from "@/lib/api";

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "neutral" }) {
  const color =
    tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-rose-300" : "text-white";
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 backdrop-blur">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className={`mt-3 text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

export default function OpsOverviewPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await platformAdmin.overview());
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p className="text-sm text-rose-300">{error}</p>;
  if (!data) return <p className="text-sm text-white/40">{t("opsConsole.loading")}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white/90">{t("opsConsole.navOverview")}</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
        >
          {t("opsConsole.refresh")}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t("opsConsole.kpiUsers")} value={String(data.users_total)} />
        <Kpi label={t("opsConsole.kpiUsers7d")} value={String(data.users_7d)} tone="good" />
        <Kpi label={t("opsConsole.kpiRuns")} value={String(data.workflow_runs_total)} />
        <Kpi label={t("opsConsole.kpiRuns7d")} value={String(data.workflow_runs_7d)} />
        <Kpi label={t("opsConsole.kpiPayments")} value={String(data.captured_payments_total)} />
        <Kpi label={t("opsConsole.kpiPayments7d")} value={String(data.captured_payments_7d)} tone="good" />
        <Kpi
          label={t("opsConsole.kpiRedis")}
          value={data.redis_ok ? t("opsConsole.ok") : t("opsConsole.down")}
          tone={data.redis_ok ? "good" : "bad"}
        />
        <Kpi
          label={t("opsConsole.kpiLedger")}
          value={data.ledger_halted ? t("opsConsole.halted") : t("opsConsole.healthy")}
          tone={data.ledger_halted ? "bad" : "good"}
        />
      </div>
    </div>
  );
}
