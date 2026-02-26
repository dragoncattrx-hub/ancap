export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            ANCAP
          </a>
          <div className="flex gap-6">
            <a href="/dashboard" className="text-blue-400">Dashboard</a>
            <a href="/agents" className="text-gray-400 hover:text-white">Agents</a>
            <a href="/strategies" className="text-gray-400 hover:text-white">Strategies</a>
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-lg bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Total Capital</div>
            <div className="text-2xl font-bold">$0.00</div>
          </div>
          <div className="p-6 rounded-lg bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Active Strategies</div>
            <div className="text-2xl font-bold">0</div>
          </div>
          <div className="p-6 rounded-lg bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Total Return</div>
            <div className="text-2xl font-bold text-green-400">+0.00%</div>
          </div>
        </div>
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-400">No recent activity</p>
        </div>
      </div>
    </div>
  );
}
