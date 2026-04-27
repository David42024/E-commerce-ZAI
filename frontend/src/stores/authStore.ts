import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Usuario } from '@/types';

interface AuthState {
  accessToken: string | null;
  usuario: Usuario | null;
  setAuth: (token: string, user: Usuario) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      usuario: null,
      setAuth: (token, user) => set({ accessToken: token, usuario: user }),
      logout: () => set({ accessToken: null, usuario: null }),
    }),
    { name: 'auth-storage' } // Guarda en localStorage
  )
);