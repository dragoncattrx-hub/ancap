"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { system } from "@/lib/api";

export default function OpsSystemPage() {
  const { t } = useLanguage();
  const [payload, setPayload] = useState<any>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [deep, economy, ledger] = await Promise.all([
        system.deepHealth(),
        system.economyHealth(),
        system.ledgerInvariantStatus(),
      ]);
      setPayload({ deep, economy, ledger });
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{t("opsConsole.systemHealth")}</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
        >
          {t("opsConsole.refresh")}
        </button>
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <pre className="overflow-x-auto rounded-2xl border border-white/8 bg-black/30 p-4 text-xs leading-relaxed text-emerald-100/80">
        {payload ? JSON.stringify(payload, null, 2) : t("opsConsole.loading")}
      </pre>
    </div>
  );
}
