interface ActivityItem {
  id: string
  type: 'agent' | 'content' | 'analysis' | 'system'
  message: string
  timestamp: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

const typeConfig = {
  agent: {
    label: 'Agent',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
  },
  content: {
    label: 'Content',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/20',
  },
  analysis: {
    label: 'Analysis',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/20',
  },
  system: {
    label: 'System',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500/20',
  },
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="px-6 py-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-800">
        {activities.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => {
            const config = typeConfig[activity.type]
            return (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 px-2 py-0.5 text-xs font-medium rounded ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
                      {config.label}
                    </span>
                    <p className="text-sm text-white">{activity.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {activity.timestamp}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
