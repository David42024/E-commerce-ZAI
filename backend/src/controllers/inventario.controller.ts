import { Request, Response, NextFunction } from 'express';
import { InventarioService } from '../services/inventario.service';
import { ajusteInventarioSchema } from '../schemas/inventario.schema';

const service = new InventarioService();

export class InventarioController {
  static async getAlertas(req: Request, res: Response, next: NextFunction) {
    try {
      const alertas = await service.getAlertasStockBajo();
      res.status(200).json({ success: true, data: alertas });
    } catch (error) { next(error); }
  }

  static async ajustarStock(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = ajusteInventarioSchema.parse(req.body); // Zod protege el contrato
      const resultado = await service.ajustarStock(req.params.productoId, dto, req.user!.id);
      res.status(200).json({ success: true, data: resultado, message: 'Ajuste realizado' });
    } catch (error) { next(error); }
  }

  static async listarMovimientos(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const resultado = await service.listarMovimientos({
        page: Number(page),
        limit: Number(limit),
        search: String(search)
      });
      res.status(200).json({ success: true, data: resultado });
    } catch (error) { next(error); }
  }
}