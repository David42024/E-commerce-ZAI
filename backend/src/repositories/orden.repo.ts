import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { FiltroOrdenDto } from '../schemas/orden.schema';

export class OrdenRepository {

  private normalizarClienteOrden<T extends { cliente?: any }>(orden: T) {
    if (!orden?.cliente) return orden;

    const cliente = orden.cliente;
    return {
      ...orden,
      cliente: {
        ...cliente,
        nombres: cliente.nombres ?? cliente.nombre,
        apellidos: cliente.apellidos ?? cliente.apellido,
      },
    };
  }
  
  // --- Métodos de Lectura (Usan la instancia por defecto) ---

  async findWithFilters(dto: FiltroOrdenDto, clienteId?: string) {
    const where: Prisma.OrdOrdenWhereInput = {
      ...(clienteId && { clienteId }),
      ...(dto.estado && { estado: { nombre: dto.estado } }),
      ...(dto.search && {
        OR: [
          { numeroOrden: { contains: dto.search, mode: 'insensitive' } },
          { cliente: { nombre: { contains: dto.search, mode: 'insensitive' } } },
          { cliente: { apellido: { contains: dto.search, mode: 'insensitive' } } },
        ],
      }),
      ...(dto.fechaInicio || dto.fechaFin ? {
        created_at: {
          ...(dto.fechaInicio && { 
            gte: dto.fechaInicio.includes('T') 
              ? new Date(dto.fechaInicio) 
              : new Date(`${dto.fechaInicio}T00:00:00.000Z`) 
          }),
          ...(dto.fechaFin && { 
            lte: dto.fechaFin.includes('T') 
              ? new Date(dto.fechaFin) 
              : new Date(`${dto.fechaFin}T23:59:59.999Z`) 
          }),
        }
      } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.ordOrden.findMany({
        where, skip: (dto.page - 1) * dto.limit, take: dto.limit,
        orderBy: { created_at: 'desc' },
        include: { 
          estado: { select: { nombre: true } }, 
          cliente: { 
            select: { 
              nombre: true, 
              apellido: true,
              usuario: { select: { correo: true } }
            } 
          },
          items: {
            select: {
              id: true,
              cantidad: true,
              precioUnitario: true,
              subtotal: true,
              nombreProducto: true
            }
          }
        }
      }),
      prisma.ordOrden.count({ where })
    ]);
    return { data: data.map(orden => this.normalizarClienteOrden(orden)), total, page: dto.page, limit: dto.limit };
  }

  async findEstados() {
    return prisma.ordEstadoOrden.findMany({
      orderBy: { id: 'asc' }
    });
  }

  async findByIdFull(id: string) {
    const orden = await prisma.ordOrden.findUnique({ 
      where: { id }, 
      include: { 
        items: {
          include: {
            producto: {
              include: {
                stock: true
              }
            }
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            documentoIdentidad: true,
            telefono: true,
            fechaNacimiento: true,
            limite_credito: true,
            saldo_deudor: true,
            activo: true,
            created_at: true,
            updated_at: true,
            usuario: {
              select: { correo: true }
            }
          }
        },
        direccionEnvio: true,
        metodoEnvio: true,
        estado: true,
        pago: true,
        historial: {
          include: {
            usuario: {
              select: { correo: true }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      } 
    });
    return orden ? this.normalizarClienteOrden(orden) : null;
  }

  // --- Métodos de Escritura Transaccional (Reciben el 'tx') ---

  async createDireccion(tx: Prisma.TransactionClient, data: Prisma.OrdDireccionEnvioCreateInput) {
    return tx.ordDireccionEnvio.create({ data });
  }

  async createOrden(tx: Prisma.TransactionClient, payload: Prisma.OrdOrdenUncheckedCreateInput) {
    return tx.ordOrden.create({ data: payload });
  }

  async createHistorialEstado(tx: Prisma.TransactionClient, data: Prisma.OrdHistorialEstadoUncheckedCreateInput) {
    return tx.ordHistorialEstado.create({ data });
  }

  async reservarStock(tx: Prisma.TransactionClient, items: { productoId: string, stockId: string, cantidad: number }[]) {
    for (const item of items) {
      await tx.invStockProducto.update({
        where: { productoId: item.productoId },
        data: { stockReservado: { increment: item.cantidad } }
      });
      await tx.invMovimientoInventario.create({
        data: {
          stockId: item.stockId, tipoMovimiento: 'RESERVA', cantidad: item.cantidad,
          referenciaTipo: 'ORDEN_PENDIENTE'
        }
      });
    }
  }

  async confirmarVentaYDescontarStock(tx: Prisma.TransactionClient, items: { productoId: string, stockId: string, cantidad: number }[], ordenId: string, adminId?: string) {
    for (const item of items) {
      await tx.invStockProducto.update({
        where: { productoId: item.productoId },
        data: { 
          stockFisico: { decrement: item.cantidad },
          stockReservado: { decrement: item.cantidad }
        }
      });
      await tx.invMovimientoInventario.create({
        data: {
          stockId: item.stockId, tipoMovimiento: 'SALIDA', cantidad: item.cantidad,
          referenciaId: ordenId, referenciaTipo: 'ORDEN_VENTA', createdBy: adminId
        }
      });
    }
  }

  async liberarStockReservado(tx: Prisma.TransactionClient, items: { productoId: string, cantidad: number }[]) {
    for (const item of items) {
      await tx.invStockProducto.update({
        where: { productoId: item.productoId },
        data: { stockReservado: { decrement: item.cantidad } }
      });
    }
  }

  async vaciarCarrito(tx: Prisma.TransactionClient, carritoId: string) {
    await tx.ordItemCarrito.deleteMany({ where: { carritoId } });
  }
}