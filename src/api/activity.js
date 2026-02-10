import apiClient from './client';

/**
 * Activity Logs API service
 */
export const activityApi = {
  /**
   * Get all activity logs
   */
  async getAll() {
    return await apiClient.get('/api/activitylogs');
  },

  /**
   * Get activity log by ID
   */
  async getById(id) {
    return await apiClient.get(`/api/activitylogs/${id}`);
  },

  /**
   * Create a new activity log entry
   */
  async create(data) {
    return await apiClient.post('/api/activitylogs', data);
  },

  /**
   * Get recent activity for an organization
   * (Client-side filter until backend adds endpoint)
   */
  async getRecentByOrganization(organizationId, limit = 10) {
    const logs = await this.getAll();
    return logs
      .filter(log => log.organizationId === organizationId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  },
};
