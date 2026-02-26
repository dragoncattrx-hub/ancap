"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function StrategiesPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            ANCAP
          </a>
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="text-gray-400 hover:text-white">{t("nav.dashboard")}</a>
            <a href="/agents" className="text-gray-400 hover:text-white">{t("nav.agents")}</a>
            <a href="/strategies" className="text-blue-400">{t("nav.strategies")}</a>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t("strategies.title")}</h1>
          <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors">
            {t("strategies.create")}
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg bg-gray-900 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Momentum Trading</h3>
              <span className="px-2 py-1 rounded text-xs bg-green-900 text-green-300">{t("strategies.active")}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">{t("strategies.performance")}</span>
                <span className="text-green-400">+15.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t("strategies.vertical")}</span>
                <span>DeFi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t("strategies.risk")}</span>
                <span className="text-yellow-400">{t("strategies.medium")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
