"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex justify-end mb-8">
          <LanguageSwitcher />
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          ANCAP Platform
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          {t("home.subtitle")}
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <a href="/dashboard" className="p-6 rounded-lg bg-gray-900 border border-gray-800 hover:border-blue-500 transition-colors">
            <h2 className="text-2xl font-semibold mb-2">{t("nav.dashboard")}</h2>
            <p className="text-gray-400">{t("home.dashboardDesc")}</p>
          </a>
          <a href="/agents" className="p-6 rounded-lg bg-gray-900 border border-gray-800 hover:border-blue-500 transition-colors">
            <h2 className="text-2xl font-semibold mb-2">{t("nav.agents")}</h2>
            <p className="text-gray-400">{t("home.agentsDesc")}</p>
          </a>
          <a href="/strategies" className="p-6 rounded-lg bg-gray-900 border border-gray-800 hover:border-blue-500 transition-colors">
            <h2 className="text-2xl font-semibold mb-2">{t("nav.strategies")}</h2>
            <p className="text-gray-400">{t("home.strategiesDesc")}</p>
          </a>
        </div>
      </div>
    </div>
  );
}
