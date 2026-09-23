import { api } from './api';

export const auditService = {
  getRecent: async () => {
    const { data } = await api.get('/audit/recent');
    return data;
  }
};
