import api from './api';
import { AuthResponse, UserDto } from '@/types';

export const authService = {
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    return api.post('/auth/login', credentials);
  },

  register: async (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    return api.post('/auth/register', data);
  },

  getMe: async (): Promise<UserDto> => {
    return api.get('/auth/me');
  },
};
