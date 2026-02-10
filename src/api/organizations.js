import apiClient from './client';

/**
 * Organizations API service
 */
export const organizationsApi = {
  /**
   * Get all organizations
   */
  async getAll() {
    return await apiClient.get('/api/organizations');
  },

  /**
   * Get organization by ID
   */
  async getById(id) {
    return await apiClient.get(`/api/organizations/${id}`);
  },

  /**
   * Create a new organization
   */
  async create(data) {
    return await apiClient.post('/api/organizations', data);
  },

  /**
   * Update an organization
   */
  async update(id, data) {
    return await apiClient.put(`/api/organizations/${id}`, data);
  },

  /**
   * Delete an organization
   */
  async delete(id) {
    return await apiClient.delete(`/api/organizations/${id}`);
  },
};
