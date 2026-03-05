import { useState, useEffect } from 'react';
import { Globe, Plus, RefreshCw, Trash2, AlertCircle, CheckCircle, Clock, User, Building2, Users, Pencil, Play } from 'lucide-react';
import { sharePointConnectionsApi, usersApi, organizationsApi, userOrganizationsApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { useToast } from '../contexts/ToastContext';
import ConnectionModal from '../components/ConnectionModal';
import SortModal from '../components/SortModal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import './Settings.css';

const STATUS_CONFIG = {
  connected: { label: 'Connected', icon: CheckCircle, className: 'status-connected' },
  active: { label: 'Active', icon: CheckCircle, className: 'status-connected' },
  pending: { label: 'Pending', icon: Clock, className: 'status-pending' },
  error: { label: 'Error', icon: AlertCircle, className: 'status-error' },
};

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Settings() {
  const toast = useToast();
  const { user } = useAuth();
  const { organization } = useOrg();

  // Profile state
  const [dbUser, setDbUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Connections state
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deletingConnection, setDeletingConnection] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortingConnection, setSortingConnection] = useState(null);

  useEffect(() => {
    if (!user?.sub) return;
    let cancelled = false;

    async function fetchProfile() {
      try {
        const found = await usersApi.getByCognitoSub(user.sub);
        if (cancelled || !found) {
          setProfileLoading(false);
          return;
        }
        setDbUser(found);
        setProfileName(found.displayName || '');
        setProfileEmail(found.email || '');
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, [user?.sub]);

  const handleProfileSave = async () => {
    if (!dbUser) return;
    setProfileSaving(true);
    try {
      const updated = await usersApi.update(dbUser.id, {
        displayName: profileName.trim(),
        email: profileEmail.trim(),
      });
      setDbUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const profileDirty =
    dbUser &&
    (profileName.trim() !== (dbUser.displayName || '') ||
      profileEmail.trim() !== (dbUser.email || ''));

  // Organization state
  const [orgName, setOrgName] = useState('');
  const [orgEditMode, setOrgEditMode] = useState(false);
  const [orgSaving, setOrgSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [removingMember, setRemovingMember] = useState(null);
  const [removeMemberLoading, setRemoveMemberLoading] = useState(false);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || '');
    }
  }, [organization]);

  useEffect(() => {
    if (!organization?.id) {
      setMembersLoading(false);
      return;
    }
    let cancelled = false;

    async function fetchMembers() {
      try {
        const allMemberships = await userOrganizationsApi.getAll();
        const orgMemberships = allMemberships.filter((m) => m.organizationId === organization.id);

        const allUsers = await usersApi.getAll();
        const userMap = {};
        allUsers.forEach((u) => { userMap[u.id] = u; });

        const enriched = orgMemberships.map((m) => ({
          ...m,
          user: userMap[m.userId] || null,
        }));

        if (!cancelled) setMembers(enriched);
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    }

    fetchMembers();
    return () => { cancelled = true; };
  }, [organization?.id]);

  const handleOrgSave = async () => {
    if (!organization) return;
    setOrgSaving(true);
    try {
      await organizationsApi.update(organization.id, { name: orgName.trim() });
      toast.success('Organization updated');
      setOrgEditMode(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update organization');
    } finally {
      setOrgSaving(false);
    }
  };

  const handleRoleChange = async (member, newRole) => {
    try {
      const updated = await userOrganizationsApi.update(member.userId, member.organizationId, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.userId === member.userId ? { ...m, role: updated.role } : m))
      );
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    setRemoveMemberLoading(true);
    try {
      await userOrganizationsApi.delete(removingMember.userId, removingMember.organizationId);
      setMembers((prev) => prev.filter((m) => m.userId !== removingMember.userId));
      toast.success('Member removed');
      setRemovingMember(null);
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    } finally {
      setRemoveMemberLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    setLoading(true);
    setError(null);
    try {
      const data = await sharePointConnectionsApi.getAll();
      setConnections(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!deletingConnection) return;
    setDeleteLoading(true);
    try {
      await sharePointConnectionsApi.delete(deletingConnection.id);
      setConnections((prev) => prev.filter((c) => c.id !== deletingConnection.id));
      toast.success('Connection removed');
      setDeletingConnection(null);
    } catch (err) {
      toast.error(err.message || 'Failed to remove connection');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddConnection = async (formData) => {
    const created = await sharePointConnectionsApi.create({
      ...formData,
      organizationId: organization?.id || null,
    });
    setConnections((prev) => [...prev, created]);
    toast.success('Connection added');
    setAddModalOpen(false);
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  return (
    <div className="settings-page">
      {/* Profile Section */}
      <section className="settings-section">
        <div className="section-header">
          <div>
            <h2>Profile</h2>
            <p className="section-subtitle">Manage your account information.</p>
          </div>
        </div>

        {profileLoading ? (
          <div className="card profile-card">
            <div className="profile-form">
              <div className="form-group">
                <div className="skeleton" style={{ width: 60, height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '100%', height: 40 }} />
              </div>
              <div className="form-group">
                <div className="skeleton" style={{ width: 60, height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '100%', height: 40 }} />
              </div>
            </div>
          </div>
        ) : dbUser ? (
          <div className="card profile-card">
            <div className="profile-avatar">
              <User size={24} />
            </div>
            <div className="profile-form">
              <div className="profile-form-row">
                <div className="form-group">
                  <label htmlFor="profile-name">Display Name</label>
                  <input
                    id="profile-name"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-email">Email</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="profile-actions">
                <span className="profile-meta">
                  Member since {new Date(dbUser.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
                <button
                  className="btn btn-primary"
                  onClick={handleProfileSave}
                  disabled={profileSaving || !profileDirty}
                >
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card profile-card">
            <div className="profile-fallback">
              <User size={20} />
              <div>
                <div className="profile-fallback-name">{user?.name || user?.email || 'User'}</div>
                <div className="profile-fallback-sub">{user?.email || ''}</div>
              </div>
            </div>
            <p className="profile-note">
              Your profile could not be loaded from the database. You may need to complete registration first.
            </p>
          </div>
        )}
      </section>

      {/* Organization Section */}
      <section className="settings-section">
        <div className="section-header">
          <div>
            <h2>Organization</h2>
            <p className="section-subtitle">Manage your organization and team members.</p>
          </div>
        </div>

        {organization ? (
          <>
            {/* Org Name */}
            <div className="card org-card">
              <div className="org-card-header">
                <Building2 size={20} className="org-card-icon" />
                {orgEditMode ? (
                  <div className="org-name-edit">
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="org-name-input"
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleOrgSave}
                      disabled={orgSaving || !orgName.trim()}
                    >
                      {orgSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setOrgEditMode(false); setOrgName(organization.name); }}
                      disabled={orgSaving}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="org-name-display">
                    <span className="org-display-name">{organization.name}</span>
                    <button
                      className="row-action-btn"
                      onClick={() => setOrgEditMode(true)}
                      aria-label="Edit organization name"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="org-meta-row">
                <span className="org-meta-item">Created {new Date(organization.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Members */}
            <div className="card members-card">
              <div className="members-header">
                <Users size={18} />
                <h3>Members</h3>
                <span className="members-count">{members.length}</span>
              </div>

              {membersLoading ? (
                <div className="members-list">
                  {[1, 2].map((i) => (
                    <div key={i} className="member-row">
                      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ width: '50%', height: 14, marginBottom: 6 }} />
                        <div className="skeleton" style={{ width: '30%', height: 12 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : members.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No members"
                  description="No team members found in this organization."
                  compact
                />
              ) : (
                <div className="members-list">
                  {members.map((member) => {
                    const u = member.user;
                    const isSelf = dbUser && member.userId === dbUser.id;
                    return (
                      <div key={member.userId} className="member-row">
                        <div className="member-avatar">
                          {(u?.displayName || u?.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="member-info">
                          <span className="member-name">
                            {u?.displayName || u?.email || 'Unknown'}
                            {isSelf && <span className="member-you">(you)</span>}
                          </span>
                          <span className="member-email">{u?.email || ''}</span>
                        </div>
                        <select
                          className="member-role-select"
                          value={member.role}
                          onChange={(e) => handleRoleChange(member, e.target.value)}
                          disabled={isSelf}
                          aria-label={`Role for ${u?.displayName || u?.email || 'member'}`}
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                        {!isSelf && (
                          <button
                            className="row-action-btn row-action-danger"
                            onClick={() => setRemovingMember(member)}
                            aria-label="Remove member"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="card">
            <EmptyState
              icon={Building2}
              title="No organization"
              description="You are not part of an organization yet. Contact your administrator to get added."
              compact
            />
          </div>
        )}
      </section>

      {/* Connections Section */}
      <section className="settings-section">
        <div className="section-header">
          <div>
            <h2>SharePoint Connections</h2>
            <p className="section-subtitle">Manage your connected SharePoint sites and data sources.</p>
          </div>
          <div className="section-actions">
            <button
              className="btn btn-secondary"
              onClick={fetchConnections}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus size={16} />
              <span>Add Connection</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="connections-grid">
            {[1, 2].map((i) => (
              <div key={i} className="card connection-card">
                <div className="skeleton skeleton-conn-url" />
                <div className="skeleton skeleton-conn-status" />
                <div className="skeleton skeleton-conn-meta" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card">
            <EmptyState
              icon={AlertCircle}
              title="Failed to load connections"
              description={error}
              action={fetchConnections}
              actionLabel="Retry"
            />
          </div>
        ) : connections.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Globe}
              title="No connections yet"
              description="Connect a SharePoint site to start organizing files with Sorterra."
              action={() => setAddModalOpen(true)}
              actionLabel="Add Connection"
            />
          </div>
        ) : (
          <div className="connections-grid">
            {connections.map((conn) => {
              const sc = getStatusConfig(conn.connectionStatus);
              const StatusIcon = sc.icon;
              return (
                <div key={conn.id} className="card connection-card">
                  <div className="connection-header">
                    <div className="connection-url-row">
                      <Globe size={18} className="connection-icon" />
                      <span className="connection-url">{conn.siteUrl}</span>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setSortingConnection(conn)}
                      aria-label="Sort files"
                    >
                      <Play size={14} />
                      <span>Sort Now</span>
                    </button>
                    <button
                      className="row-action-btn row-action-danger"
                      onClick={() => setDeletingConnection(conn)}
                      aria-label="Remove connection"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={`connection-status ${sc.className}`}>
                    <StatusIcon size={14} />
                    <span>{sc.label}</span>
                  </div>

                  {conn.errorMessage && (
                    <div className="connection-error">
                      <AlertCircle size={14} />
                      <span>{conn.errorMessage}</span>
                    </div>
                  )}

                  <div className="connection-meta">
                    <div className="meta-item">
                      <span className="meta-label">Last Sync</span>
                      <span className="meta-value">{formatDate(conn.lastSyncAt)}</span>
                    </div>
                    {conn.sourceFolder && (
                      <div className="meta-item">
                        <span className="meta-label">Source</span>
                        <span className="meta-value">{conn.sourceFolder}</span>
                      </div>
                    )}
                    <div className="meta-item">
                      <span className="meta-label">Added</span>
                      <span className="meta-value">{formatDate(conn.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Connection Modal */}
      {addModalOpen && (
        <ConnectionModal
          onSave={handleAddConnection}
          onClose={() => setAddModalOpen(false)}
        />
      )}

      {/* Remove Member Confirmation */}
      {removingMember && (
        <ConfirmDialog
          title="Remove Member"
          message={`Remove ${removingMember.user?.displayName || removingMember.user?.email || 'this member'} from the organization?`}
          confirmLabel="Remove"
          loading={removeMemberLoading}
          onConfirm={handleRemoveMember}
          onCancel={() => setRemovingMember(null)}
        />
      )}

      {/* Sort Modal */}
      {sortingConnection && (
        <SortModal
          connection={sortingConnection}
          onSortComplete={fetchConnections}
          onClose={() => setSortingConnection(null)}
        />
      )}

      {/* Delete Connection Confirmation */}
      {deletingConnection && (
        <ConfirmDialog
          title="Remove Connection"
          message={`Are you sure you want to remove the connection to "${deletingConnection.siteUrl}"? This will not delete files from SharePoint.`}
          confirmLabel="Remove"
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeletingConnection(null)}
        />
      )}
    </div>
  );
}

export default Settings;
