"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { acpExplorer } from "@/lib/api";
import { buildAcpAddressHref, buildAcpBlockHref, sanitizeAcpTxid } from "@/lib/acpExplorer";

type TxIo = { address?: string | null; units: string; acp: string; vout?: number | null };

export default function ExplorerTxPage() {
  const { t } = useLanguage();
  const params = useParams<{ txid: string }>();
  const rawTxid = decodeURIComponent(params?.txid || "").trim();
  const txid = useMemo(() => sanitizeAcpTxid(rawTxid), [rawTxid]);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [redacted, setRedacted] = useState(false);

  useEffect(() => {
    if (!txid) return;
    void (async () => {
      try {
        setData(await acpExplorer.getTx(txid, redacted ? "redacted" : "full"));
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("explorerPage.errUnavailable"));
      }
    })();
  }, [txid, redacted, t]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/explorer" className="text-sm text-emerald-300 hover:underline">
          {t("explorerPage.backExplorer")}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{t("explorerPage.txTitle")}</h1>
        <p className="mt-2 break-all font-mono text-xs text-white/55">{txid || rawTxid}</p>

        <button
          type="button"
          className="mt-4 rounded-md border border-white/15 px-3 py-2 text-sm"
          onClick={() => setRedacted((v) => !v)}
        >
          {redacted ? t("explorerPage.showFull") : t("explorerPage.showRedacted")}
        </button>

        {error ? <p className="mt-4 text-amber-200">{error}</p> : null}

        {data ? (
          <>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-white/45">{t("explorerPage.status")}</dt>
                <dd className="mt-1">{data.status}</dd>
              </div>
              <div>
                <dt className="text-white/45">{t("explorerPage.confirmations")}</dt>
                <dd className="mt-1 font-mono">{data.confirmations ?? 0}</dd>
              </div>
              <div>
                <dt className="text-white/45">{t("explorerPage.colHeight")}</dt>
                <dd className="mt-1">
                  {data.block_height != null ? (
                    <Link href={buildAcpBlockHref(data.block_height)} className="font-mono text-emerald-300 hover:underline">
                      {data.block_height}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-white/45">{t("explorerPage.fee")}</dt>
                <dd className="mt-1 font-mono">{data.fee_acp ?? "—"} ACP</dd>
              </div>
            </dl>

            <section className="mt-8">
              <h2 className="text-lg font-semibold">{t("explorerPage.inputs")}</h2>
              <IoTable rows={data.inputs || []} />
            </section>
            <section className="mt-8">
              <h2 className="text-lg font-semibold">{t("explorerPage.outputs")}</h2>
              <IoTable rows={data.outputs || []} />
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

function IoTable({ rows }: { rows: TxIo[] }) {
  if (!rows.length) return <p className="mt-2 text-sm text-white/45">—</p>;
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/[0.03] text-white/50">
          <tr>
            <th className="px-3 py-2">Address</th>
            <th className="px-3 py-2">ACP</th>
            <th className="px-3 py-2">vout</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.address}-${i}`} className="border-t border-white/8">
              <td className="px-3 py-2">
                {r.address ? (
                  <Link href={buildAcpAddressHref(r.address)} className="break-all font-mono text-xs text-emerald-300 hover:underline">
                    {r.address}
                  </Link>
                ) : (
                  <span className="text-white/40">—</span>
                )}
              </td>
              <td className="px-3 py-2 font-mono">{r.acp}</td>
              <td className="px-3 py-2 font-mono">{r.vout ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
