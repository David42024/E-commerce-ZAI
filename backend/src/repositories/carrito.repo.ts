import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CarritoRepository {
  
  /**
   * Obtiene el carrito del cliente con sus items y detalles del producto
   */
  async findByCliente(clienteId: string) {
    return prisma.ordCarrito.findUnique({
      where: { clienteId },
      include: { 
        items: { 
          include: { 
            producto: { 
              include: { 
                imagenes: { take: 1, orderBy: { orden: 'asc' } },
                stock: true // Necesario para saber si hay stock disponible
              } 
            } 
          } 
        } 
      }
    });
  }

  /**
   * Crea el carrito si no existe, o actualiza su fecha si ya existe
   */
  async upsertCarrito(clienteId: string) {
    return prisma.ordCarrito.upsert({
      where: { clienteId },
      update: { updated_at: new Date() },
      create: { clienteId },
    });
  }

  /**
   * Agrega un item o incrementa su cantidad si ya existe
   */
  async agregarItem(carritoId: string, productoId: string, cantidad: number, precioUnitario: number) {
    const itemExistente = await prisma.ordItemCarrito.findFirst({
      where: { carritoId, productoId }
    });

    if (itemExistente) {
      return prisma.ordItemCarrito.update({
        where: { id: itemExistente.id },
        data: { cantidad: { increment: cantidad } }
      });
    }

    return prisma.ordItemCarrito.create({
      data: { carritoId, productoId, cantidad, precioUnitario },
    });
  }

  /**
   * Busca un item puntual del carrito para validar límites de cantidad.
   */
  async findItem(carritoId: string, productoId: string) {
    return prisma.ordItemCarrito.findUnique({
      where: {
        carritoId_productoId: { carritoId, productoId }
      }
    });
  }

  /**
   * Elimina un item específico del carrito buscando por clienteId (evita exponer el carritoId al frontend)
   */
  async eliminarItem(clienteId: string, productoId: string) {
    // 1. Buscar el carrito del cliente
    const carrito = await prisma.ordCarrito.findUnique({ where: { clienteId } });
    
    if (!carrito) {
      // Idempotente: si no existe carrito, no hay item que eliminar.
      return { count: 0 };
    }

    // 2. Eliminar el item específico de ese carrito
    return prisma.ordItemCarrito.deleteMany({
      where: { 
        carritoId: carrito.id, 
        productoId 
      }
    });
  }

  /**
   * Vacía todo el carrito del cliente buscando por clienteId
   */
  async limpiarCarritoByClienteId(clienteId: string) {
    const carrito = await prisma.ordCarrito.findUnique({ where: { clienteId } });
    
    if (!carrito) {
      // Hacer la operación idempotente: si no existe carrito, no es error.
      return { count: 0 };
    }

    return prisma.ordItemCarrito.deleteMany({ 
      where: { carritoId: carrito.id } 
    });
  }

  /**
   * Vacía el carrito usando directamente el carritoId 
   * (Se usa internamente dentro de la transacción de crear Orden, donde ya tenemos el ID)
   */
  async vaciarCarrito(carritoId: string) {
    return prisma.ordItemCarrito.deleteMany({ 
      where: { carritoId } 
    });
  }
}