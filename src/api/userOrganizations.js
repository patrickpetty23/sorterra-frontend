import apiClient from './client';

export const userOrganizationsApi = {
  async getAll() {
    return await apiClient.get('/api/userorganizations');
  },

  async getByUserAndOrg(userId, organizationId) {
    return await apiClient.get(`/api/userorganizations/${userId}/${organizationId}`);
  },

  async create(data) {
    return await apiClient.post('/api/userorganizations', data);
  },

  async update(userId, organizationId, data) {
    return await apiClient.put(`/api/userorganizations/${userId}/${organizationId}`, data);
  },

  async delete(userId, organizationId) {
    return await apiClient.delete(`/api/userorganizations/${userId}/${organizationId}`);
  },

  async getByUserId(userId) {
    const all = await this.getAll();
    return all.filter((uo) => uo.userId === userId);
  },
};
