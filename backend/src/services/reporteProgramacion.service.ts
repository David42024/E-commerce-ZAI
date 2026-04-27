import { ReporteProgramacionRepository } from '../repositories/reporteProgramacion.repo';
import { ReporteService } from './reporte.service';
import { EmailService } from './email.service';
import { HttpError } from '../middlewares/errorHandler';
import cron from 'node-cron';

export class ReporteProgramacionService {
  private repo = new ReporteProgramacionRepository();
  private reporteService = new ReporteService();
  private emailService = new EmailService();

  async listar() {
    return this.repo.listar();
  }

  async crear(data: any, usuarioId: string) {
    return this.repo.crear({ ...data, createdBy: usuarioId });
  }

  async actualizar(id: string, data: any) {
    return this.repo.actualizar(id, data);
  }

  async eliminar(id: string) {
    return this.repo.eliminar(id);
  }

  /**
   * Procesa todas las programaciones pendientes de envío
   */
  async procesarProgramacionesPendientes() {
    const pendientes = await this.repo.findPendientesEnvio();
    console.log(`[Cron] Procesando ${pendientes.length} reportes programados pendientes`);

    for (const prog of pendientes) {
      try {
        await this.ejecutarYEnviarReporte(prog);
        
        // Actualizar último y próximo envío
        await this.repo.actualizar(prog.id, {
          ultimoEnvio: new Date(),
          // El repositorio recalcula proximoEnvio automáticamente al recibir frecuencia
          frecuencia: prog.frecuencia 
        });
        
        console.log(`[Cron] Reporte "${prog.nombre}" enviado con éxito a ${prog.destinatarios}`);
      } catch (error) {
        console.error(`[Cron] Error al procesar reporte programado ${prog.id}:`, error);
      }
    }
  }

  private async ejecutarYEnviarReporte(prog: any) {
    // Definir fechas para el reporte según frecuencia
    const fechaFin = new Date();
    const fechaInicio = new Date();
    
    if (prog.frecuencia === 'DIARIA') {
      fechaInicio.setDate(fechaInicio.getDate() - 1);
    } else if (prog.frecuencia === 'SEMANAL') {
      fechaInicio.setDate(fechaInicio.getDate() - 7);
    } else if (prog.frecuencia === 'MENSUAL') {
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);
    }

    const campos = Array.isArray(prog.campos)
      ? (prog.campos as string[])
      : typeof prog.campos === 'string'
        ? prog.campos
            .split(',')
            .map((c: string) => c.trim())
            .filter(Boolean)
        : undefined;

    const dto = {
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaFin: fechaFin.toISOString().split('T')[0],
      campos
    };

    let result;
    const formato = prog.formato.toLowerCase() as 'pdf' | 'excel' | 'csv';

    // Ejecutar el servicio de reporte correspondiente
    switch (prog.tipoReporte) {
      case 'operacional/ordenes':
        result = await this.reporteService.getReporteOperacionalOrdenes(dto, formato);
        break;
      case 'operacional/inventario':
        result = await this.reporteService.getReporteInventario(formato, campos);
        break;
      case 'operacional/clientes':
        result = await this.reporteService.getReporteClientes(dto, formato);
        break;
      case 'gestion/financiero':
        result = await this.reporteService.getReporteFinanciero(dto, formato);
        break;
      case 'gestion/mas-vendidos':
        result = await this.reporteService.getReporteMasVendidos(dto, formato);
        break;
      default:
        throw new Error(`Tipo de reporte no soportado: ${prog.tipoReporte}`);
    }

    // Enviar por correo electrónico
    const contentBuffer = Buffer.from(result.buffer);
    let contentType = 'application/octet-stream';
    if (formato === 'pdf') contentType = 'application/pdf';
    else if (formato === 'excel') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (formato === 'csv') contentType = 'text/csv';

    await this.emailService.sendReportEmail(
      prog.destinatarios.split(',').map((e: string) => e.trim()),
      prog.nombre,
      result.nombreArchivo,
      contentBuffer,
      contentType
    );

    return result;
  }

  /**
   * Inicializa el cron job que corre cada hora para verificar pendientes
   */
  static iniciarCronJobs() {
    // Correr cada hora al minuto 0
    cron.schedule('0 * * * *', async () => {
      const service = new ReporteProgramacionService();
      await service.procesarProgramacionesPendientes();
    });
    console.log('[Cron] Tareas programadas de reportes iniciadas (cada hora)');
  }
}
