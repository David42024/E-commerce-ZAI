import { Request, Response, NextFunction } from 'express';
import { ProductoService } from '../services/producto.service';
import { filtroProductoSchema, crearProductoSchema } from '../schemas/producto.schema';
import path from 'path';

const service = new ProductoService();

function toJsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => (typeof val === 'bigint' ? val.toString() : val))
  );
}

export class ProductoController {
  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = filtroProductoSchema.parse(req.query);
      const resultado = await service.obtenerCatalogo(dto);
      res.status(200).json({ success: true, data: resultado, message: 'Catálogo obtenido' });
    } catch (error) { next(error); }
  }

  static async detalle(req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await service.obtenerDetalle(req.params.id);
      res.status(200).json({ success: true, data: resultado });
    } catch (error) { next(error); }
  }

  static async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = crearProductoSchema.parse(req.body);
      const resultado = await service.crearProducto(dto, req.user!.id);
      res.status(201).json({ success: true, data: toJsonSafe(resultado), message: 'Producto creado exitosamente' });
    } catch (error) { next(error); }
  }

  static async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = crearProductoSchema.partial().parse(req.body);
      const resultado = await service.actualizarProducto(req.params.id, dto);
      res.status(200).json({ success: true, data: toJsonSafe(resultado), message: 'Producto actualizado exitosamente' });
    } catch (error) { next(error); }
  }

  static async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      await service.eliminarProducto(req.params.id);
      res.status(200).json({ success: true, message: 'Producto eliminado exitosamente' });
    } catch (error) { next(error); }
  }

  static async listarAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await service.listarParaAdmin(req.query);
      res.status(200).json({ success: true, data: resultado });
    } catch (error) { next(error); }
  }

  static async uploadImagen(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
        return;
      }
      // URL relativa: funciona en prod (mismo origen) y en dev con proxy Vite /uploads → backend
      const filename = path.basename(req.file.path);
      const url = `/uploads/productos/${filename}`;
      res.status(200).json({ success: true, data: { url }, message: 'Imagen subida exitosamente' });
    } catch (error) { next(error); }
  }
}