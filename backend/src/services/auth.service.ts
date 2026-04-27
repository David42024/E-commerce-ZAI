import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { config } from '../config';
import { AuthRepository } from '../repositories/auth.repo';
import { LoginDto, RegistroDto } from '../schemas/auth.schema';
import { HttpError } from '../middlewares/errorHandler';

const SALT_ROUNDS = 12;

export class AuthService {
  private repository = new AuthRepository();

  async registro(dto: RegistroDto) {
    const existingUser = await this.repository.findByCorreo(dto.correo);
    if (existingUser) throw new HttpError(409, 'El correo electrónico ya está registrado.');

    const contrasenaHash = await bcrypt.hash(dto.contrasena, SALT_ROUNDS);
    const usuario = await this.repository.createUsuario(dto, contrasenaHash);
    const tokens = this.generateTokens(usuario.id, ['CLIENTE'], []);
    
    return { usuario: { id: usuario.id, correo: usuario.correo }, ...tokens };
  }

  async login(dto: LoginDto) {
    const usuario = await this.repository.findByCorreo(dto.correo);
    if (!usuario || !usuario.contrasenaHash) throw new HttpError(401, 'Credenciales inválidas.');
    if (!usuario.activo) throw new HttpError(403, 'Su cuenta ha sido desactivada.');

    const contrasenaValida = await bcrypt.compare(dto.contrasena, usuario.contrasenaHash);
    if (!contrasenaValida) throw new HttpError(401, 'Credenciales inválidas.');

    const roles = usuario.roles.map((r: { rol: { nombre: string } }) => r.rol.nombre);
    const permisos = usuario.roles.flatMap((r: { rol: { permisos: Array<{ permiso: { nombre: string } }> } }) => r.rol.permisos.map((p: { permiso: { nombre: string } }) => p.permiso.nombre));
    const tokens = this.generateTokens(usuario.id, roles, permisos);

    return { usuario: { id: usuario.id, correo: usuario.correo, roles }, ...tokens };
  }

  private generateTokens(userId: string, roles: string[], permisos: string[]) {
    const payload = { id: userId, roles, permisos };
    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as StringValue });
    const refreshToken = jwt.sign({ id: userId }, config.refreshTokenSecret, { expiresIn: config.refreshTokenExpiresIn as StringValue });
    return { accessToken, refreshToken };
  }
}