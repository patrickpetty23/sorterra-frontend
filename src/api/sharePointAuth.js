import apiClient from './client';

export const sharePointAuthApi = {
  async getConsentUrl(connectionId) {
    return await apiClient.get(`/api/auth/sharepoint/consent?connectionId=${connectionId}`);
  },
};
