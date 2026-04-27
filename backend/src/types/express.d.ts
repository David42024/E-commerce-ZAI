import { SegUsuario } from '@prisma/client';

// Extensión del namespace de Express para inyectar datos del usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        correo: string;
        roles: string[]; // Nombres de roles, ej: ['ADMIN', 'CLIENTE']
        permisos: string[]; // Tuplas, ej: ['cat.productos.crear']
      };
    }
  }
}

export {};