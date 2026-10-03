"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { acpExplorer } from "@/lib/api";
import { buildAcpAddressHref, buildAcpBlockHref, buildAcpTxHref } from "@/lib/acpExplorer";

function CopyableHash({
  value,
  copyLabel,
  copiedLabel,
  copyAria,
}: {
  value: string | null | undefined;
  copyLabel: string;
  copiedLabel: string;
  copyAria: (hash: string) => string;
}) {
  const hash = String(value || "").trim();
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [hash]);
  if (!hash) return <span className="text-white/45">—</span>;
  return (
    <div className="flex min-w-[200px] items-start gap-2">
      <span className="break-all font-mono text-xs leading-5 text-white/75">{hash}</span>
      <button
        type="button"
        onClick={() => void onCopy()}
        className="shrink-0 rounded-md border border-white/12 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/80"
        aria-label={copyAria(hash)}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

export default function ExplorerPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [mempoolSize, setMempoolSize] = useState<number | null>(null);
  const [latestTxs, setLatestTxs] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [s, b, m] = await Promise.all([
          acpExplorer.status(),
          acpExplorer.blocks(14),
          acpExplorer.mempool().catch(() => null),
        ]);
        setStatus(s);
        setBlocks(b.items || []);
        const size = m?.info?.size ?? m?.info?.count ?? m?.txids?.length;
        setMempoolSize(typeof size === "number" ? size : m?.txids?.length ?? null);
        const tip = (b.items || [])[0];
        if (tip?.hash) {
          try {
            const detail = await acpExplorer.getBlock(String(tip.height));
            setLatestTxs((detail.txids || []).slice(0, 8));
          } catch {
            setLatestTxs([]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("explorerPage.errUnavailable"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    const query = q.trim();
    if (!query) return;
    try {
      const res = await acpExplorer.search(query);
      if (res.canonical_path) {
        window.location.href = res.canonical_path;
        return;
      }
      setError(t("explorerPage.searchMiss"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("explorerPage.searchMiss"));
    }
  }

  const copyLabel = t("explorerPage.copy");
  const copiedLabel = t("explorerPage.copied");
  const copyAria = (hash: string) => t("explorerPage.copyHashAria").replace("{hash}", hash);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">ANCAP</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("explorerPage.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/65">{t("explorerPage.subtitle")}</p>

        <form onSubmit={onSearch} className="mt-8 flex flex-col gap-2 sm:flex-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("explorerPage.searchPlaceholder")}
            className="min-w-0 flex-1 rounded-lg border border-white/12 bg-black/30 px-3 py-2.5 font-mono text-sm outline-none ring-emerald-400/30 focus:ring"
          />
          <button type="submit" className="rounded-lg bg-emerald-500/90 px-4 py-2.5 text-sm font-semibold text-black">
            {t("explorerPage.searchBtn")}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-amber-200">{error}</p> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <div className="text-white/50">{t("explorerPage.height")}</div>
            <div className="mt-1 text-xl font-semibold">{status?.block_height ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <div className="text-white/50">{t("explorerPage.chainId")}</div>
            <div className="mt-1 text-xl font-semibold">{status?.chain_id ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <div className="text-white/50">{t("explorerPage.mempool")}</div>
            <div className="mt-1 text-xl font-semibold">{mempoolSize ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <div className="text-white/50">{t("explorerPage.bestHash")}</div>
            <div className="mt-2">
              <CopyableHash
                value={status?.best_block_hash}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                copyAria={copyAria}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/explorer/mempool" className="text-emerald-300 underline-offset-2 hover:underline">
            {t("explorerPage.navMempool")}
          </Link>
          <Link href="/explorer/stats" className="text-emerald-300 underline-offset-2 hover:underline">
            {t("explorerPage.navStats")}
          </Link>
          <Link href="/reserves" className="text-emerald-300 underline-offset-2 hover:underline">
            {t("explorerPage.viewReserves")}
          </Link>
          <Link href="/docs/acp/explorer" className="text-emerald-300 underline-offset-2 hover:underline">
            {t("explorerPage.navDocs")}
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">{t("explorerPage.latestBlocks")}</h2>
          {loading ? <p className="mt-4 text-sm text-white/55">{t("explorerPage.loadingBlocks")}</p> : null}
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-white/55">
                <tr>
                  <th className="px-4 py-3">{t("explorerPage.colHeight")}</th>
                  <th className="px-4 py-3">{t("explorerPage.colHash")}</th>
                  <th className="px-4 py-3">{t("explorerPage.colTxCount")}</th>
                  <th className="px-4 py-3">{t("explorerPage.colTime")}</th>
                </tr>
              </thead>
              <tbody>
                {blocks.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-white/45">
                      {t("explorerPage.noBlocks")}
                    </td>
                  </tr>
                ) : null}
                {blocks.map((b) => (
                  <tr key={b.height} className="border-t border-white/8">
                    <td className="px-4 py-3">
                      <Link href={buildAcpBlockHref(b.height)} className="font-mono text-emerald-300 hover:underline">
                        {b.height}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={buildAcpBlockHref(b.hash || b.height)} className="font-mono text-xs text-white/70 hover:underline">
                        {b.hash ? `${String(b.hash).slice(0, 18)}…` : "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{b.tx_count}</td>
                    <td className="px-4 py-3 text-white/55">{b.time ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">{t("explorerPage.latestTxs")}</h2>
          <ul className="mt-4 space-y-2">
            {latestTxs.length === 0 ? (
              <li className="text-sm text-white/45">{t("explorerPage.noTxs")}</li>
            ) : (
              latestTxs.map((txid) => (
                <li key={txid}>
                  <Link href={buildAcpTxHref(txid)} className="break-all font-mono text-xs text-emerald-300 hover:underline">
                    {txid}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        <p className="mt-10 text-xs text-white/40">
          Tip: paste height, block hash, txid, or <code className="font-mono">acp1…</code> address —{" "}
          <Link href={buildAcpAddressHref("acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz")} className="text-white/55 underline">
            bridge reserve example
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
