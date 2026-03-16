import { useState, useEffect } from 'react';
import { FileText, ClipboardList, Globe, Inbox, TrendingUp, CheckCircle, BarChart2 } from 'lucide-react';
import { activityApi, recipesApi, processedFilesApi, sharePointConnectionsApi } from '../api';
import EmptyState from '../components/EmptyState';

const ACTIVITY_COLORS = {
  file_sorted: 'blue',
  file_classified: 'green',
  file_renamed: 'purple',
  recipe_created: 'green',
  recipe_executed: 'blue',
  sort_completed: 'blue',
};


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
  const [stats, setStats] = useState({ filesProcessed: 0, activeRecipes: 0, connectedSites: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [allProcessedFiles, setAllProcessedFiles] = useState([]);

  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(null);

  // Sorting stats filter
  const [sortingFilter, setSortingFilter] = useState('all');

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

        setAllProcessedFiles(files);
        setStats({
          filesProcessed: filesToday.length,
          filesTotal: files.length,
          activeRecipes: recipes.filter((r) => r.isActive).length,
          recipesTotal: recipes.length,
          siteConnection: connections[0] ?? null,
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

  // ── Derived sorting stats ──────────────────────────────────────────────
  const filteredFiles = (() => {
    const now = new Date();
    return allProcessedFiles.filter((f) => {
      const date = new Date(f.processedAt || f.createdAt);
      if (sortingFilter === 'day') {
        const today = new Date(now); today.setHours(0, 0, 0, 0);
        return date >= today;
      }
      if (sortingFilter === 'month') {
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      }
      return true; // 'all'
    });
  })();

  const totalSorted = filteredFiles.filter((f) => f.status === 'success').length;

  const sortRuns = recentActivity.filter((a) => a.activityType === 'sort_completed');
  const avgFilesPerRun = sortRuns.length === 0 ? 0 : (
    sortRuns.reduce((sum, run) => {
      const match = run.description?.match(/(\d+)\/(\d+)/);
      return sum + (match ? parseInt(match[1], 10) : 0);
    }, 0) / sortRuns.length
  ).toFixed(1);

  const successRate = allProcessedFiles.length === 0 ? null : (
    (allProcessedFiles.filter((f) => f.status === 'success').length / allProcessedFiles.length) * 100
  ).toFixed(1);
  // ──────────────────────────────────────────────────────────────────────

  return (
    <>
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
                <div className="stat-value" style={{ fontSize: stats.siteConnection ? '1.1rem' : undefined }}>
                  {stats.siteConnection
                    ? stats.siteConnection.connectionStatus === 'connected' ? 'Connected' : 'Not Connected'
                    : 'No site configured'}
                </div>
                <div className="stat-label">SharePoint site</div>
                {stats.siteConnection?.siteUrl && (
                  <div className="stat-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {stats.siteConnection.siteUrl}
                  </div>
                )}
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

        {/* Sorting Stats */}
        <div className="card suggestions-card">
          <div className="card-header">
            <h2>Sorting Stats</h2>
          </div>
          <div className="sorting-stats-grid">

            {/* Card 1 — Total Files Sorted */}
            <div className="sorting-stat-card">
              <div className="sorting-stat-header">
                <div className="sorting-stat-icon-wrap sorting-icon-blue">
                  <TrendingUp size={18} />
                </div>
                <div className="sorting-filter-tabs">
                  {['day', 'month', 'all'].map((f) => (
                    <button
                      key={f}
                      className={`filter-tab${sortingFilter === f ? ' filter-tab-active' : ''}`}
                      onClick={() => setSortingFilter(f)}
                    >
                      {f === 'day' ? 'Day' : f === 'month' ? 'Month' : 'All Time'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sorting-stat-value">{statsLoading ? '—' : totalSorted.toLocaleString()}</div>
              <div className="sorting-stat-label">Files Sorted</div>
            </div>

            {/* Card 2 — Avg Files Per Sort Run */}
            <div className="sorting-stat-card">
              <div className="sorting-stat-header">
                <div className="sorting-stat-icon-wrap sorting-icon-green">
                  <BarChart2 size={18} />
                </div>
              </div>
              <div className="sorting-stat-value">{activityLoading ? '—' : avgFilesPerRun}</div>
              <div className="sorting-stat-label">Avg Files / Sort Run</div>
              <div className="sorting-stat-sub">{sortRuns.length} run{sortRuns.length !== 1 ? 's' : ''} total</div>
            </div>

            {/* Card 3 — Success Rate */}
            <div className="sorting-stat-card">
              <div className="sorting-stat-header">
                <div className="sorting-stat-icon-wrap sorting-icon-purple">
                  <CheckCircle size={18} />
                </div>
              </div>
              <div className="sorting-stat-value">
                {statsLoading ? '—' : successRate === null ? 'N/A' : `${successRate}%`}
              </div>
              <div className="sorting-stat-label">Success Rate</div>
              {successRate !== null && (
                <div className="success-rate-bar-track">
                  <div
                    className="success-rate-bar-fill"
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
