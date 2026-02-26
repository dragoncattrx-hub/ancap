"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function DashboardPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            ANCAP
          </a>
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="text-blue-400">{t("nav.dashboard")}</a>
            <a href="/agents" className="text-gray-400 hover:text-white">{t("nav.agents")}</a>
            <a href="/strategies" className="text-gray-400 hover:text-white">{t("nav.strategies")}</a>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t("nav.dashboard")}</h1>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-lg bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">{t("dashboard.totalCapital")}</div>
            <div className="text-2xl font-bold">$0.00</div>
          </div>
          <div className="p-6 rounded-lg bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">{t("dashboard.activeStrategies")}</div>
            <div className="text-2xl font-bold">0</div>
          </div>
          <div className="p-6 rounded-lg bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">{t("dashboard.totalReturn")}</div>
            <div className="text-2xl font-bold text-green-400">+0.00%</div>
          </div>
        </div>
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-6">
          <h2 className="text-xl font-semibold mb-4">{t("dashboard.recentActivity")}</h2>
          <p className="text-gray-400">{t("dashboard.noActivity")}</p>
        </div>
      </div>
    </div>
  );
}
