import StatCard from '@/components/ui/StatCard'

const progressMetrics = [
  { title: 'Campaigns Active', value: '4', change: '2 pending approval', changeType: 'neutral' as const },
  { title: 'Target Accounts', value: '127', change: '+23 this week', changeType: 'positive' as const },
  { title: 'Outreach Sequences', value: '12', change: '89% response rate', changeType: 'positive' as const },
  { title: 'Pipeline Value', value: '$284K', change: '+$42K MTD', changeType: 'positive' as const },
]

const agentPerformance = [
  { name: 'Research Agent', status: 'active', tasks: 47, successRate: '94%', lastActive: '2 min ago' },
  { name: 'Outreach Agent', status: 'active', tasks: 32, successRate: '87%', lastActive: '5 min ago' },
  { name: 'Analysis Agent', status: 'idle', tasks: 18, successRate: '91%', lastActive: '1 hour ago' },
]

const campaigns = [
  { name: 'Enterprise SaaS Push', status: 'active', progress: 67, accounts: 45, responses: 23 },
  { name: 'Mid-Market Expansion', status: 'active', progress: 34, accounts: 82, responses: 15 },
  { name: 'Partner Outreach Q1', status: 'pending', progress: 12, accounts: 28, responses: 3 },
  { name: 'Champion Identification', status: 'completed', progress: 100, accounts: 15, responses: 8 },
]

export default function GTMHubPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">GTM Hub</h1>
        <p className="mt-1 text-gray-400">Go-to-market operations and agent orchestration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {progressMetrics.map((metric) => (
          <StatCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            changeType={metric.changeType}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Agent Performance</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {agentPerformance.map((agent) => (
              <div key={agent.name} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{agent.name}</p>
                    <p className="text-xs text-gray-400">{agent.tasks} tasks completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{agent.successRate}</p>
                  <p className="text-xs text-gray-400">{agent.lastActive}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Campaign Overview</h3>
            <button className="text-sm text-gray-400 hover:text-white transition-colors">View All</button>
          </div>
          <div className="divide-y divide-gray-800">
            {campaigns.map((campaign) => (
              <div key={campaign.name} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">{campaign.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    campaign.status === 'active' ? 'bg-green-500/10 text-green-400' :
                    campaign.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-gray-500/10 text-gray-400'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2">
                  <div 
                    className={`h-1.5 rounded-full ${
                      campaign.status === 'completed' ? 'bg-green-400' : 'bg-white'
                    }`}
                    style={{ width: `${campaign.progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{campaign.accounts} accounts</span>
                  <span>{campaign.responses} responses</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-900 rounded-lg border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Recent GTM Activity</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">Research Completed</p>
              <p className="mt-1 text-lg font-semibold text-white">Acme Corp analysis ready</p>
              <p className="mt-2 text-xs text-gray-500">15 min ago</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">Outreach Sent</p>
              <p className="mt-1 text-lg font-semibold text-white">12 personalized emails</p>
              <p className="mt-2 text-xs text-gray-500">1 hour ago</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">Response Received</p>
              <p className="mt-1 text-lg font-semibold text-white">TechStart Inc. replied</p>
              <p className="mt-2 text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
