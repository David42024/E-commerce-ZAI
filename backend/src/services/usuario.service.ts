import { UsuarioRepository } from '../repositories/usuario.repo';
import { CrearUsuarioDto, ActualizarUsuarioDto } from '../schemas/usuario.schema';
import bcrypt from 'bcryptjs';
import { HttpError } from '../middlewares/errorHandler';

export class UsuarioService {
  private repo = new UsuarioRepository();

  async listar() {
    return this.repo.listar();
  }

  async findById(id: string) {
    const usuario = await this.repo.findById(id);
    if (!usuario) throw new HttpError(404, 'Usuario no encontrado');
    return usuario;
  }

  async crear(data: CrearUsuarioDto) {
    const hash = await bcrypt.hash(data.contrasena, 10);
    return this.repo.crear(data, hash);
  }

  async actualizar(id: string, data: ActualizarUsuarioDto) {
    let hash;
    if (data.contrasena) {
      hash = await bcrypt.hash(data.contrasena, 10);
    }
    return this.repo.actualizar(id, data, hash);
  }

  async listarRoles() {
    return this.repo.listarRoles();
  }
}
