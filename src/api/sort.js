import apiClient from './client';

export const sortApi = {
  /**
   * Trigger sort for a connection. All active recipes for the connection's org are merged and sent to the agent.
   */
  async triggerSort(connectionId, folderPath) {
    return await apiClient.post('/api/sort', {
      connectionId,
      folderPath,
    });
  },
};
