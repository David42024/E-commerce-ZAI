import { Request, Response, NextFunction } from 'express';
import { OrdenService } from '../services/orden.service';
import { crearOrdenSchema, filtroOrdenSchema, cambiarEstadoSchema } from '../schemas/orden.schema';

const service = new OrdenService();

export class OrdenController {
  static async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = crearOrdenSchema.parse(req.body);
      const resultado = await service.crearOrden(req.user!.id, dto.metodoEnvioId, dto.direccionEnvio, dto.metodoPago, dto.notasCliente);
      res.status(201).json({ success: true, data: resultado, message: 'Orden creada exitosamente' });
    } catch (error) { next(error); }
  }

  static async listarMisOrdenes(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = filtroOrdenSchema.parse(req.query);
      const resultado = await service.listarOrdenes(dto, req.user!.id);
      res.status(200).json({ success: true, data: resultado });
    } catch (error) { next(error); }
  }

  static async obtenerDetalle(req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await service.obtenerDetalleOrden(req.params.id);
      res.status(200).json({ success: true, data: resultado });
    } catch (error) { next(error); }
  }

  static async listarTodas(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = filtroOrdenSchema.parse(req.query);
      const resultado = await service.listarOrdenes(dto);
      res.status(200).json({ success: true, data: resultado });
    } catch (error) { next(error); }
  }

  static async cambiarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = cambiarEstadoSchema.parse(req.body);
      const resultado = await service.cambiarEstado(req.params.id, dto, req.user!.id);
      res.status(200).json({ success: true, data: resultado, message: 'Estado actualizado' });
    } catch (error) { next(error); }
  }
}