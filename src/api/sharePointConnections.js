import apiClient from './client';

export const sharePointConnectionsApi = {
  async getAll() {
    return await apiClient.get('/api/sharepointconnections');
  },

  async getById(id) {
    return await apiClient.get(`/api/sharepointconnections/${id}`);
  },

  async create(data) {
    return await apiClient.post('/api/sharepointconnections', data);
  },

  async update(id, data) {
    return await apiClient.put(`/api/sharepointconnections/${id}`, data);
  },

  async delete(id) {
    return await apiClient.delete(`/api/sharepointconnections/${id}`);
  },
};
