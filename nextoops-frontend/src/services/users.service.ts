import { api } from './api';

export const usersService = {
  getUsers: async () => {
    const { data } = await api.get('/users');
    return data;
  },
  createUser: async (payload: any) => {
    const { data } = await api.post('/users', payload);
    return data;
  },
  updateProfile: async (id: string, payload: any) => {
    const { data } = await api.patch(`/users/${id}/profile`, payload);
    return data;
  },
  updateUsername: async (id: string, username: string) => {
    const { data } = await api.patch(`/users/${id}/username`, { username });
    return data;
  },
  resetPin: async (id: string, pin: string) => {
    const { data } = await api.post(`/users/${id}/reset-pin`, { pin });
    return data;
  },
  setActive: async (id: string, active: boolean) => {
    const { data } = await api.patch(`/users/${id}/active`, { active });
    return data;
  },
  setRole: async (id: string, role: string) => {
    const { data } = await api.patch(`/users/${id}/role`, { role });
    return data;
  },

  // Permissions related
  getPermissionSets: async () => {
    const { data } = await api.get('/permissions/sets');
    return data;
  },
  createPermissionSet: async (payload: any) => {
    const { data } = await api.post('/permissions/sets', payload);
    return data;
  },
  updatePermissionSet: async (id: string, payload: any) => {
    const { data } = await api.patch(`/permissions/sets/${id}`, payload);
    return data;
  },
  deletePermissionSet: async (id: string) => {
    const { data } = await api.delete(`/permissions/sets/${id}`);
    return data;
  },
  seedPermissionSets: async () => {
    const { data } = await api.post('/permissions/sets/seed');
    return data;
  },
  setPermissions: async (id: string, modules: string[]) => {
    const { data } = await api.put(`/users/${id}/permissions`, { modules });
    return data;
  },
  assignRole: async (id: string, roleId: string) => {
    const { data } = await api.put(`/users/${id}/roles/${roleId}`);
    return data;
  },
  clearRole: async (id: string) => {
    const { data } = await api.delete(`/users/${id}/roles`);
    return data;
  },

  // Signup requests
  getSignupRequests: async () => {
    const { data } = await api.get('/auth/signup-requests');
    return data;
  },
  approveSignup: async (id: string, payload: any) => {
    const { data } = await api.post(`/auth/signup-requests/${id}/approve`, payload);
    return data;
  },
  rejectSignup: async (id: string) => {
    const { data } = await api.post(`/auth/signup-requests/${id}/reject`);
    return data;
  }
};
