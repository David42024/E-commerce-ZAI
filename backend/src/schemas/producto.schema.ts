import { z } from 'zod';

export const filtroProductoSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(48).default(12),
  search: z.string().optional(),
  categoriaId: z.string().uuid().optional(),
  marcaId: z.string().uuid().optional(),
  precioMin: z.coerce.number().nonnegative().optional(),
  precioMax: z.coerce.number().nonnegative().optional(),
  estado: z.enum(['BORRADOR', 'ACTIVO', 'INACTIVO']).optional(),
  orderBy: z.enum(['nombre_asc', 'nombre_desc', 'precio_asc', 'precio_desc', 'created_at_desc']).default('created_at_desc'),
});

export const crearProductoSchema = z.object({
  sku: z.string().min(3),
  nombre: z.string().min(5),
  descripcionCorta: z.string().optional(),
  descripcionLarga: z.string().optional(),
  categoriaId: z.string().uuid(),
  subcategoriaId: z.string().uuid().optional(),
  marcaId: z.string().uuid().optional(),
  unidadMedidaId: z.string().uuid(),
  precioCosto: z.number().nonnegative().default(0),
  precioVenta: z.number().positive(),
  precioOferta: z.number().nonnegative().optional(),
  fechaInicioOferta: z.string().datetime().optional(),
  fechaFinOferta: z.string().datetime().optional(),
  peso: z.number().positive().optional(),
  estado: z.enum(['BORRADOR', 'ACTIVO', 'INACTIVO']).optional(),
  stockFisico: z.number().int().nonnegative().optional(),
  stockMinimo: z.number().int().nonnegative().optional(),
  atributos: z.array(z.object({
    valorAtributoId: z.string().uuid(),
  })).optional(),
  imagenes: z.array(z.object({
    url: z.string().min(1),
    orden: z.number().int().min(0).default(0),
  })).optional(),
});

export type FiltroProductoDto = z.infer<typeof filtroProductoSchema>;
export type CrearProductoDto = z.infer<typeof crearProductoSchema>;