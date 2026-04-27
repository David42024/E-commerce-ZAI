import { z } from 'zod';

// Para POST /api/v1/inventario/ajustes/:productoId (Body)
export const ajusteInventarioSchema = z.object({
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
  tipo: z.enum(['GANANCIA', 'PERDIDA'], { errorMap: () => ({ message: 'Tipo debe ser GANANCIA o PERDIDA' }) }),
  motivo: z.string().min(5, 'El motivo debe tener al menos 5 caracteres (ej: "Merma por daño en transporte")'),
});

// Para GET /api/v1/inventario/alertas (Query Params - por si se necesita paginación)
export const filtroAlertaSchema = z.object({
  categoriaId: z.string().uuid().optional(),
  marcaId: z.string().uuid().optional(),
});

export type AjusteInventarioDto = z.infer<typeof ajusteInventarioSchema>;
export type FiltroAlertaDto = z.infer<typeof filtroAlertaSchema>;