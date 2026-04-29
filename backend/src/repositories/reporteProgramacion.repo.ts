import { FrecuenciaReporte } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import prisma from '../lib/prisma';

export class ReporteProgramacionRepository {
  private mapPayload(data: any) {
    return {
      nombre: data.nombre,
      tipo_reporte: data.tipoReporte ?? data.tipo_reporte,
      frecuencia: data.frecuencia,
      formato: data.formato,
      destinatarios: data.destinatarios,
      campos: data.campos ?? {},
      activo: data.activo !== undefined ? data.activo : true,
      created_by: data.createdBy ?? data.created_by ?? null,
      ultimo_envio: data.ultimoEnvio ?? data.ultimo_envio ?? null,
      proximo_envio: data.proximoEnvio ?? data.proximo_envio ?? undefined,
    };
  }

  async listar() {
    return prisma.rep_programaciones.findMany({
      include: {
        seg_usuarios: {
          select: { correo: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findById(id: string) {
    return prisma.rep_programaciones.findUnique({
      where: { id },
      include: {
        seg_usuarios: {
          select: { correo: true }
        }
      }
    });
  }

  async crear(data: any) {
    return prisma.rep_programaciones.create({
      data: {
        id: data.id ?? randomUUID(),
        ...this.mapPayload({ ...data, proximoEnvio: this.calcularProximoEnvio(data.frecuencia) }),
        created_at: new Date(),
        updated_at: new Date(),
      }
    });
  }

  async actualizar(id: string, data: any) {
    const updateData: any = this.mapPayload(data);
    if (data.frecuencia) {
      updateData.proximo_envio = this.calcularProximoEnvio(data.frecuencia);
    }
    updateData.updated_at = new Date();

    return prisma.rep_programaciones.update({
      where: { id },
      data: updateData
    });
  }

  async eliminar(id: string) {
    return prisma.rep_programaciones.delete({
      where: { id }
    });
  }

  async findPendientesEnvio() {
    return prisma.rep_programaciones.findMany({
      where: {
        activo: true,
        proximo_envio: {
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
