import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { HttpError } from './errorHandler';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Token de acceso no proporcionado'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    
    // Inyectamos la información extraída del token al objeto Request
    req.user = {
      id: decoded.id,
      correo: decoded.correo,
      roles: decoded.roles || [],
      permisos: decoded.permisos || []
    };
    
    next();
  } catch (error) {
    next(new HttpError(401, 'Sesión expirada o token inválido'));
  }
}