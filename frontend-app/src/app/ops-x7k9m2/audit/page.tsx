"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { audit } from "@/lib/api";

export default function OpsAuditPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await audit.list({ days: 7, limit: 100 });
      setItems(res.items || []);
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
        <h2 className="text-lg font-medium">{t("opsConsole.auditTitle")}</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
        >
          {t("opsConsole.refresh")}
        </button>
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-white/40">{t("opsConsole.noItems")}</p>}
        {items.map((item) => (
          <div key={item.id || `${item.type}-${item.created_at}`} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded border border-emerald-800/60 px-2 py-0.5 font-mono text-emerald-300">
                {item.type}
              </span>
              <span className="font-mono text-white/50">{item.event_type}</span>
              {item.created_at && (
                <span className="text-white/35">{new Date(item.created_at).toLocaleString()}</span>
              )}
            </div>
            {item.message && <p className="mt-2 text-sm text-white/70">{item.message}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
