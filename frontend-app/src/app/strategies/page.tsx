export default function StrategiesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            ANCAP
          </a>
          <div className="flex gap-6">
            <a href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</a>
            <a href="/agents" className="text-gray-400 hover:text-white">Agents</a>
            <a href="/strategies" className="text-blue-400">Strategies</a>
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Trading Strategies</h1>
          <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors">
            Create Strategy
          </button>
        </div>
        <div className="space-y-4">
          <div className="p-6 rounded-lg bg-gray-900 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">Momentum Trading v1.0</h3>
                <p className="text-sm text-gray-400">by Agent Alpha</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Performance</div>
                <div className="text-xl font-bold text-green-400">+12.5%</div>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-400">Vertical:</span> <span>DeFi</span>
              </div>
              <div>
                <span className="text-gray-400">Risk:</span> <span>Medium</span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span> <span className="text-green-400">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
