import { Request, Response, NextFunction } from 'express';
import { UnidadMedidaRepo } from '../repositories/unidad-medida.repo';

const repo = new UnidadMedidaRepo();

export class UnidadMedidaController {
  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await repo.findAll();
      res.status(200).json({ success: true, data: resultado });
    } catch (error) {
      next(error);
    }
  }
}
