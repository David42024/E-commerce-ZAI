import { api } from './api';
import { ApiResponse } from '@/types';

export const adminService = {
  getDashboardKpis: async (fechaInicio: string, fechaFin: string) => {
    const res = await api.get<ApiResponse<any>>('/reportes/dashboard', { params: { fechaInicio, fechaFin } });
    return res.data;
  },
  
  getReportePDF: (tipo: string, params: any) => 
    api.get(`/reportes/${tipo}`, { params, responseType: 'blob' }),

  getLogsActividad: async (params: { page: number; limit: number; search?: string; fechaInicio?: string; fechaFin?: string }) => {
    const res = await api.get<ApiResponse<any>>('/reportes/actividad', { params });
    return res.data;
  },
    
  cambiarEstadoOrden: async (ordenId: string, nuevoEstadoId: number, comentario: string) => {
    const res = await api.patch<ApiResponse<any>>(`/ordenes/${ordenId}/estado`, { nuevoEstadoId, comentario });
    return res.data;
  },

  // Programación de reportes
  listarProgramaciones: async () => {
    const res = await api.get<ApiResponse<any>>('/reportes/programacion');
    return res.data;
  },

  crearProgramacion: async (data: any) => {
    const res = await api.post<ApiResponse<any>>('/reportes/programacion', data);
    return res.data;
  },

  actualizarProgramacion: async (id: string, data: any) => {
    const res = await api.patch<ApiResponse<any>>(`/reportes/programacion/${id}`, data);
    return res.data;
  },

  eliminarProgramacion: async (id: string) => {
    const res = await api.delete<ApiResponse<any>>(`/reportes/programacion/${id}`);
    return res.data;
  },

  ejecutarManualProgramaciones: async () => {
    const res = await api.post<ApiResponse<any>>('/reportes/programacion/ejecutar-manual');
    return res.data;
  },
};