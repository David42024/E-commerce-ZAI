import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { OrdenRepository } from '../repositories/orden.repo';
import { CarritoRepository } from '../repositories/carrito.repo';
import { ClienteRepository } from '../repositories/cliente.repo';
import { HttpError } from '../middlewares/errorHandler';
import { FiltroOrdenDto, CambiarEstadoDto, CrearOrdenDto } from '../schemas/orden.schema';

const MOCK_METODO_ENVIO_STANDARD = '11111111-1111-1111-1111-111111111111';
const MOCK_METODO_ENVIO_EXPRESS = '22222222-2222-2222-2222-222222222222';

export class OrdenService {
  private ordenRepo = new OrdenRepository();
  private carritoRepo = new CarritoRepository();
  private clienteRepo = new ClienteRepository();

  private async getClienteIdByUsuario(usuarioId: string) {
    const cliente = await this.clienteRepo.findPerfilByUserId(usuarioId);
    if (!cliente) throw new HttpError(404, 'Perfil de cliente no encontrado');
    return cliente.id;
  }

  async listarOrdenes(dto: FiltroOrdenDto, usuarioId?: string) {
    if (!usuarioId) {
      return this.ordenRepo.findWithFilters(dto);
    }
    const clienteId = await this.getClienteIdByUsuario(usuarioId);
    return this.ordenRepo.findWithFilters(dto, clienteId);
  }

  async obtenerDetalleOrden(id: string) {
    const orden = await this.ordenRepo.findByIdFull(id);
    if (!orden) throw new HttpError(404, 'Orden no encontrada');
    return orden;
  }

