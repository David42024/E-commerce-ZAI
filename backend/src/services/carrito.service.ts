import { CarritoRepository } from '../repositories/carrito.repo';
import { ProductoRepository } from '../repositories/producto.repo';
import { ClienteRepository } from '../repositories/cliente.repo';
import { HttpError } from '../middlewares/errorHandler';
import { AgregarItemDto } from '../schemas/carrito.schema';

export class CarritoService {
  private carritoRepo = new CarritoRepository();
  private productoRepo = new ProductoRepository();
  private clienteRepo = new ClienteRepository();

  private async getClienteIdByUsuario(usuarioId: string) {
    const cliente = await this.clienteRepo.findPerfilByUserId(usuarioId);
    if (!cliente) throw new HttpError(404, 'Perfil de cliente no encontrado');
    return cliente.id;
  }

  async obtenerMiCarrito(usuarioId: string) {
    const clienteId = await this.getClienteIdByUsuario(usuarioId);
    const carrito = await this.carritoRepo.findByCliente(clienteId);
    if (!carrito) return { items: [], subtotal: 0 };
    const subtotal = carrito.items.reduce((sum, item) => sum + (Number(item.precioUnitario) * item.cantidad), 0);
    return { ...carrito, subtotal };
  }

  async agregarItem(usuarioId: string, dto: AgregarItemDto) {
    const clienteId = await this.getClienteIdByUsuario(usuarioId);
    const producto = await this.productoRepo.findById(dto.productoId);
    if (!producto) throw new HttpError(404, 'Producto no encontrado');
    if (!producto.stock) throw new HttpError(400, 'El producto no tiene stock configurado');
    
    const stockDisponible = producto.stock.stockFisico - producto.stock.stockReservado;

    const carrito = await this.carritoRepo.upsertCarrito(clienteId);
    const itemExistente = await this.carritoRepo.findItem(carrito.id, dto.productoId);
    const cantidadActualEnCarrito = itemExistente?.cantidad || 0;
    const cantidadSolicitadaTotal = cantidadActualEnCarrito + dto.cantidad;

    if (cantidadSolicitadaTotal > stockDisponible) {
      throw new HttpError(
        409,
        `Stock insuficiente. Disponible: ${stockDisponible}, en carrito: ${cantidadActualEnCarrito}`
      );
    }

    await this.carritoRepo.agregarItem(carrito.id, dto.productoId, dto.cantidad, Number(producto.precioVenta));
    return this.obtenerMiCarrito(usuarioId);
  }

  async eliminarItem(usuarioId: string, productoId: string) {
    const clienteId = await this.getClienteIdByUsuario(usuarioId);
    await this.carritoRepo.eliminarItem(clienteId, productoId);
    return this.obtenerMiCarrito(usuarioId);
  }

  async vaciarCarrito(usuarioId: string) {
    const clienteId = await this.getClienteIdByUsuario(usuarioId);
    return this.carritoRepo.limpiarCarritoByClienteId(clienteId);
  }
}