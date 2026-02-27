import StatCard from '@/components/ui/StatCard'
import ActivityFeed from '@/components/ui/ActivityFeed'
import Link from 'next/link'

const stats = [
  { title: 'Active Agents', value: '1', change: 'LinkedIn/𝕏 Content Writer', changeType: 'positive' as const },
  { title: 'Formats in Skills', value: '—', change: 'Grow by analyzing posts', changeType: 'neutral' as const },
  { title: 'Posts Generated', value: '0', change: 'Start creating content', changeType: 'neutral' as const },
  { title: 'GTM Campaigns', value: '4', change: '2 active this week', changeType: 'positive' as const },
]

const recentActivity = [
  { id: '1', type: 'agent' as const, message: 'LinkedIn/𝕏 Content Writer Agent activated — powered by z-ai/glm-5', timestamp: 'Just now' },
  { id: '2', type: 'system' as const, message: 'Cloudflare Zero Trust middleware configured for razvan@razvantoma.com', timestamp: 'Just now' },
  { id: '3', type: 'agent' as const, message: 'Apify LinkedIn scraper integration connected', timestamp: 'Just now' },
  { id: '4', type: 'content' as const, message: 'Agent Skills system initialized — ready to learn from viral posts', timestamp: 'Just now' },
  { id: '5', type: 'analysis' as const, message: 'Format learning pipeline ready: Apify → z-ai/glm-5 → Agent Skills', timestamp: 'Just now' },
  { id: '6', type: 'content' as const, message: 'Conversational content generation interface live', timestamp: 'Just now' },
]

export default function AdminPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Command Center</h1>
        <p className="mt-1 text-gray-400">Welcome back, Razvan. Your AI GTM agents are ready.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={recentActivity} />

        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Active Agents</h3>
          </div>
          <div className="p-6 space-y-3">
            {/* Content Writer Agent Card */}
            <Link
              href="/admin/content-writer"
              className="block p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm font-semibold text-white">LinkedIn/𝕏 Content Writer</span>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
              <p className="text-xs text-gray-400 ml-5">Learns viral formats from LinkedIn posts · Creates content on demand</p>
              <div className="flex items-center gap-2 ml-5 mt-2">
                <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">Apify</span>
                <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">z-ai/glm-5</span>
                <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded">OpenRouter</span>
              </div>
            </Link>

            {/* Placeholder for future agents */}
            <div className="p-4 bg-gray-800/40 rounded-lg border border-gray-700/50 border-dashed">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-600" />
                <span className="text-sm text-gray-600">More agents coming soon…</span>
              </div>
              <p className="text-xs text-gray-600 ml-5 mt-1">ICP Research · Outreach · Reporting</p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-800">
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/admin/content-writer"
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 text-left transition-colors"
              >
                <span className="text-sm font-medium text-white">Write a Post</span>
                <p className="mt-1 text-xs text-gray-400">Open Content Writer</p>
              </Link>
              <Link
                href="/admin/gtm-hub"
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 text-left transition-colors"
              >
                <span className="text-sm font-medium text-white">GTM Hub</span>
                <p className="mt-1 text-xs text-gray-400">View campaigns</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
