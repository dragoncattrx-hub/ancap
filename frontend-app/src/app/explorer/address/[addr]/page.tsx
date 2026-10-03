"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { acpExplorer } from "@/lib/api";
import { buildAcpTxHref } from "@/lib/acpExplorer";

export default function ExplorerAddressPage() {
  const { t } = useLanguage();
  const params = useParams<{ addr: string }>();
  const address = decodeURIComponent(params?.addr || "");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!address) return;
    void (async () => {
      try {
        setData(await acpExplorer.getAddress(address, 50, offset));
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("explorerPage.errUnavailable"));
      }
    })();
  }, [address, offset, t]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/explorer" className="text-sm text-emerald-300 hover:underline">
          {t("explorerPage.backExplorer")}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{t("explorerPage.addressTitle")}</h1>
        <p className="mt-2 break-all font-mono text-sm text-white/70">{address}</p>
        {error ? <p className="mt-4 text-amber-200">{error}</p> : null}
        {data ? (
          <>
            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-white/45">{t("explorerPage.balance")}</div>
                <div className="mt-1 text-lg font-semibold">{data.balance_acp} ACP</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-white/45">UTXOs</div>
                <div className="mt-1 text-lg font-semibold">{data.utxo_count}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-white/45">{t("explorerPage.role")}</div>
                <div className="mt-1 text-lg font-semibold">{data.role_label || "—"}</div>
              </div>
            </div>

            <h2 className="mt-8 text-lg font-semibold">{t("explorerPage.utxos")}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(data.utxos || []).length === 0 ? (
                <li className="text-white/45">—</li>
              ) : (
                (data.utxos || []).map((u: any) => (
                  <li key={`${u.txid}:${u.vout}`} className="font-mono text-xs">
                    <Link href={buildAcpTxHref(u.txid)} className="text-emerald-300 hover:underline">
                      {u.txid}:{u.vout}
                    </Link>{" "}
                    <span className="text-white/60">{u.acp} ACP</span>
                  </li>
                ))
              )}
            </ul>

            <h2 className="mt-8 text-lg font-semibold">{t("explorerPage.history")}</h2>
            <p className="mt-1 text-xs text-white/45">
              {t("explorerPage.indexHeight")}: {data.index_height ?? "—"} · total {data.history_total ?? 0}
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {(data.history || []).length === 0 ? (
                <li className="text-white/45">{t("explorerPage.noHistory")}</li>
              ) : (
                (data.history || []).map((h: any, i: number) => (
                  <li key={`${h.txid}-${i}`} className="flex flex-wrap gap-2 font-mono text-xs">
                    <span className="text-white/45">{h.direction}</span>
                    <Link href={buildAcpTxHref(h.txid)} className="text-emerald-300 hover:underline">
                      {h.txid.slice(0, 18)}…
                    </Link>
                    <span>{h.amount_acp} ACP</span>
                    <span className="text-white/40">h={h.height ?? "—"}</span>
                  </li>
                ))
              )}
            </ul>
            {data.next_offset != null ? (
              <button
                type="button"
                className="mt-4 rounded-md border border-white/15 px-3 py-2 text-sm"
                onClick={() => setOffset(data.next_offset)}
              >
                {t("explorerPage.loadMore")}
              </button>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
