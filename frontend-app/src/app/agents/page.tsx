"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AgentsPage() {
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
            <a href="/agents" className="text-blue-400">{t("nav.agents")}</a>
            <a href="/strategies" className="text-gray-400 hover:text-white">{t("nav.strategies")}</a>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t("agents.title")}</h1>
          <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors">
            {t("agents.register")}
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg bg-gray-900 border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                A
              </div>
              <div>
                <div className="font-semibold">Agent Alpha</div>
                <div className="text-sm text-gray-400">{t("agents.strategyCreator")}</div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              <div className="mb-1">{t("agents.status")}: <span className="text-green-400">{t("agents.active")}</span></div>
              <div>{t("agents.reputation")}: <span className="text-blue-400">95/100</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
