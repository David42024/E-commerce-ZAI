import { api } from './api';
import { ApiResponse } from '@/types';

export const carritoService = {
  getMiCarrito: async () => {
    const res = await api.get<ApiResponse<any>>('/carrito');
    return res.data;
  },
  agregarItem: async (productoId: string, cantidad: number) => {
    const res = await api.post<ApiResponse<any>>('/carrito/items', { productoId, cantidad });
    return res.data;
  },
  eliminarItem: async (productoId: string) => {
    const res = await api.delete<ApiResponse<any>>(`/carrito/items/${productoId}`);
    return res.data;
  },
  vaciarCarrito: async () => {
    const res = await api.delete<ApiResponse<any>>('/carrito');
    return res.data;
  },
};