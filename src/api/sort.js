import apiClient from './client';

export const sortApi = {
  async triggerSort(connectionId, recipeId, folderPath) {
    return await apiClient.post('/api/sort', {
      connectionId,
      recipeId,
      folderPath,
    });
  },
};
