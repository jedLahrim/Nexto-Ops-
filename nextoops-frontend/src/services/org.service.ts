import { api } from './api';

export const orgService = {
  getDepartments: async () => {
    const { data } = await api.get('/departments');
    return data;
  },
  createDepartment: async (payload: any) => {
    const { data } = await api.post('/departments', payload);
    return data;
  },
  updateDepartment: async (id: string, payload: any) => {
    const { data } = await api.patch(`/departments/${id}`, payload);
    return data;
  },
  deleteDepartment: async (id: string) => {
    const { data } = await api.delete(`/departments/${id}`);
    return data;
  },
  
  getRooms: async () => {
    const { data } = await api.get('/rooms');
    return data;
  },
  createRoom: async (payload: any) => {
    const { data } = await api.post('/rooms', payload);
    return data;
  },
  updateRoom: async (id: string, payload: any) => {
    const { data } = await api.patch(`/rooms/${id}`, payload);
    return data;
  },
  deleteRoom: async (id: string) => {
    const { data } = await api.delete(`/rooms/${id}`);
    return data;
  },

  getSummary: async () => {
    const { data } = await api.get('/org/summary');
    return data;
  },
  getRoomAssets: async (roomId: string) => {
    const { data } = await api.get(`/rooms/${roomId}/assets`);
    return data;
  },
  transferAsset: async (payload: any) => {
    const { data } = await api.post('/inventory/assets/transfer', payload);
    return data;
  }
};
