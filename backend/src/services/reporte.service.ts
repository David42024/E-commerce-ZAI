import { ReporteRepository } from '../repositories/reporte.repo';
import { PdfGenerator } from '../utils/pdfGenerator';
import { PdfGestion } from '../utils/pdfGestion';
import { ExcelGenerator } from '../utils/excelGenerator';
import { CsvGenerator } from '../utils/csvGenerator';
import { FiltroReporteDto } from '../schemas/reporte.schema';

export class ReporteService {
  private repo = new ReporteRepository();
  private pdf = new PdfGenerator();
  private excel = new ExcelGenerator();
  private csv = new CsvGenerator();

  private getDateRange(dto: FiltroReporteDto) {
    const onlyDatePattern = /^\d{4}-\d{2}-\d{2}$/;

    const inicio = onlyDatePattern.test(dto.fechaInicio)
      ? new Date(`${dto.fechaInicio}T00:00:00.000Z`)
      : new Date(dto.fechaInicio);

    const fin = onlyDatePattern.test(dto.fechaFin)
      ? new Date(`${dto.fechaFin}T23:59:59.999Z`)
      : new Date(dto.fechaFin);

    return { inicio, fin };
  }

  private normalizarJson<T>(value: T): T {
    if (typeof value === 'bigint') {
      return Number(value) as T;
    }

    if (value instanceof Date) {
      return value;
    }

    if (value && typeof value === 'object') {
      if (typeof (value as any).toNumber === 'function') {
        return Number((value as any).toNumber()) as T;
      }

      if (Array.isArray(value)) {
        return value.map(item => this.normalizarJson(item)) as T;
      }

      const normalized: Record<string, any> = {};
      for (const [key, currentValue] of Object.entries(value as Record<string, any>)) {
        normalized[key] = this.normalizarJson(currentValue);
      }
      return normalized as T;
    }

    return value;
  }

