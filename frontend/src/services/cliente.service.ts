import { api } from './api';
import { ApiResponse, PaginacionResponse } from '@/types';

export const clienteService = {
  listarAdmin: async (params: { page: number; limit: number; search?: string }) => {
    const res = await api.get<ApiResponse<PaginacionResponse<any>>>('/clientes/admin/todos', { params });
    return res.data;
  },

  obtenerDetalleAdmin: async (id: string) => {
    const res = await api.get<ApiResponse<any>>(`/clientes/admin/${id}`);
    return res.data;
  }
};
