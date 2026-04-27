import { z } from 'zod';

export const CrearUsuarioDto = z.object({
  correo: z.string().email('Correo inválido'),
  contrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  activo: z.boolean().optional().default(true),
  roles: z.array(z.number()).min(1, 'Debe asignar al menos un rol'),
});

export const ActualizarUsuarioDto = z.object({
  correo: z.string().email('Correo inválido').optional(),
  contrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  activo: z.boolean().optional(),
  roles: z.array(z.number()).optional(),
});

export type CrearUsuarioDto = z.infer<typeof CrearUsuarioDto>;
export type ActualizarUsuarioDto = z.infer<typeof ActualizarUsuarioDto>;