  async crearOrden(usuarioId: string, metodoEnvioId: string, direccionData: CrearOrdenDto['direccionEnvio'], metodoPago: CrearOrdenDto['metodoPago'], notasCliente?: string) {
    const cliente = await this.clienteRepo.findPerfilByUserId(usuarioId);
    if (!cliente) throw new HttpError(404, 'Perfil de cliente no encontrado');
    const clienteId = cliente.id;
    
    const carrito = await this.carritoRepo.findByCliente(clienteId);
    if (!carrito || carrito.items.length === 0) throw new HttpError(400, 'El carrito está vacío');

    // Si el frontend envía un UUID mock o inactivo, usar un método activo de respaldo.
    const metodoEnvioSeleccionado = await prisma.ordMetodoEnvio.findFirst({
      where: { id: metodoEnvioId, activo: true },
      select: { id: true, precioBase: true }
    });

    const metodoEnvioDefault = metodoEnvioSeleccionado ?? await prisma.ordMetodoEnvio.findFirst({
      where: { activo: true },
      orderBy: metodoEnvioId === MOCK_METODO_ENVIO_EXPRESS
        ? { precioBase: 'desc' }
        : { precioBase: 'asc' },
      select: { id: true, precioBase: true }
    });

    if (!metodoEnvioDefault) {
      throw new HttpError(400, 'No hay métodos de envío activos configurados');
    }

    const IGV = 0.18;
    let subtotal = 0;
    const stockItemsToReserve: { productoId: string, stockId: string, cantidad: number }[] = [];

    for (const item of carrito.items) {
      if (!item.producto.stock) {
        throw new HttpError(400, `El producto ${item.producto.nombre} no tiene stock configurado`);
      }
      const stockReal = item.producto.stock.stockFisico - item.producto.stock.stockReservado;
      if (stockReal < item.cantidad) throw new HttpError(409, `Stock insuficiente para ${item.producto.nombre}`);
      stockItemsToReserve.push({ productoId: item.productoId, stockId: item.producto.stock.id, cantidad: item.cantidad });
      subtotal += Number(item.precioUnitario) * item.cantidad;
    }

    const totalEnvio = metodoEnvioId === MOCK_METODO_ENVIO_EXPRESS
      ? 15
      : metodoEnvioId === MOCK_METODO_ENVIO_STANDARD
        ? 0
        : Number(metodoEnvioDefault.precioBase || 0);
    const totalFinal = subtotal + (subtotal * IGV) + totalEnvio;

    // Validación de Crédito
    if (metodoPago === 'CREDITO') {
      const limite = Number(cliente.limiteCredito || 0);
      const saldo = Number(cliente.saldoDeudor || 0);
      const disponible = limite - saldo;
      
      if (totalFinal > disponible) {
        throw new HttpError(400, `Crédito insuficiente. Disponible: S/ ${disponible.toFixed(2)}, Requerido: S/ ${totalFinal.toFixed(2)}`);
      }
    }

    // El SERVICE orquesta la transacción, pero delega la ejecución al REPOSITORY pasando 'tx'
    return await prisma.$transaction(async (tx) => {
      const estadoPendiente = await tx.ordEstadoOrden.findFirst({
        where: { nombre: 'PENDIENTE' },
        select: { id: true }
      });

      if (!estadoPendiente) {
        throw new HttpError(500, 'No existe el estado de orden PENDIENTE. Ejecute el seed de la base de datos.');
      }

      await this.ordenRepo.reservarStock(tx, stockItemsToReserve);
      const dirEnvio = await this.ordenRepo.createDireccion(tx, direccionData);
      
      const count = await tx.ordOrden.count();
      const numeroOrden = `ORD-${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;

      const orden = await this.ordenRepo.createOrden(tx, {
        clienteId, numeroOrden, direccionEnvioId: dirEnvio.id, metodoEnvioId: metodoEnvioDefault.id,
        estadoOrdenId: estadoPendiente.id,
        subtotal,
        porcentajeIgv: IGV * 100,
        montoIgv: subtotal * IGV,
        totalEnvio,
        totalFinal,
        notasCliente,
        items: {
          create: carrito.items.map(item => ({
            productoId: item.productoId,
            nombreProducto: item.producto.nombre,
            sku: item.producto.sku,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: Number(item.precioUnitario) * item.cantidad
          }))
        }
      });

      // Registrar el Pago
      await tx.ordPago.create({
        data: {
          ordenId: orden.id,
          metodoPago: metodoPago as any,
          estado: metodoPago === 'CREDITO' ? 'APROBADO' : 'PENDIENTE',
          montoPagado: totalFinal
        }
      });

      // Si es crédito, actualizar saldo deudor del cliente
      if (metodoPago === 'CREDITO') {
        await tx.cliCliente.update({
          where: { id: clienteId },
          data: { saldoDeudor: { increment: totalFinal } }
        });
      }

      await this.ordenRepo.createHistorialEstado(tx, { ordenId: orden.id, estadoOrdenId: estadoPendiente.id, comentario: 'Orden creada' });
      await this.ordenRepo.vaciarCarrito(tx, carrito.id);

      return orden;
    }, { timeout: 10000 });
  }

  async cambiarEstado(ordenId: string, dto: CambiarEstadoDto, adminId: string) {
    const [orden, nuevoEstado, adminUser] = await Promise.all([
      this.ordenRepo.findByIdFull(ordenId),
      prisma.ordEstadoOrden.findUnique({ where: { id: dto.nuevoEstadoId } }),
      prisma.segUsuario.findUnique({ where: { id: adminId } })
    ]);

    if (!orden) throw new HttpError(404, 'Orden no encontrada');
    if (!nuevoEstado) throw new HttpError(400, `El estado con ID ${dto.nuevoEstadoId} no existe`);
    if (!adminUser) throw new HttpError(401, 'Usuario administrador no válido o no encontrado');

    return await prisma.$transaction(async (tx) => {
      await this.ordenRepo.createHistorialEstado(tx, { 
        ordenId, 
        estadoOrdenId: dto.nuevoEstadoId, 
        usuarioAccion: adminId, 
        comentario: dto.comentario 
      });

      // Lógica basada en el NOMBRE del estado, no en IDs hardcodeados
      if (nuevoEstado.nombre === 'PAGADA') { 
        const itemsToUpdate = orden.items.map(i => {
          if (!i.producto.stock) {
            throw new HttpError(400, `El producto ${i.nombreProducto} no tiene stock configurado`);
          }
          return { productoId: i.productoId, stockId: i.producto.stock.id, cantidad: i.cantidad };
        });
        await this.ordenRepo.confirmarVentaYDescontarStock(tx, itemsToUpdate, ordenId, adminId);
      } else if (nuevoEstado.nombre === 'CANCELADA' && orden.estado?.nombre === 'PENDIENTE') {
        await this.ordenRepo.liberarStockReservado(tx, orden.items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })));
        
        // Si el pago fue con CRÉDITO, devolver saldo al cliente
        if (orden.pago?.metodoPago === 'CREDITO') {
          await tx.cliCliente.update({
            where: { id: orden.clienteId },
            data: { saldoDeudor: { decrement: orden.totalFinal } }
          });
        }
      }
      
      await tx.ordOrden.update({ 
        where: { id: ordenId }, 
        data: { estadoOrdenId: dto.nuevoEstadoId } 
      });
      
      return { success: true };
    });
  }
}