import { ProductoRepository } from '../repositories/producto.repo';
import { CrearProductoDto, FiltroProductoDto } from '../schemas/producto.schema';
import { HttpError } from '../middlewares/errorHandler';

function generateSlug(nombre: string): string {
  return nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, "");
}

export class ProductoService {
  private repo = new ProductoRepository();

  async obtenerCatalogo(dto: FiltroProductoDto) {
    return this.repo.findWithFilters(dto);
  }

  async obtenerDetalle(id: string) {
    const producto = await this.repo.findById(id);
    if (!producto) throw new HttpError(404, 'Producto no encontrado');
    
    const stockDisponible = (producto.stock?.stockFisico || 0) - (producto.stock?.stockReservado || 0);
    return {
      ...producto,
      stockDisponible,
      tieneDescuento: producto.precioOferta && producto.fechaInicioOferta && producto.fechaFinOferta 
                      ? new Date() >= producto.fechaInicioOferta && new Date() <= producto.fechaFinOferta 
                      : false
    };
  }

  async crearProducto(dto: CrearProductoDto, adminId: string) {
    const slug = generateSlug(dto.nombre);
    return this.repo.create(dto, slug, adminId);
  }

  async actualizarProducto(id: string, dto: Partial<CrearProductoDto>) {
    const slug = dto.nombre ? generateSlug(dto.nombre) : undefined;
    return this.repo.update(id, dto, slug);
  }

  async eliminarProducto(id: string) {
    return this.repo.delete(id);
  }

  async listarParaAdmin(dto: any) {
    return this.repo.findForAdmin(dto);
  }
}