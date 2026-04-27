import { api } from './api';
import { ApiResponse } from '@/types';

export interface UnidadMedida {
  id: string;
  nombre: string;
  abreviatura: string;
  activo: boolean;
}

export const unidadMedidaService = {
  listar: async () => {
    const res = await api.get<ApiResponse<UnidadMedida[]>>('/unidades-medida');
    return res.data;
  },
};
