import { api } from './api';
import { ApiResponse } from '@/types';

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
}

export const categoriaService = {
  listar: async () => {
    const res = await api.get<ApiResponse<Categoria[]>>('/categorias');
    return res.data;
  },
};
