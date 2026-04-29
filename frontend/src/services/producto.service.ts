import { api } from './api';
import { Producto, PaginacionResponse, ApiResponse } from '@/types';

export const productoService = {
  getCatalogo: async (params: { 
    page: number; 
    limit: number; 
    search?: string;
    categoriaId?: string;
    precioMin?: number;
    precioMax?: number;
    orderBy?: string;
  }) => {
    // Strip empty/falsy values so backend Zod validation doesn't receive invalid params like categoriaId=""
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const res = await api.get<ApiResponse<PaginacionResponse<Producto>>>('/productos', { params: cleanParams });
    return res.data;
  },
  
  getDetalle: async (id: string) => {
    const res = await api.get<ApiResponse<Producto>>(`/productos/${id}`);
    return res.data;
  },

  listarAdmin: async (params: {
    page: number;
    limit: number;
    search?: string;
    categoriaId?: string | null;
    estado?: string | null;
    orderBy?: string;
  }) => {
    // Strip null/empty so Zod on the backend doesn't choke on empty strings
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const res = await api.get<ApiResponse<PaginacionResponse<Producto>>>('/productos/admin/todos', { params: cleanParams });
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

  /** Sube una imagen al servidor y devuelve la URL pública */
  uploadImagen: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('imagen', file);
    const res = await api.post<ApiResponse<{ url: string }>>('/productos/upload-imagen', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data!.url;
  },
};