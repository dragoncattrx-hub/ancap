"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { acpExplorer } from "@/lib/api";
import { buildAcpTxHref } from "@/lib/acpExplorer";

export default function ExplorerMempoolPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setData(await acpExplorer.mempool());
      } catch (err) {
        setError(err instanceof Error ? err.message : t("explorerPage.errUnavailable"));
      }
    })();
    const id = window.setInterval(() => {
      void acpExplorer.mempool().then(setData).catch(() => undefined);
    }, 12000);
    return () => window.clearInterval(id);
  }, [t]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/explorer" className="text-sm text-emerald-300 hover:underline">
          {t("explorerPage.backExplorer")}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{t("explorerPage.mempoolTitle")}</h1>
        {error ? <p className="mt-4 text-amber-200">{error}</p> : null}
        {data ? (
          <>
            <pre className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
              {JSON.stringify(data.info || {}, null, 2)}
            </pre>
            {data.fee_estimate ? (
              <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
                {JSON.stringify(data.fee_estimate, null, 2)}
              </pre>
            ) : null}
            <h2 className="mt-8 text-lg font-semibold">{t("explorerPage.transactions")}</h2>
            <ul className="mt-3 space-y-2">
              {(data.txids || []).length === 0 ? (
                <li className="text-sm text-white/45">{t("explorerPage.mempoolEmpty")}</li>
              ) : (
                (data.txids || []).map((txid: string) => (
                  <li key={txid}>
                    <Link href={buildAcpTxHref(txid)} className="break-all font-mono text-xs text-emerald-300 hover:underline">
                      {txid}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </>
        ) : null}
      </main>
    </div>
  );
}
