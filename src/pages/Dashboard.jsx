import { Search, AlertTriangle, Lock, Lightbulb } from 'lucide-react';

export default function Dashboard() {
  const suggestedQueries = [
    'Find all contracts with CenCore',
    'Show me Q3 financial reports',
    'What documents mention security clearances?',
  ];

  const recentActivity = [
    {
      id: 1,
      title: 'Organized 15 files',
      description: 'Sorted invoices into /Finance/Invoices/2024/',
      time: '2 minutes ago',
      color: 'border-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      id: 2,
      title: 'Classified 8 contracts',
      description: 'Moved to /Legal/Contracts/Active/',
      time: '15 minutes ago',
      color: 'border-green-500',
      bgColor: 'bg-green-50',
    },
    {
      id: 3,
      title: 'Renamed 22 files',
      description: 'Applied naming convention: [Date]_[Type]_[Client]',
      time: '1 hour ago',
      color: 'border-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  const smartSuggestions = [
    {
      id: 1,
      type: 'warning',
      icon: AlertTriangle,
      title: 'Found 12 duplicate files',
      description: 'Review and remove duplicates to save 45 MB',
      action: 'Review',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      actionColor: 'text-yellow-700 hover:text-yellow-800',
    },
    {
      id: 2,
      type: 'error',
      icon: Lock,
      title: 'Sensitive file detected: Payroll_2024.xlsx',
      description: 'Currently accessible by 15 users',
      action: 'Review Access',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      actionColor: 'text-red-700 hover:text-red-800',
    },
    {
      id: 3,
      type: 'info',
      icon: Lightbulb,
      title: 'New sorting recipe suggested',
      description: 'Tax documents could be organized by fiscal quarter',
      action: 'View Suggestion',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      actionColor: 'text-blue-700 hover:text-blue-800',
    },
  ];

  return (
    <div className="p-8">
      {/* Page Header */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for information or ask a question..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Suggested Queries */}
        <div className="flex flex-wrap gap-2 mt-4">
          {suggestedQueries.map((query, index) => (
            <button
              key={index}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Live
              </span>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className={`${activity.bgColor} border-l-4 ${activity.color} p-4 rounded-r-lg`}
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Suggestions */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Smart Suggestions</h2>

            <div className="space-y-4">
              {smartSuggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <div
                    key={suggestion.id}
                    className={`${suggestion.bgColor} border ${suggestion.borderColor} p-4 rounded-lg`}
                  >
                    <div className="flex items-start">
                      <Icon className={`w-5 h-5 ${suggestion.iconColor} mr-3 mt-0.5 flex-shrink-0`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{suggestion.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                        <button className={`text-sm font-medium ${suggestion.actionColor}`}>
                          {suggestion.action} →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
