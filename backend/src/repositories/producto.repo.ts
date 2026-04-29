import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { FiltroProductoDto, CrearProductoDto } from '../schemas/producto.schema';

const DEFAULT_PRODUCT_IMAGE_URL = '/images/default.svg';

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
        // Solo reemplazar imágenes si viene un array CON elementos (array vacío = "no cambiar")
        imagenes: (imagenes && imagenes.length > 0) ? {
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
    const search = dto.search as string | undefined;
    const categoriaId = dto.categoriaId as string | undefined;
    const estado = dto.estado as string | undefined;
    const orderBy = (dto.orderBy as string | undefined) ?? 'createdAt_DESC';
    const skip = (page - 1) * limit;

    const where: Prisma.CatProductoWhereInput = {
      activo: true,
      ...(categoriaId && { categoriaId }),
      ...(estado && { estado: estado as any }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const orderMapping: Record<string, any> = {
      createdAt_DESC: { created_at: 'desc' },
      createdAt_ASC:  { created_at: 'asc' },
      nombre_ASC:     { nombre: 'asc' },
      nombre_DESC:    { nombre: 'desc' },
      precioVenta_ASC:  { precioVenta: 'asc' },
      precioVenta_DESC: { precioVenta: 'desc' },
    };

    const [data, total] = await Promise.all([
      prisma.catProducto.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderMapping[orderBy] ?? { created_at: 'desc' },
        include: {
          categoria: { select: { id: true, nombre: true } },
          imagenes: { orderBy: { orden: 'asc' }, select: { id: true, url: true, orden: true } },
          stock: { select: { stockFisico: true, stockMinimo: true, stockReservado: true } }
        }
      }),
      prisma.catProducto.count({ where })
    ]);

    return { data, total, page, limit };
  }
}