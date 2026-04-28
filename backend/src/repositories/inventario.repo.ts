import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export class InventarioRepository {
  
  /**
   * Query nativo para alertas de stock (requiere abstracción porque usa sintaxis específica de PG)
   */
  async findAlertasStockBajo() {
    return prisma.$queryRaw`
      SELECT 
        p.id, p.nombre, p.sku, 
        s.stock_fisico, s.stock_minimo, 
        (s.stock_fisico - s.stock_reservado) AS disponible
      FROM inv_stock_producto s
      JOIN cat_productos p ON s.producto_id = p.id
      WHERE (s.stock_fisico - s.stock_reservado) <= s.stock_minimo 
        AND p.activo = true
    `;
  }

  /**
   * Actualización de stock físico dentro de una transacción
   */
  async updateStockFisico(tx: Prisma.TransactionClient, productoId: string, cantidad: number, tipo: 'increment' | 'decrement') {
    return tx.invStockProducto.update({
      where: { productoId },
      data: { stockFisico: { [tipo]: cantidad } }
    });
  }

  /**
   * Registro de movimiento de inventario
   */
  async createMovimiento(tx: Prisma.TransactionClient, data: { stockId: string; tipoMovimiento: any; cantidad: number; referenciaId?: string; referenciaTipo: string; createdBy?: string }) {
    return tx.invMovimientoInventario.create({ data });
  }

  /**
   * Creación de ajuste y su detalle
   */
  async createAjuste(tx: Prisma.TransactionClient, motivo: string, tipo: 'GANANCIA' | 'PERDIDA', adminId: string) {
    return tx.invAjuste.create({
      data: { motivo, tipo, createdBy: adminId }
    });
  }

  async createDetalleAjuste(tx: Prisma.TransactionClient, ajusteId: string, stockId: string, cantidad: number) {
    return tx.invDetalleAjuste.create({
      data: { ajusteId, stockId, cantidad }
    });
  }

  async getStockByProductoId(productoId: string) {
    return prisma.invStockProducto.findUnique({
      where: { productoId }
    });
  }

  async findMovimientos(params: { page: number, limit: number, search: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.InvMovimientoInventarioWhereInput = search ? {
      stock: {
        producto: {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } }
          ]
        }
      }
    } : {};

    const [total, data] = await Promise.all([
      prisma.invMovimientoInventario.count({ where }),
      prisma.invMovimientoInventario.findMany({
        where,
        skip,
        take: limit,
        include: {
          stock: {
            include: {
              producto: true
            }
          },
          usuario: {
            select: {
              id: true,
              correo: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })
    ]);

    return { total, data };
  }
}