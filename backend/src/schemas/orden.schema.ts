import { z } from 'zod';

export const crearOrdenSchema = z.object({
  metodoEnvioId: z.string().uuid('ID de método de envío inválido'),
  metodoPago: z.enum(['TARJETA', 'TRANSFERENCIA', 'CONTRA_ENTREGA', 'CREDITO']).default('TARJETA'),
  direccionEnvio: z.object({
    alias: z.string().optional(),
    nombreReceptor: z
      .string()
      .trim()
      .min(3, 'El nombre de la persona es muy corto (mínimo 3 caracteres)'),
    direccion: z
      .string()
      .trim()
      .min(10, 'La dirección es muy corta (mínimo 10 caracteres)'),
    ciudad: z
      .string()
      .trim()
      .min(2, 'La ciudad es obligatoria y debe tener al menos 2 caracteres'),
    departamento: z
      .string()
      .trim()
      .min(2, 'El departamento es obligatorio y debe tener al menos 2 caracteres'),
    codigoPostal: z.string().optional(),
    telefonoReceptor: z
      .string()
      .trim()
      .min(6, 'El número telefónico es muy corto (mínimo 6 caracteres)')
      .max(20, 'El número telefónico es demasiado largo (máximo 20 caracteres)')
      .regex(/^\+?[0-9 ]+$/, 'El teléfono debe tener como máximo un "+" al inicio y luego solo números o espacios'),
  }),
  notasCliente: z.string().optional(),
});

export const filtroOrdenSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().optional(),
  estado: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
});

export const cambiarEstadoSchema = z.object({
  nuevoEstadoId: z.number().int().positive(),
  comentario: z.string().min(5, 'El comentario del cambio de estado es obligatorio'),
});

export type CrearOrdenDto = z.infer<typeof crearOrdenSchema>;
export type FiltroOrdenDto = z.infer<typeof filtroOrdenSchema>;
export type CambiarEstadoDto = z.infer<typeof cambiarEstadoSchema>;