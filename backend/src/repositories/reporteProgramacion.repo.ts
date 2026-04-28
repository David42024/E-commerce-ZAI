import { FrecuenciaReporte } from '@prisma/client';
import prisma from '../lib/prisma';

export class ReporteProgramacionRepository {
  async listar() {
    return prisma.repProgramacion.findMany({
      include: {
        usuario: {
          select: { correo: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findById(id: string) {
    return prisma.repProgramacion.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { correo: true }
        }
      }
    });
  }

  async crear(data: any) {
    return prisma.repProgramacion.create({
      data: {
        nombre: data.nombre,
        tipoReporte: data.tipoReporte,
        frecuencia: data.frecuencia,
        formato: data.formato,
        destinatarios: data.destinatarios,
        campos: data.campos || {},
        activo: data.activo !== undefined ? data.activo : true,
        createdBy: data.createdBy,
        proximoEnvio: this.calcularProximoEnvio(data.frecuencia)
      }
    });
  }

  async actualizar(id: string, data: any) {
    const updateData: any = { ...data };
    if (data.frecuencia) {
      updateData.proximoEnvio = this.calcularProximoEnvio(data.frecuencia);
    }
    return prisma.repProgramacion.update({
      where: { id },
      data: updateData
    });
  }

  async eliminar(id: string) {
    return prisma.repProgramacion.delete({
      where: { id }
    });
  }

  async findPendientesEnvio() {
    return prisma.repProgramacion.findMany({
      where: {
        activo: true,
        proximoEnvio: {
          lte: new Date()
        }
      }
    });
  }

  private calcularProximoEnvio(frecuencia: FrecuenciaReporte): Date {
    const ahora = new Date();
    const proximo = new Date(ahora);
    
    // Resetear a las 00:00:00 del día siguiente por defecto
    proximo.setHours(0, 0, 0, 0);
    proximo.setDate(proximo.getDate() + 1);

    if (frecuencia === 'SEMANAL') {
      // Próximo lunes
      const diasHastaLunes = (1 + 7 - proximo.getDay()) % 7;
      proximo.setDate(proximo.getDate() + (diasHastaLunes === 0 ? 7 : diasHastaLunes));
    } else if (frecuencia === 'MENSUAL') {
      // Primero del próximo mes
      proximo.setMonth(proximo.getMonth() + 1);
      proximo.setDate(1);
    }

    return proximo;
  }
}
