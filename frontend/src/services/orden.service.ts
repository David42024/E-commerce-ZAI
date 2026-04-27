import { api } from './api';
import { Orden, PaginacionResponse, ApiResponse } from '@/types';

export const ordenService = {
  crearOrden: async (data: any) => {
    const res = await api.post<ApiResponse<any>>('/ordenes', data);
    return res.data;
  },
  getMisOrdenes: async (params: any) => {
    const res = await api.get<ApiResponse<PaginacionResponse<Orden>>>('/ordenes/mis-ordenes', { params });
    return res.data;
  },
  getOrdenDetalle: async (id: string) => {
    const res = await api.get<ApiResponse<any>>(`/ordenes/${id}`);
    return res.data;
  },

  listarTodas: async (params: any) => {
    const res = await api.get<ApiResponse<PaginacionResponse<Orden>>>('/ordenes/todas', { params });
    return res.data;
  },

  cambiarEstado: async (id: string, data: { nuevoEstadoId: number; comentario?: string }) => {
    const res = await api.patch<ApiResponse<any>>(`/ordenes/${id}/estado`, data);
    return res.data;
  },
};