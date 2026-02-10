import apiClient from './client';

/**
 * Sorting Recipes API service
 */
export const recipesApi = {
  /**
   * Get all sorting recipes with optional filters
   */
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.organizationId) params.append('organizationId', filters.organizationId);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.orderBy) params.append('orderBy', filters.orderBy);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/sortingrecipes?${queryString}` : '/api/sortingrecipes';

    return await apiClient.get(endpoint);
  },

  /**
   * Get sorting recipe by ID
   */
  async getById(id) {
    return await apiClient.get(`/api/sortingrecipes/${id}`);
  },

  /**
   * Get active recipes for a SharePoint connection
   */
  async getByConnection(connectionId) {
    return await apiClient.get(`/api/sortingrecipes/by-connection/${connectionId}`);
  },

  /**
   * Create a new sorting recipe
   */
  async create(data) {
    return await apiClient.post('/api/sortingrecipes', data);
  },

  /**
   * Update a sorting recipe
   */
  async update(id, data) {
    return await apiClient.put(`/api/sortingrecipes/${id}`, data);
  },

  /**
   * Delete a sorting recipe
   */
  async delete(id) {
    return await apiClient.delete(`/api/sortingrecipes/${id}`);
  },
};
