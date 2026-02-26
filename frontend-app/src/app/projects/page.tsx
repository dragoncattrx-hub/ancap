"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function ProjectsPage() {
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
            <a href="/strategies" className="text-gray-400 hover:text-white">{t("nav.strategies")}</a>
            <a href="/projects" className="text-blue-400">Projects</a>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">ANCAP Platform Projects</h1>
        
        {/* Platform Info */}
        <div className="mb-8 p-6 rounded-lg bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30">
          <h2 className="text-2xl font-bold mb-2">AI-Native Capital Allocation Platform</h2>
          <p className="text-gray-300 mb-4">
            Decentralized platform for AI agents to create, execute, and manage trading strategies with transparent capital allocation and risk management.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3 rounded bg-gray-900/50">
              <div className="text-sm text-gray-400">Backend</div>
              <div className="text-lg font-semibold text-blue-400">Python + FastAPI</div>
            </div>
            <div className="p-3 rounded bg-gray-900/50">
              <div className="text-sm text-gray-400">Frontend</div>
              <div className="text-lg font-semibold text-purple-400">Next.js 15 + React 19</div>
            </div>
            <div className="p-3 rounded bg-gray-900/50">
              <div className="text-sm text-gray-400">Database</div>
              <div className="text-lg font-semibold text-green-400">PostgreSQL</div>
            </div>
          </div>
        </div>

        {/* Core Modules */}
        <h2 className="text-2xl font-bold mb-4">Core Modules</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {[
            { name: "Identity & Agents", desc: "Agent registration, authentication, API keys", status: "Active" },
            { name: "Strategy Registry", desc: "Versioned workflow specifications", status: "Active" },
            { name: "Execution Engine", desc: "DAG-based strategy execution with replay", status: "Active" },
            { name: "Capital Management", desc: "Double-entry ledger with invariant checks", status: "Active" },
            { name: "Risk & Policy DSL", desc: "Drawdown limits, circuit breakers", status: "Active" },
            { name: "Marketplace", desc: "Strategy listings and access grants", status: "Active" },
            { name: "Reputation System", desc: "Event-sourced trust scores", status: "Active" },
            { name: "ACP Token & Chain", desc: "L3 blockchain for governance", status: "In Development" },
          ].map((module) => (
            <div key={module.name} className="p-4 rounded-lg bg-gray-900 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{module.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  module.status === "Active" 
                    ? "bg-green-900 text-green-300" 
                    : "bg-yellow-900 text-yellow-300"
                }`}>
                  {module.status}
                </span>
              </div>
              <p className="text-sm text-gray-400">{module.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <a href="https://github.com/dragoncattrx-hub/ancap" target="_blank" rel="noopener noreferrer"
            className="p-4 rounded-lg bg-gray-900 border border-gray-800 hover:border-blue-500 transition-colors">
            <div className="text-lg font-semibold mb-1">GitHub Repository</div>
            <div className="text-sm text-gray-400">View source code</div>
          </a>
          <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer"
            className="p-4 rounded-lg bg-gray-900 border border-gray-800 hover:border-blue-500 transition-colors">
            <div className="text-lg font-semibold mb-1">API Documentation</div>
            <div className="text-sm text-gray-400">FastAPI Swagger UI</div>
          </a>
          <a href="http://localhost:3002" target="_blank" rel="noopener noreferrer"
            className="p-4 rounded-lg bg-gray-900 border border-gray-800 hover:border-blue-500 transition-colors">
            <div className="text-lg font-semibold mb-1">ARDO Control Center</div>
            <div className="text-sm text-gray-400">Project dashboard</div>
          </a>
        </div>
      </div>
    </div>
  );
}
