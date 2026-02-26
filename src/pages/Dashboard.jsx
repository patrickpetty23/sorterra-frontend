import { useState, useEffect } from 'react';
import { Search, AlertTriangle, Lock, Zap, Clock, FileText, ClipboardList, Globe, Inbox } from 'lucide-react';
import { activityApi, searchApi, recipesApi, processedFilesApi, sharePointConnectionsApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const ACTIVITY_COLORS = {
  file_sorted: 'blue',
  file_classified: 'green',
  file_renamed: 'purple',
  recipe_created: 'green',
  recipe_executed: 'blue',
};

const EXAMPLE_QUERIES = [
  'Find all contracts with CenCore',
  'Show me Q3 financial reports',
  'What documents mention security clearances?',
];

const SUGGESTIONS = [
  {
    id: 1,
    icon: AlertTriangle,
    title: 'Found 12 duplicate files',
    description: 'Review and remove duplicates to save 45 MB',
    action: 'Review',
    color: '#FEF3C7',
    textColor: '#92400E',
  },
  {
    id: 2,
    icon: Lock,
    title: 'Sensitive file detected: Payroll_2024.xlsx',
    description: 'Currently accessible by 15 users',
    action: 'Review Access',
    color: '#FEE2E2',
    textColor: '#991B1B',
  },
  {
    id: 3,
    icon: Zap,
    title: 'New sorting recipe suggested',
    description: 'AI suggests sorting contracts by client and quarter',
    action: 'Review Recipe',
    color: '#DBEAFE',
    textColor: '#1E40AF',
  },
];

function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function formatActivityType(activityType) {
  return (activityType || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSubmitting, setSearchSubmitting] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [stats, setStats] = useState({ filesProcessed: 0, activeRecipes: 0, connectedSites: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const [files, recipes, connections] = await Promise.all([
          processedFilesApi.getAll().catch(() => []),
          recipesApi.getAll().catch(() => []),
          sharePointConnectionsApi.getAll().catch(() => []),
        ]);
        if (cancelled) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const filesToday = files.filter((f) => new Date(f.processedAt || f.createdAt) >= today);

        setStats({
          filesProcessed: filesToday.length,
          filesTotal: files.length,
          activeRecipes: recipes.filter((r) => r.isActive).length,
          recipesTotal: recipes.length,
          connectedSites: connections.filter((c) => c.connectionStatus === 'connected').length,
          sitesTotal: connections.length,
        });
      } catch {
        // Stats are non-critical
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchActivity() {
      try {
        const logs = await activityApi.getAll();
        if (cancelled) return;
        const sorted = logs
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);
        setRecentActivity(sorted);
      } catch (err) {
        if (!cancelled) setActivityError(err.message);
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    }

    fetchActivity();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      try {
        const history = await searchApi.getHistory();
        if (cancelled) return;
        const sorted = history
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setSearchHistory(sorted);
      } catch {
        // Search history is non-critical; fail silently
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    fetchHistory();
    return () => { cancelled = true; };
  }, []);

  const handleSearch = async (query) => {
    const text = (query || searchQuery).trim();
    if (!text || searchSubmitting) return;

    setSearchSubmitting(true);
    try {
      const result = await searchApi.search(text, null, user?.sub || null);
      toast.info('Search query recorded. Full search results will be available once the RAG backend is connected.');
      // Prepend to local history
      setSearchHistory((prev) => [result, ...prev].slice(0, 5));
      setSearchQuery('');
    } catch (err) {
      toast.error(err.message || 'Search failed');
    } finally {
      setSearchSubmitting(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <>
      {/* Search Section */}
      <div className="search-section card">
        <div className="search-bar">
          <Search size={20} color="#9CA3AF" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search for information or ask a question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            disabled={searchSubmitting}
          />
          {searchSubmitting ? (
            <LoadingSpinner size="sm" />
          ) : (
            <button
              className="search-submit"
              onClick={() => handleSearch()}
              disabled={!searchQuery.trim()}
              aria-label="Submit search"
            >
              <Search size={18} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="example-queries">
          {EXAMPLE_QUERIES.map((query) => (
            <button
              key={query}
              className="example-query"
              onClick={() => handleSearch(query)}
              disabled={searchSubmitting}
            >
              {query}
            </button>
          ))}
        </div>

        {/* Search History */}
        {!historyLoading && searchHistory.length > 0 && (
          <div className="search-history">
            <h3 className="search-history-title">Recent Searches</h3>
            <div className="search-history-list">
              {searchHistory.map((item) => (
                <button
                  key={item.id}
                  className="search-history-item"
                  onClick={() => handleSearch(item.queryText)}
                  disabled={searchSubmitting}
                >
                  <Clock size={14} aria-hidden="true" />
                  <span>{item.queryText}</span>
                  <span className="search-history-time">{formatTimeAgo(item.createdAt)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statsLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="card stat-card">
              <div className="stat-icon-wrapper skeleton-stat-icon" />
              <div className="stat-info">
                <div className="skeleton skeleton-stat-value" />
                <div className="skeleton skeleton-stat-label" />
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="card stat-card">
              <div className="stat-icon-wrapper stat-icon-blue" aria-hidden="true">
                <FileText size={22} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.filesProcessed}</div>
                <div className="stat-label">Files processed today</div>
                <div className="stat-sub">{stats.filesTotal} total</div>
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-icon-wrapper stat-icon-green" aria-hidden="true">
                <ClipboardList size={22} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.activeRecipes}</div>
                <div className="stat-label">Active recipes</div>
                <div className="stat-sub">{stats.recipesTotal} total</div>
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-icon-wrapper stat-icon-purple" aria-hidden="true">
                <Globe size={22} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.connectedSites}</div>
                <div className="stat-label">Connected sites</div>
                <div className="stat-sub">{stats.sitesTotal} total</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Activity and Suggestions Grid */}
      <div className="dashboard-grid">
        {/* Recent Activity */}
        <div className="card activity-card">
          <div className="card-header">
            <h2>Recent Activity</h2>
            <span className="live-badge">Live</span>
          </div>
          {activityLoading ? (
            <div className="activity-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="activity-item activity-skeleton">
                  <div className="activity-content">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-time" />
                  </div>
                </div>
              ))}
            </div>
          ) : activityError ? (
            <div className="activity-empty">
              <p>Failed to load activity: {activityError}</p>
            </div>
          ) : recentActivity.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No activity yet"
              description="Activity will appear here as Sorterra processes and organizes your files."
              compact
            />
          ) : (
            <div className="activity-list">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className={`activity-item activity-${ACTIVITY_COLORS[item.activityType] || 'blue'}`}
                >
                  <div className="activity-content">
                    <h3>{formatActivityType(item.activityType)}</h3>
                    <p>{item.description}</p>
                    <span className="activity-time">{formatTimeAgo(item.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart Suggestions */}
        <div className="card suggestions-card">
          <div className="card-header">
            <h2>Smart Suggestions</h2>
          </div>
          <div className="suggestions-list">
            {SUGGESTIONS.map((suggestion) => {
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
    </>
  );
}

export default Dashboard;
