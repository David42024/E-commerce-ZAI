import { z } from 'zod';
export const agregarItemSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: z.number().int().positive().default(1),
});
export type AgregarItemDto = z.infer<typeof agregarItemSchema>;