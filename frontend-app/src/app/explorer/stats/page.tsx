"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { acpExplorer } from "@/lib/api";

export default function ExplorerStatsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setData(await acpExplorer.stats());
      } catch (err) {
        setError(err instanceof Error ? err.message : t("explorerPage.errUnavailable"));
      }
    })();
  }, [t]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/explorer" className="text-sm text-emerald-300 hover:underline">
          {t("explorerPage.backExplorer")}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{t("explorerPage.statsTitle")}</h1>
        <p className="mt-2 text-sm text-white/55">{t("explorerPage.statsLead")}</p>
        {error ? <p className="mt-4 text-amber-200">{error}</p> : null}
        {data ? (
          <div className="mt-6 space-y-4">
            <StatBlock title={t("explorerPage.chain")} value={data.chain} />
            <StatBlock title="UTXO set" value={data.txoutset} />
            <StatBlock title={t("explorerPage.index")} value={data.index} />
            <StatBlock title={t("explorerPage.freeDist")} value={data.free_distribution} />
            <StatBlock title="Tokenomics" value={data.tokenomics} />
            <p className="text-sm">
              <Link href="/markets" className="text-emerald-300 hover:underline">
                {t("explorerPage.marketsLink")}
              </Link>
              {" · "}
              <Link href="/acp-supply" className="text-emerald-300 hover:underline">
                ACP supply
              </Link>
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function StatBlock({ title, value }: { title: string; value: unknown }) {
  if (value == null) return null;
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-sm font-semibold text-white/80">{title}</h2>
      <pre className="mt-3 overflow-x-auto text-xs text-white/65">{JSON.stringify(value, null, 2)}</pre>
    </section>
  );
}
