import apiClient from './client';

export const processedFilesApi = {
  async getAll() {
    return await apiClient.get('/api/processedfiles');
  },

  async getById(id) {
    return await apiClient.get(`/api/processedfiles/${id}`);
  },

  async create(data) {
    return await apiClient.post('/api/processedfiles', data);
  },

  async update(id, data) {
    return await apiClient.put(`/api/processedfiles/${id}`, data);
  },
};
