import { Request, Response, NextFunction } from 'express';
import { ClienteService } from '../services/cliente.service';
import { updatePerfilSchema, crearDireccionSchema } from '../schemas/cliente.schema';

const service = new ClienteService();

export class ClienteController {
  static async getPerfil(req: Request, res: Response, next: NextFunction) {
    try {
      const perfil = await service.getPerfil(req.user!.id);
      res.status(200).json({ success: true, data: perfil });
    } catch (error) { next(error); }
  }

  static async updatePerfil(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = updatePerfilSchema.parse(req.body);
      const resultado = await service.updatePerfil(req.user!.id, dto);
      res.status(200).json({ success: true, data: resultado, message: 'Perfil actualizado' });
    } catch (error) { next(error); }
  }

  static async toggleListaDeseos(req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await service.toggleListaDeseos(req.user!.id, req.params.productoId);
      const mensaje = resultado.accion === 'agregado' ? 'Agregado a lista de deseos' : 'Eliminado de lista de deseos';
      res.status(200).json({ success: true, data: resultado, message: mensaje });
    } catch (error) { next(error); }
  }

  static async agregarDireccion(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = crearDireccionSchema.parse(req.body);
      const resultado = await service.agregarDireccion(req.user!.id, dto);
      res.status(201).json({ success: true, data: resultado, message: 'Dirección creada' });
    } catch (error) { next(error); }
  }

  static async listarAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const resultado = await service.listarAdmin({
        page: Number(page),
        limit: Number(limit),
        search: String(search)
      });
      res.status(200).json({ success: true, data: resultado });
    } catch (error) { next(error); }
  }

  static async obtenerDetalleAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await service.obtenerDetalleAdmin(req.params.id);
      res.status(200).json({ success: true, data: resultado });
    } catch (error) { next(error); }
  }
}