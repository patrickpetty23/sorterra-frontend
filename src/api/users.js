import apiClient from './client';

export const usersApi = {
  async getAll() {
    return await apiClient.get('/api/users');
  },

  async getById(id) {
    return await apiClient.get(`/api/users/${id}`);
  },

  async create(data) {
    return await apiClient.post('/api/users', data);
  },

  async update(id, data) {
    return await apiClient.put(`/api/users/${id}`, data);
  },

  async getMe() {
    return await apiClient.get('/api/users/me');
  },

  async getByCognitoSub(cognitoSub) {
    const users = await this.getAll();
    return users.find((u) => u.cognitoSub === cognitoSub) || null;
  },
};
