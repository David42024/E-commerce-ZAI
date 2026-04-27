import { z } from 'zod';

export const loginSchema = z.object({
  correo: z.string().email('Formato de correo inválido'),
  contrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registroSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  apellido: z.string().min(2, 'El apellido es requerido'),
  correo: z.string().email('Formato de correo inválido'),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
               .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
               .regex(/[0-9]/, 'Debe contener al menos un número'),
  documentoIdentidad: z.string().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegistroDto = z.infer<typeof registroSchema>;