import { Request, Response, NextFunction } from 'express';
import { ReporteService } from '../services/reporte.service';
import { filtroReporteSchema } from '../schemas/reporte.schema';

const service = new ReporteService();

export class ReporteController {
  static async descargarOrdenes(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = filtroReporteSchema.parse(req.query);
      const format = (req.query.format as 'pdf' | 'excel' | 'csv') || 'pdf';
      const { nombreArchivo, buffer, mimeType } = await service.getReporteOperacionalOrdenes(dto, format);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.send(buffer);
    } catch (error) { next(error); }
  }

  static async descargarInventario(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = filtroReporteSchema.parse(req.query);
      const format = (req.query.format as 'pdf' | 'excel' | 'csv') || 'pdf';
      const { nombreArchivo, buffer, mimeType } = await service.getReporteInventario(format, dto.campos);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.send(buffer);
    } catch (error) { next(error); }
  }

  static async descargarClientes(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = filtroReporteSchema.parse(req.query);
      const format = (req.query.format as 'pdf' | 'excel' | 'csv') || 'pdf';
      const { nombreArchivo, buffer, mimeType } = await service.getReporteClientes(dto, format);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.send(buffer);
    } catch (error) { next(error); }
  }

  static async getLogsActividad(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = filtroReporteSchema.parse(req.query);
      const data = await service.getLogsActividad(dto);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async descargarFinanciero(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = filtroReporteSchema.parse(req.query);
      const format = (req.query.format as 'pdf' | 'excel' | 'csv') || 'pdf';
      const { nombreArchivo, buffer, mimeType } = await service.getReporteFinanciero(dto, format);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.send(buffer);
    } catch (error) { next(error); }
  }

  static async descargarMasVendidos(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = filtroReporteSchema.parse(req.query);
      const format = (req.query.format as 'pdf' | 'excel' | 'csv') || 'pdf';
      const { nombreArchivo, buffer, mimeType } = await service.getReporteMasVendidos(dto, format);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.send(buffer);
    } catch (error) { next(error); }
  }

  static async descargarGestionVentas(req: Request, res: Response, next: NextFunction) {
    try {
      const { nombreArchivo, buffer, mimeType } = await service.getReporteGestionPdf();
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.send(buffer);
    } catch (error) { next(error); }
  }

  static async getDashboardData(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = filtroReporteSchema.parse(req.query);
      const data = await service.getDatosDashboard(dto);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  }
}