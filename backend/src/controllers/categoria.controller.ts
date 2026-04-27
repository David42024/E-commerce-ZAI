import { Request, Response, NextFunction } from 'express';
import { CategoriaRepo } from '../repositories/categoria.repo';

const repo = new CategoriaRepo();

export class CategoriaController {
  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await repo.findAll();
      res.status(200).json({ success: true, data: resultado });
    } catch (error) {
      next(error);
    }
  }
}