  async getReporteOperacionalOrdenes(dto: FiltroReporteDto, formato: 'pdf' | 'excel' | 'csv' = 'pdf') {
    const { inicio, fin } = this.getDateRange(dto);
    const ordenes = await this.repo.getOrdenesByDateRange(inicio, fin);
    
    if (formato === 'excel') {
      const buffer = await this.excel.generarReporteOrdenes(ordenes, dto.campos);
      return {
        nombreArchivo: `reporte_ordenes_${Date.now()}.xlsx`,
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }

    if (formato === 'csv') {
      const buffer = await this.csv.generarReporteOrdenes(ordenes, dto.campos);
      return {
        nombreArchivo: `reporte_ordenes_${Date.now()}.csv`,
        buffer,
        mimeType: 'text/csv'
      };
    }

    const buffer = await this.pdf.generarReporteOrdenes(ordenes, dto.campos);
    return {
      nombreArchivo: `reporte_ordenes_${Date.now()}.pdf`,
      buffer,
      mimeType: 'application/pdf'
    };
  }

  async getReporteInventario(formato: 'pdf' | 'excel' | 'csv' = 'pdf', campos?: string[]) {
    const items = await this.repo.getInventarioParaReporte();
    
    if (formato === 'excel') {
      const buffer = await this.excel.generarReporteInventario(items, campos);
      return {
        nombreArchivo: `reporte_inventario_${Date.now()}.xlsx`,
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }

    if (formato === 'csv') {
      const buffer = await this.csv.generarReporteInventario(items, campos);
      return {
        nombreArchivo: `reporte_inventario_${Date.now()}.csv`,
        buffer,
        mimeType: 'text/csv'
      };
    }

    const buffer = await this.pdf.generarReporteInventario(items, campos);
    return {
      nombreArchivo: `reporte_inventario_${Date.now()}.pdf`,
      buffer,
      mimeType: 'application/pdf'
    };
  }

  async getReporteClientes(dto: FiltroReporteDto, formato: 'pdf' | 'excel' | 'csv' = 'pdf') {
    const { inicio, fin } = this.getDateRange(dto);
    const clientes = await this.repo.getClientesParaReporte(inicio, fin);
    
    if (formato === 'excel') {
      const buffer = await this.excel.generarReporteClientes(clientes, dto.campos);
      return {
        nombreArchivo: `reporte_clientes_${Date.now()}.xlsx`,
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }

    if (formato === 'csv') {
      const buffer = await this.csv.generarReporteClientes(clientes, dto.campos);
      return {
        nombreArchivo: `reporte_clientes_${Date.now()}.csv`,
        buffer,
        mimeType: 'text/csv'
      };
    }

    const buffer = await this.pdf.generarReporteClientes(clientes, dto.campos);
    return {
      nombreArchivo: `reporte_clientes_${Date.now()}.pdf`,
      buffer,
      mimeType: 'application/pdf'
    };
  }

  async getReporteFinanciero(dto: FiltroReporteDto, formato: 'pdf' | 'excel' | 'csv' = 'pdf') {
    const { inicio, fin } = this.getDateRange(dto);
    const data = await this.repo.getResumenFinanciero(inicio, fin) as any[];
    const resumen = data[0] || { ingresos_brutos: 0, costo_mercancia_vendida: 0, utilidad_bruta: 0 };
    
    if (formato === 'excel') {
      const buffer = await this.excel.generarReporteFinanciero(resumen, dto, dto.campos);
      return {
        nombreArchivo: `reporte_financiero_${Date.now()}.xlsx`,
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }

    if (formato === 'csv') {
      const buffer = await this.csv.generarReporteFinanciero(resumen, dto.campos);
      return {
        nombreArchivo: `reporte_financiero_${Date.now()}.csv`,
        buffer,
        mimeType: 'text/csv'
      };
    }

    const buffer = await this.pdf.generarReporteFinanciero(resumen, dto, dto.campos);
    return {
      nombreArchivo: `reporte_financiero_${Date.now()}.pdf`,
      buffer,
      mimeType: 'application/pdf'
    };
  }

  async getReporteMasVendidos(dto: FiltroReporteDto, formato: 'pdf' | 'excel' | 'csv' = 'pdf') {
    const { inicio, fin } = this.getDateRange(dto);
    const productos = await this.repo.getProductosMasVendidos(inicio, fin, 20) as any[];
    
    if (formato === 'excel') {
      const buffer = await this.excel.generarReporteMasVendidos(productos, dto, dto.campos);
      return {
        nombreArchivo: `reporte_mas_vendidos_${Date.now()}.xlsx`,
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }

    if (formato === 'csv') {
      const buffer = await this.csv.generarReporteMasVendidos(productos, dto.campos);
      return {
        nombreArchivo: `reporte_mas_vendidos_${Date.now()}.csv`,
        buffer,
        mimeType: 'text/csv'
      };
    }

    const buffer = await this.pdf.generarReporteMasVendidos(productos, dto, dto.campos);
    return {
      nombreArchivo: `reporte_mas_vendidos_${Date.now()}.pdf`,
      buffer,
      mimeType: 'application/pdf'
    };
  }

  async getLogsActividad(dto: FiltroReporteDto) {
    return this.repo.getLogsActividad(dto);
  }

  async getDatosDashboard(dto: FiltroReporteDto) {
    const { inicio, fin } = this.getDateRange(dto);

    // El repo resuelve las agregaciones (GROUP BY, COUNT), el service las empaqueta para el Frontend
    const [
      ventasDiarias, 
      ventasCategoria, 
      productosMasVendidos,
      resumenFinanciero,
      conversion, 
      kpis, 
      ordenesRecientes, 
      actividadReciente,
      rfm,
      cohortes
    ] = await Promise.all([
      this.repo.getVentasDiarias(inicio, fin),
      this.repo.getVentasPorCategoria(inicio, fin),
      this.repo.getProductosMasVendidos(inicio, fin),
      this.repo.getResumenFinanciero(inicio, fin),
      this.repo.getConversionStats(inicio, fin),
      this.repo.getKpisPrincipales(inicio, fin),
      this.repo.getOrdenesRecientes(),
      this.repo.getActividadReciente(),
      this.repo.getRFMAnalysis(),
      this.repo.getCohortAnalysis()
    ]);

    return this.normalizarJson({
      ventasDiarias, 
      ventasCategoria, 
      productosMasVendidos,
      resumenFinanciero: (resumenFinanciero as any[])[0] || { ingresos_brutos: 0, costo_mercancia_vendida: 0, utilidad_bruta: 0 },
      conversion, 
      kpis, 
      ordenesRecientes, 
      actividadReciente,
      rfm,
      cohortes
    });
  }

  async getReporteGestionPdf() {
    // Obtener datos del dashboard y generar PDF con PDFKit (sin Puppeteer/Chrome)
    const now = new Date();
    const fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = now.toISOString().split('T')[0];

    const dto = { fechaInicio, fechaFin, campos: undefined, search: '', formato: 'pdf' as const };
    const data = await this.getDatosDashboard(dto as any);

    const buffer = await PdfGestion.generarPdf({
      kpis: data.kpis,
      ventasDiarias: data.ventasDiarias as any[],
      ventasCategoria: data.ventasCategoria as any[],
      productosMasVendidos: data.productosMasVendidos as any[],
      resumenFinanciero: data.resumenFinanciero,
      fechaInicio,
      fechaFin,
    });

    return {
      nombreArchivo: `reporte_gestion_ventas_${Date.now()}.pdf`,
      buffer,
      mimeType: 'application/pdf'
    };
  }
}