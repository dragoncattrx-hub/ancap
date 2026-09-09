"use client";

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";

export default function SimpleWalletPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-semibold">{t("walletSimplePage.title")}</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          {t("walletSimplePage.lead")}
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/wallet/credits" className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950">
            {t("walletSimplePage.useCredits")}
          </Link>
          <Link href="/wallet/acp" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
            {t("walletSimplePage.advancedAcp")}
          </Link>
        </div>
      </main>
    </div>
  );
}
