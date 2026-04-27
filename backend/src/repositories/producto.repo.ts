import { PrismaClient, Prisma } from '@prisma/client';
import { FiltroProductoDto, CrearProductoDto } from '../schemas/producto.schema';

const prisma = new PrismaClient();

const DEFAULT_PRODUCT_IMAGE_URL = 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg';

export class ProductoRepository {
  
  // Búsqueda Fuzzy usando pg_trgm (Requiere query raw por operador personalizado)
  async findWithFilters(dto: FiltroProductoDto) {
    const { page, limit, search, categoriaId, marcaId, precioMin, precioMax, estado, orderBy } = dto;
    const skip = (page - 1) * limit;

    let whereClause: Prisma.CatProductoWhereInput = {
      estado: estado || 'ACTIVO',
      activo: true,
      ...(categoriaId && { categoriaId }),
      ...(marcaId && { marcaId }),
      ...(precioMin !== undefined && precioMax !== undefined && { precioVenta: { gte: precioMin, lte: precioMax } }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } }, // Fallback standard
        ]
      })
    };

    const orderMapping: any = {
      nombre_asc: { nombre: 'asc' }, nombre_desc: { nombre: 'desc' },
      precio_asc: { precioVenta: 'asc' }, precio_desc: { precioVenta: 'desc' },
      created_at_desc: { created_at: 'desc' }
    };

    const [data, total] = await Promise.all([
      prisma.catProducto.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: orderMapping[orderBy],
        include: {
          imagenes: { orderBy: { orden: 'asc' }, select: { id: true, url: true, orden: true } },
          marca: { select: { nombre: true } },
          stock: { select: { stockFisico: true, stockReservado: true } }
        }
      }),
      prisma.catProducto.count({ where: whereClause })
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    return prisma.catProducto.findUnique({
      where: { id, activo: true },
      include: {
        imagenes: { orderBy: { orden: 'asc' } },
        categoria: true,
        subcategoria: true,
        marca: true,
        atributos: { include: { valorAtributo: { include: { atributo: true } } } },
        stock: true,
        resenas: { where: { activo: true }, take: 5, orderBy: { created_at: 'desc' } }
      }
    });
  }

  async create(data: CrearProductoDto, slug: string, createdBy: string) {
    const imagenesToCreate = (data as any).imagenes?.length
      ? (data as any).imagenes
      : [{ url: DEFAULT_PRODUCT_IMAGE_URL, orden: 0 }];

    return prisma.catProducto.create({
      data: {
        sku: data.sku,
        nombre: data.nombre,
        descripcionCorta: data.descripcionCorta,
        descripcionLarga: data.descripcionLarga,
        categoriaId: data.categoriaId,
        subcategoriaId: data.subcategoriaId,
        marcaId: data.marcaId,
        unidadMedidaId: data.unidadMedidaId,
        precioCosto: data.precioCosto,
        precioVenta: data.precioVenta,
        precioOferta: data.precioOferta,
        peso: data.peso,
        estado: data.estado || 'ACTIVO',
        slug,
        fechaInicioOferta: data.fechaInicioOferta ? new Date(data.fechaInicioOferta) : null,
        fechaFinOferta: data.fechaFinOferta ? new Date(data.fechaFinOferta) : null,
        createdBy,
        imagenes: { create: imagenesToCreate },
        atributos: data.atributos ? { create: data.atributos } : undefined,
        stock: { create: { 
          stockFisico: (data as any).stockFisico ?? 0, 
          stockReservado: 0, 
          stockMinimo: (data as any).stockMinimo ?? 5 
        } }
      }
      ,
      include: {
        imagenes: { orderBy: { orden: 'asc' }, select: { id: true, url: true, orden: true } },
        stock: { select: { stockFisico: true, stockReservado: true, stockMinimo: true } },
        categoria: { select: { id: true, nombre: true } },
      }
    });
  }

  async update(id: string, dto: Partial<CrearProductoDto> & { stockFisico?: number, stockMinimo?: number }, slug?: string) {
    const { imagenes, atributos, stockFisico, stockMinimo, ...rest } = dto;
    
    return prisma.catProducto.update({
      where: { id },
      data: {
        ...rest,
        ...(slug && { slug }),
        fechaInicioOferta: dto.fechaInicioOferta ? new Date(dto.fechaInicioOferta) : undefined,
        fechaFinOferta: dto.fechaFinOferta ? new Date(dto.fechaFinOferta) : undefined,
        imagenes: imagenes ? {
          deleteMany: {},
          create: imagenes
        } : undefined,
        atributos: atributos ? {
          deleteMany: {},
          create: atributos
        } : undefined,
        stock: (stockFisico !== undefined || stockMinimo !== undefined) ? {
          update: {
            ...(stockFisico !== undefined && { stockFisico }),
            ...(stockMinimo !== undefined && { stockMinimo })
          }
        } : undefined
      }
    });
  }

  async delete(id: string) {
    return prisma.catProducto.update({
      where: { id },
      data: { activo: false }
    });
  }

  async findForAdmin(dto: any) {
    const page = Number(dto.page ?? 1);
    const limit = Number(dto.limit ?? 10);
    const search = dto.search;
    const skip = (page - 1) * limit;

    const where: Prisma.CatProductoWhereInput = {
      activo: true,
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [data, total] = await Promise.all([
      prisma.catProducto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          categoria: { select: { nombre: true } },
          imagenes: { orderBy: { orden: 'asc' }, select: { id: true, url: true, orden: true } },
          stock: { select: { stockFisico: true, stockMinimo: true } }
        }
      }),
      prisma.catProducto.count({ where })
    ]);

    return { data, total, page, limit };
  }
}