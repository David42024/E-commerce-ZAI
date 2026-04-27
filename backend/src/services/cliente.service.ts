import { PrismaClient } from '@prisma/client';
import { ClienteRepository } from '../repositories/cliente.repo';
import { HttpError } from '../middlewares/errorHandler';
import { UpdatePerfilDto, CrearDireccionDto } from '../schemas/cliente.schema';

const prisma = new PrismaClient();

export class ClienteService {
  private repo = new ClienteRepository();

  async getPerfil(usuarioId: string) {
    let cliente = await this.repo.findPerfilByUserId(usuarioId);
    
    // Si no existe el perfil de cliente (posible en admins creados manualmente)
    // intentamos buscar el usuario y devolver un perfil básico
    if (!cliente) {
      const usuario = await prisma.segUsuario.findUnique({
        where: { id: usuarioId },
        select: { correo: true, activo: true }
      });

      if (!usuario) throw new HttpError(404, 'Usuario no encontrado');

      return {
        id: null,
        usuarioId,
        nombre: '',
        apellido: '',
        telefono: '',
        documentoIdentidad: '',
        usuario
      };
    }
    return cliente;
  }

  async updatePerfil(usuarioId: string, dto: UpdatePerfilDto) {
    let cliente = await this.repo.findPerfilByUserId(usuarioId);
    
    if (!cliente) {
      // Si no existe, lo creamos
      return prisma.cliCliente.create({
        data: {
          usuarioId,
          nombre: dto.nombre || '',
          apellido: dto.apellido || '',
          telefono: dto.telefono,
          documentoIdentidad: dto.documentoIdentidad
        }
      });
    }
    
    return this.repo.updatePerfil(cliente.id, dto);
  }

  async toggleListaDeseos(clienteId: string, productoId: string) {
    const lista = await this.repo.findOrCreateListaDeseos(clienteId);
    const existe = await this.repo.findItemListaDeseos(lista.id, productoId);

    // Transacción simple para asegurar atomicidad en el check & update
    return await prisma.$transaction(async (tx) => {
      if (existe) {
        await this.repo.removeItemListaDeseos(tx, lista.id, productoId);
        return { accion: 'eliminado' };
      } else {
        await this.repo.addItemListaDeseos(tx, lista.id, productoId);
        return { accion: 'agregado' };
      }
    });
  }

  async agregarDireccion(clienteId: string, dto: CrearDireccionDto) {
    return this.repo.createDireccion(clienteId, dto);
  }

  async listarAdmin(params: { page: number, limit: number, search: string }) {
    return this.repo.findAll(params);
  }

  async obtenerDetalleAdmin(id: string) {
    const cliente = await this.repo.findByIdFull(id);
    if (!cliente) throw new HttpError(404, 'Cliente no encontrado');
    return cliente;
  }
}