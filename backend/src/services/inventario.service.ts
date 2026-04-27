import { PrismaClient } from '@prisma/client';
import { InventarioRepository } from '../repositories/inventario.repo';
import { HttpError } from '../middlewares/errorHandler';
import { AjusteInventarioDto } from '../schemas/inventario.schema';

const prisma = new PrismaClient();

export class InventarioService {
  private repo = new InventarioRepository();

  async getAlertasStockBajo() {
    // El Service no sabe que esto es un $queryRaw. Solo sabe que le devuelve alertas.
    return this.repo.findAlertasStockBajo();
  }

  async ajustarStock(productoId: string, dto: AjusteInventarioDto, adminId: string) {
    // 1. Obtener stock fuera de la transacción para validación rápida
    const stock = await this.repo.getStockByProductoId(productoId); // Asumimos este método en el repo
    if (!stock) throw new HttpError(404, 'Registro de stock no encontrado');

    if (dto.tipo === 'PERDIDA' && stock.stockFisico < dto.cantidad) {
      throw new HttpError(400, 'No se puede retirar más stock del disponible físico');
    }

    // 2. Transacción estricta delegada al repositorio
    return await prisma.$transaction(async (tx) => {
      const ajuste = await this.repo.createAjuste(tx, dto.motivo, dto.tipo, adminId);
      
      await this.repo.createDetalleAjuste(tx, ajuste.id, stock.id, dto.cantidad);
      
      const operacion = dto.tipo === 'GANANCIA' ? 'increment' : 'decrement';
      await this.repo.updateStockFisico(tx, productoId, dto.cantidad, operacion as any);
      
      await this.repo.createMovimiento(tx, {
        stockId: stock.id, tipoMovimiento: 'AJUSTE', cantidad: dto.cantidad,
        referenciaId: ajuste.id, referenciaTipo: 'AJUSTE_INVENTARIO', createdBy: adminId
      });

      return ajuste;
    });
  }

  async listarMovimientos(params: { page: number, limit: number, search: string }) {
    return this.repo.findMovimientos(params);
  }
}