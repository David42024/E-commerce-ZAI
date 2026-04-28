import prisma from '../lib/prisma';
import { CrearUsuarioDto, ActualizarUsuarioDto } from '../schemas/usuario.schema';

export class UsuarioRepository {
  async listar() {
    return prisma.segUsuario.findMany({
      select: {
        id: true,
        correo: true,
        activo: true,
        created_at: true,
        updated_at: true,
        roles: {
          include: {
            rol: true
          }
        },
        cliente: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findById(id: string) {
    return prisma.segUsuario.findUnique({
      where: { id },
      include: {
        roles: { include: { rol: true } },
        cliente: true
      }
    });
  }

  async crear(data: CrearUsuarioDto, contrasenaHash: string) {
    return prisma.$transaction(async (tx) => {
      const usuario = await tx.segUsuario.create({
        data: {
          correo: data.correo,
          contrasenaHash,
          activo: data.activo
        }
      });

      if (data.roles && data.roles.length > 0) {
        await tx.segUsuarioRol.createMany({
          data: data.roles.map(rolId => ({
            usuarioId: usuario.id,
            rolId
          }))
        });
      }

      return usuario;
    });
  }

  async actualizar(id: string, data: ActualizarUsuarioDto, contrasenaHash?: string) {
    return prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.correo) updateData.correo = data.correo;
      if (data.activo !== undefined) updateData.activo = data.activo;
      if (contrasenaHash) updateData.contrasenaHash = contrasenaHash;

      const usuario = await tx.segUsuario.update({
        where: { id },
        data: updateData
      });

      if (data.roles) {
        // Eliminar roles anteriores
        await tx.segUsuarioRol.deleteMany({
          where: { usuarioId: id }
        });

        // Asignar nuevos roles
        await tx.segUsuarioRol.createMany({
          data: data.roles.map(rolId => ({
            usuarioId: id,
            rolId
          }))
        });
      }

      return usuario;
    });
  }

  async listarRoles() {
    return prisma.segRol.findMany();
  }
}
