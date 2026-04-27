import { PrismaClient, SegUsuario } from '@prisma/client';
import { RegistroDto } from '../schemas/auth.schema';

const prisma = new PrismaClient();

export class AuthRepository {
  
  async findByCorreo(correo: string) {
    return prisma.segUsuario.findUnique({
      where: { correo },
      include: {
        roles: {
          include: { rol: { include: { permisos: { include: { permiso: true } } } } }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.segUsuario.findUnique({
      where: { id },
      select: { id: true, correo: true, activo: true }
    });
  }

  async createUsuario(data: RegistroDto, contrasenaHash: string) {
    return prisma.$transaction(async (tx) => {
      try {
        // 1. Crear usuario base
        const usuario = await tx.segUsuario.create({
          data: {
            correo: data.correo,
            contrasenaHash,
          }
        });

        // 2. Crear perfil de cliente asociado
        await tx.cliCliente.create({
          data: {
            usuarioId: usuario.id,
            nombre: data.nombre,
            apellido: data.apellido,
            documentoIdentidad: data.documentoIdentidad,
          }
        });

        // 3. Asignar rol por defecto (CLIENTE)
        const rolCliente = await tx.segRol.findFirst({
          where: { nombre: 'CLIENTE' }
        });

        if (!rolCliente) {
          throw new Error('Rol CLIENTE no encontrado en la base de datos');
        }

        await tx.segUsuarioRol.create({
          data: {
            usuarioId: usuario.id,
            rolId: rolCliente.id, 
          }
        });

        return usuario;
      } catch (e) {
        console.error('Error en createUsuario transaction:', e);
        throw e;
      }
    });
  }
}