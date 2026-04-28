import { api } from './api';
import { Producto, PaginacionResponse, ApiResponse } from '@/types';

export const productoService = {
  getCatalogo: async (params: { page: number; limit: number; search?: string }) => {
    const res = await api.get<ApiResponse<PaginacionResponse<Producto>>>('/productos', { params });
    return res.data;
  },
  
  getDetalle: async (id: string) => {
    const res = await api.get<ApiResponse<Producto>>(`/productos/${id}`);
    return res.data;
  },

  listarAdmin: async (params: { page: number; limit: number; search?: string }) => {
    const res = await api.get<ApiResponse<PaginacionResponse<Producto>>>('/productos/admin/todos', { params });
    return res.data;
  },

  crearProducto: async (data: any) => {
    const res = await api.post<ApiResponse<Producto>>('/productos', data);
    return res.data;
  },

  actualizarProducto: async (id: string, data: any) => {
    const res = await api.patch<ApiResponse<Producto>>(`/productos/${id}`, data);
    return res.data;
  },

  eliminarProducto: async (id: string) => {
    const res = await api.delete<ApiResponse<void>>(`/productos/${id}`);
    return res.data;
  },
};