import { Request, Response, NextFunction } from 'express';
import { CarritoService } from '../services/carrito.service';
import { agregarItemSchema } from '../schemas/carrito.schema';

const service = new CarritoService();

export class CarritoController {
  static async obtenerMiCarrito(req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await service.obtenerMiCarrito(req.user!.id);
      res.status(200).json({ success: true, data: resultado });
    } catch (error) { next(error); }
  }

  static async agregarItem(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = agregarItemSchema.parse(req.body);
      const resultado = await service.agregarItem(req.user!.id, dto);
      res.status(200).json({ success: true, data: resultado, message: 'Producto agregado al carrito' });
    } catch (error) { next(error); }
  }

  static async eliminarItem(req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await service.eliminarItem(req.user!.id, req.params.productoId);
      res.status(200).json({ success: true, data: resultado, message: 'Producto eliminado' });
    } catch (error) { next(error); }
  }

  static async vaciarCarrito(req: Request, res: Response, next: NextFunction) {
    try {
      await service.vaciarCarrito(req.user!.id);
      res.status(200).json({ success: true, message: 'Carrito vaciado' });
    } catch (error) { next(error); }
  }
}