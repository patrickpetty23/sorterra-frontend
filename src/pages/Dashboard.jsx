import { useState } from 'react';
import { Home, ClipboardList, Settings, Search, AlertTriangle, Lock, Zap } from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  const exampleQueries = [
    'Find all contracts with CenCore',
    'Show me Q3 financial reports',
    'What documents mention security clearances?'
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Organized 15 files',
      details: 'Sorted invoices into /Finance/Invoices/2024/',
      time: '2 minutes ago',
      color: 'blue'
    },
    {
      id: 2,
      action: 'Classified 8 contracts',
      details: 'Moved to /Legal/Contracts/Active/',
      time: '15 minutes ago',
      color: 'green'
    },
    {
      id: 3,
      action: 'Renamed 22 files',
      details: 'Applied naming convention: [Date]_[Type]_[Client]',
      time: '1 hour ago',
      color: 'purple'
    }
  ];

  const suggestions = [
    {
      id: 1,
      type: 'warning',
      icon: AlertTriangle,
      title: 'Found 12 duplicate files',
      description: 'Review and remove duplicates to save 45 MB',
      action: 'Review',
      color: '#FEF3C7',
      textColor: '#92400E'
    },
    {
      id: 2,
      type: 'alert',
      icon: Lock,
      title: 'Sensitive file detected: Payroll_2024.xlsx',
      description: 'Currently accessible by 15 users',
      action: 'Review Access',
      color: '#FEE2E2',
      textColor: '#991B1B'
    },
    {
      id: 3,
      type: 'info',
      icon: Zap,
      title: 'New sorting recipe suggested',
      description: 'AI suggests sorting contracts by client and quarter',
      action: 'Review Recipe',
      color: '#DBEAFE',
      textColor: '#1E40AF'
    }
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6V4a2 2 0 012-2h3l2 3h7a2 2 0 012 2v1" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="sidebar-brand">Sorterra</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-item active">
            <Home size={20} />
            <span>Dashboard</span>
          </a>
          <a href="/recipes" className="nav-item">
            <ClipboardList size={20} />
            <span>Recipes</span>
          </a>
          <a href="/settings" className="nav-item">
            <Settings size={20} />
            <span>Settings</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="organization-badge">
            <div className="org-avatar">CC</div>
            <div className="org-info">
              <div className="org-name">CenCore Legal</div>
              <div className="org-status">Connected</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="dashboard-header">
          <h1>Dashboard</h1>
        </header>

        {/* Search Section */}
        <div className="search-section card">
          <div className="search-bar">
            <Search size={20} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Search for information or ask a question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="example-queries">
            {exampleQueries.map((query, idx) => (
              <button key={idx} className="example-query" onClick={() => setSearchQuery(query)}>
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* Activity and Suggestions Grid */}
        <div className="dashboard-grid">
          {/* Recent Activity */}
          <div className="card activity-card">
            <div className="card-header">
              <h2>Recent Activity</h2>
              <span className="live-badge">Live</span>
            </div>
            <div className="activity-list">
              {recentActivity.map((item) => (
                <div key={item.id} className={`activity-item activity-${item.color}`}>
                  <div className="activity-content">
                    <h3>{item.action}</h3>
                    <p>{item.details}</p>
                    <span className="activity-time">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Suggestions */}
          <div className="card suggestions-card">
            <div className="card-header">
              <h2>Smart Suggestions</h2>
            </div>
            <div className="suggestions-list">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <div
                    key={suggestion.id}
                    className="suggestion-item"
                    style={{ backgroundColor: suggestion.color }}
                  >
                    <div className="suggestion-icon" style={{ color: suggestion.textColor }}>
                      <Icon size={20} />
                    </div>
                    <div className="suggestion-content">
                      <h3 style={{ color: suggestion.textColor }}>{suggestion.title}</h3>
                      <p style={{ color: suggestion.textColor, opacity: 0.8 }}>
                        {suggestion.description}
                      </p>
                      <button className="suggestion-action" style={{ color: suggestion.textColor }}>
                        {suggestion.action}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
