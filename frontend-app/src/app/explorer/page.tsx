"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { acpExplorer } from "@/lib/api";
import { buildAcpTxHref } from "@/lib/acpExplorer";

function CopyableHash({ value, copyLabel, copiedLabel, copyAria }: { value: string | null | undefined; copyLabel: string; copiedLabel: string; copyAria: (hash: string) => string }) {
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

  if (!hash) {
    return <span className="text-white/45">—</span>;
  }

  return (
    <div className="flex min-w-[240px] items-start gap-2">
      <span className="break-all font-mono text-xs leading-5 text-white/75">{hash}</span>
      <button
        type="button"
        onClick={() => void onCopy()}
        className="shrink-0 rounded-md border border-white/12 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/[0.08]"
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
  const [efficiency, setEfficiency] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [searchTx, setSearchTx] = useState("");
  const [searchAddr, setSearchAddr] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [s, b, e] = await Promise.all([
          acpExplorer.status(),
          acpExplorer.blocks(12),
          acpExplorer.efficiency().catch(() => null),
        ]);
        setStatus(s);
        setBlocks(b.items || []);
        setEfficiency(e);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("explorerPage.errUnavailable"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const txid = searchTx.trim();
    if (!txid) return;
    window.location.href = buildAcpTxHref(txid, "/explorer/tx");
  }

  function onAddressSearch(event: FormEvent) {
    event.preventDefault();
    const addr = searchAddr.trim();
    if (!addr) return;
    window.location.href = `/explorer/address/${encodeURIComponent(addr)}`;
  }

  const copyProps = {
    copyLabel: t("explorerPage.copy"),
    copiedLabel: t("explorerPage.copied"),
    copyAria: (hash: string) => t("explorerPage.copyHashAria").replace("{hash}", hash),
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-semibold">{t("explorerPage.title")}</h1>
        <p className="mt-2 text-sm text-white/65">{t("explorerPage.subtitle")}</p>
        {error ? <p className="mt-4 text-amber-200">{error}</p> : null}
        {status ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
            <div>{t("explorerPage.chainId")}: {status.chain_id}</div>
            <div className="mt-1">{t("explorerPage.height")}: {status.block_height}</div>
            <div className="mt-1">
              <span className="text-white/55">{t("explorerPage.bestHash")}:</span>
              <div className="mt-1">
                <CopyableHash value={status.best_block_hash} {...copyProps} />
              </div>
            </div>
            {status.lean ? (
              <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 text-white/70 sm:grid-cols-2">
                <div>{t("explorerPage.profile")}: {status.lean.protocol_profile}</div>
                <div>{t("explorerPage.energy")}: {status.lean.energy_model}</div>
                <div>{t("explorerPage.security")}: {status.lean.signing_security}</div>
                <div className="break-words">
                  {t("explorerPage.encryption")}: {status.lean.encryption_security}
                  {status.lean.encryption_status ? ` · ${status.lean.encryption_status}` : ""}
                </div>
                <div>
                  {t("explorerPage.cadence")
                    .replace("{sec}", String(status.lean.target_block_time_sec))
                    .replace("{tps}", String(status.lean.design_tps_hint))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {efficiency?.market_alignment_2026 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {(
              [
                [t("explorerPage.colSecurity"), efficiency.market_alignment_2026.security],
                [t("explorerPage.colSpeed"), efficiency.market_alignment_2026.speed],
                [t("explorerPage.colEnergy"), efficiency.market_alignment_2026.energy],
              ] as const
            ).map(([title, items]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <h2 className="text-sm font-semibold text-emerald-300">{title}</h2>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-white/60">
                  {(items as string[]).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
        <form onSubmit={onSearch} className="mt-6 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            placeholder={t("explorerPage.searchTxPlaceholder")}
            value={searchTx}
            onChange={(e) => setSearchTx(e.target.value)}
          />
          <button type="submit" className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
            {t("explorerPage.searchTxBtn")}
          </button>
        </form>
        <form onSubmit={onAddressSearch} className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            placeholder={t("explorerPage.searchAddrPlaceholder")}
            value={searchAddr}
            onChange={(e) => setSearchAddr(e.target.value)}
          />
          <button type="submit" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold">
            {t("explorerPage.searchAddrBtn")}
          </button>
        </form>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t("explorerPage.latestBlocks")}</h2>
          {loading ? <p className="mt-4 text-sm text-white/55">{t("explorerPage.loadingBlocks")}</p> : null}
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-white/60">
                <tr>
                  <th className="px-4 py-3">{t("explorerPage.colHeight")}</th>
                  <th className="px-4 py-3">{t("explorerPage.colHash")}</th>
                  <th className="px-4 py-3">{t("explorerPage.colTxCount")}</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((row) => (
                  <tr key={row.height} className="border-t border-white/10">
                    <td className="px-4 py-3">{row.height}</td>
                    <td className="px-4 py-3">
                      <CopyableHash value={row.hash} {...copyProps} />
                    </td>
                    <td className="px-4 py-3">{row.tx_count ?? 0}</td>
                  </tr>
                ))}
                {!loading && blocks.length === 0 ? (
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-3 text-white/55" colSpan={3}>
                      {t("explorerPage.noBlocks")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
        <Link href="/reserves" className="mt-6 inline-block text-sm text-emerald-300">
          {t("explorerPage.viewReserves")}
        </Link>
      </main>
    </div>
  );
}
