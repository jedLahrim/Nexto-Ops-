import { api } from './api';

export enum UserType {
  SUPER_USER = 'SUPER_USER',
  NORMAL = 'NORMAL', // fallback or other types you may have
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  type: UserType;
  permissionSetId?: string;
  erpActive: boolean;
}

export const authService = {
  async getMe(): Promise<User | null> {
    try {
      const response = await api.get<User>('/user/me');
      return response.data;
    } catch (error) {
      return null;
    }
  },
  
  // Future methods for OTP/Login will go here
  async signOut(): Promise<void> {
    localStorage.removeItem('access_token');
    window.location.href = '/';
  }
};
