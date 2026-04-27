import { Request, Response, NextFunction } from 'express';
import { HttpError } from './errorHandler';

// Requiere que el middleware 'authenticate' se haya ejecutado antes
export function requirePermission(...permisosRequeridos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, 'Usuario no autenticado'));
    }

    const tienePermiso = permisosRequeridos.some(permiso => 
      req.user!.permisos.includes(permiso)
    );

    if (!tienePermiso) {
      return next(new HttpError(403, 'No tiene permisos para realizar esta acción'));
    }

    next();
  };
}

export function requireRole(...rolesRequeridos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, 'Usuario no autenticado'));
    }

    const tieneRol = rolesRequeridos.some(rol => 
      req.user!.roles.includes(rol)
    );

    if (!tieneRol) {
      console.log(`[RBAC] Acceso denegado para usuario ${req.user!.id}. Roles: ${req.user!.roles}. Requeridos: ${rolesRequeridos}`);
      return next(new HttpError(403, 'Acceso denegado para su rol de usuario'));
    }

    next();
  };
}