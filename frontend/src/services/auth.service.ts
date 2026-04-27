import { api } from './api';
import { Usuario, ApiResponse } from '@/types';

export const authService = {
  login: async (correo: string, contrasena: string) => {
    const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string; usuario: Usuario }>>('/auth/login', { correo, contrasena });
    return res.data;
  },
  
  registro: async (data: any) => {
    const res = await api.post<ApiResponse<any>>('/auth/registro', data);
    return res.data;
  },
};