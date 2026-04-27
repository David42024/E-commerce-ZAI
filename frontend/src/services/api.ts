import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

/// <reference types="vite/client" />

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true, // Para cookies HttpOnly (Refresh Token en el futuro)
});

// Interceptador de Request: Inyectar JWT
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!useAuthStore.persist.hasHydrated()) {
    await useAuthStore.persist.rehydrate();
  }

  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptador de Response: Manejar errores globales (401, 403)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Si el token expiró, limpiamos el estado (aquí iría lógica de refresh token)
      useAuthStore.getState().logout();
      toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    } else if (error.response?.status === 403) {
      toast.error('No tiene permisos para realizar esta acción.');
    }
    return Promise.reject(error);
  }
);