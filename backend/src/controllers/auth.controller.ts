import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema, registroSchema } from '../schemas/auth.schema';

const service = new AuthService();

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await service.login(dto);
      res.status(200).json({ success: true, data: result, message: 'Inicio de sesión exitoso' });
    } catch (error) { next(error); }
  }

  static async registro(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = registroSchema.parse(req.body);
      const result = await service.registro(dto);
      res.status(201).json({ success: true, data: result, message: 'Usuario registrado exitosamente' });
    } catch (error) { next(error); }
  }
}