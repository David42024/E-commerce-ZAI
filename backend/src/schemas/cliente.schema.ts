import { z } from 'zod';

// Para PUT /api/v1/clientes/perfil (Body)
export const updatePerfilSchema = z.object({
  nombre: z.string().min(2).optional(),
  apellido: z.string().min(2).optional(),
  telefono: z.string().regex(/^\d{9}$/, 'El teléfono debe tener 9 dígitos').optional(),
  documentoIdentidad: z.string().regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos').optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar'
});

// Para POST /api/v1/clientes/direcciones (Body)
export const crearDireccionSchema = z.object({
  alias: z.string().max(50).optional(),
  nombreReceptor: z.string().min(2, 'Nombre del receptor requerido'),
  direccion: z.string().min(10, 'La dirección es muy corta'),
  ciudad: z.string().min(2),
  departamento: z.string().min(2),
  codigoPostal: z.string().optional(),
  telefonoReceptor: z.string().regex(/^\d{9}$/, 'El teléfono debe tener 9 dígitos'),
  esPrincipal: z.boolean().default(false),
});

export type UpdatePerfilDto = z.infer<typeof updatePerfilSchema>;
export type CrearDireccionDto = z.infer<typeof crearDireccionSchema>;