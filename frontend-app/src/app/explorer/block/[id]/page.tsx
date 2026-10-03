"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { acpExplorer } from "@/lib/api";
import { buildAcpBlockHref, buildAcpTxHref } from "@/lib/acpExplorer";

export default function ExplorerBlockPage() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params?.id || "");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        setData(await acpExplorer.getBlock(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : t("explorerPage.errUnavailable"));
      }
    })();
  }, [id, t]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/explorer" className="text-sm text-emerald-300 hover:underline">
          {t("explorerPage.backExplorer")}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{t("explorerPage.blockTitle")}</h1>
        <p className="mt-2 break-all font-mono text-xs text-white/55">{id}</p>
        {error ? <p className="mt-4 text-amber-200">{error}</p> : null}
        {data ? (
          <>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-white/45">{t("explorerPage.colHeight")}</dt>
                <dd className="mt-1 font-mono">{data.height}</dd>
              </div>
              <div>
                <dt className="text-white/45">{t("explorerPage.colTxCount")}</dt>
                <dd className="mt-1 font-mono">{data.tx_count}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-white/45">{t("explorerPage.colHash")}</dt>
                <dd className="mt-1 break-all font-mono text-xs">{data.hash}</dd>
              </div>
              <div>
                <dt className="text-white/45">{t("explorerPage.colTime")}</dt>
                <dd className="mt-1 font-mono">{data.time ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-white/45">{t("explorerPage.colSize")}</dt>
                <dd className="mt-1 font-mono">{data.size ?? "—"}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {data.previous_hash ? (
                <Link href={buildAcpBlockHref(data.previous_hash)} className="text-emerald-300 hover:underline">
                  ← prev
                </Link>
              ) : null}
              {data.next_hash ? (
                <Link href={buildAcpBlockHref(data.next_hash)} className="text-emerald-300 hover:underline">
                  next →
                </Link>
              ) : null}
            </div>
            <h2 className="mt-8 text-lg font-semibold">{t("explorerPage.transactions")}</h2>
            <ul className="mt-3 space-y-2">
              {(data.txids || []).map((txid: string) => (
                <li key={txid}>
                  <Link href={buildAcpTxHref(txid)} className="break-all font-mono text-xs text-emerald-300 hover:underline">
                    {txid}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </main>
    </div>
  );
}
