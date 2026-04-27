import { api } from './api';
import { ApiResponse, PaginacionResponse } from '@/types';

export const inventarioService = {
  getAlertas: async () => {
    const res = await api.get<ApiResponse<any[]>>('/inventario/alertas');
    return res.data;
  },

  getMovimientos: async (params: { page: number; limit: number; search?: string }) => {
    const res = await api.get<ApiResponse<PaginacionResponse<any>>>('/inventario/movimientos', { params });
    return res.data;
  },

  ajustarStock: async (productoId: string, data: { cantidad: number; tipo: 'GANANCIA' | 'PERDIDA'; motivo: string }) => {
    const res = await api.post<ApiResponse<any>>(`/inventario/ajustes/${productoId}`, data);
    return res.data;
  }
};
