import { Request, Response, NextFunction } from 'express';
import { ReporteProgramacionService } from '../services/reporteProgramacion.service';
import { z } from 'zod';

const service = new ReporteProgramacionService();

const programacionSchema = z.object({
  nombre: z.string().min(3),
  tipoReporte: z.string(),
  frecuencia: z.enum(['DIARIA', 'SEMANAL', 'MENSUAL']),
  formato: z.enum(['pdf', 'excel', 'csv']),
  destinatarios: z.string(),
  campos: z.array(z.string()).optional(),
  activo: z.boolean().optional()
});

export class ReporteProgramacionController {
  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.listar();
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = programacionSchema.parse(req.body);
      const data = await service.crear(dto, req.user!.id);
      res.status(201).json({ success: true, data, message: 'Programación creada' });
    } catch (error) { next(error); }
  }

  static async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = programacionSchema.partial().parse(req.body);
      const data = await service.actualizar(req.params.id, dto);
      res.status(200).json({ success: true, data, message: 'Programación actualizada' });
    } catch (error) { next(error); }
  }

  static async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      await service.eliminar(req.params.id);
      res.status(200).json({ success: true, message: 'Programación eliminada' });
    } catch (error) { next(error); }
  }

  static async ejecutarManual(req: Request, res: Response, next: NextFunction) {
    try {
      // Forzar ejecución inmediata para pruebas
      await service.procesarProgramacionesPendientes();
      res.status(200).json({ success: true, message: 'Procesamiento manual iniciado' });
    } catch (error) { next(error); }
  }
}
