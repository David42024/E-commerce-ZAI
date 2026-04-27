import request from 'supertest';
import app from './setup';

describe('Módulo de Autenticación (API /api/v1/auth)', () => {
  
  describe('POST /registro', () => {
    it('Debe registrar un usuario nuevo y devolver tokens (201)', async () => {
      const payload = {
        nombre: 'Test',
        apellido: 'User',
        correo: `test_${Date.now()}@mail.com`, // Correo dinámico para evitar conflictos
        contrasena: 'Password1',
      };

      const response = await request(app)
        .post('/api/v1/auth/registro')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.usuario).toHaveProperty('id');
    });

    it('Debe fallar si el correo ya existe (409)', async () => {
      const payload = { nombre: 'Dup', apellido: 'lico', correo: 'dup@mail.com', contrasena: 'Password1' };
      
      // Primera petición (éxito)
      await request(app).post('/api/v1/auth/registro').send(payload);
      // Segunda petición (fracaso)
      const response = await request(app).post('/api/v1/auth/registro').send(payload);

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('ya está registrado');
    });

    it('Debe fallar si la contraseña es débil (422)', async () => {
      const payload = { nombre: 'Fail', apellido: 'Pass', correo: 'fail@mail.com', contrasena: '123' };
      
      const response = await request(app).post('/api/v1/auth/registro').send(payload);

      expect(response.status).toBe(422);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /login', () => {
    it('Debe hacer login y devolver tokens (200)', async () => {
      // Preparamos un usuario
      const correo = `login_${Date.now()}@mail.com`;
      await request(app).post('/api/v1/auth/registro').send({
        nombre: 'Login', apellido: 'Test', correo, contrasena: 'Password1'
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ correo, contrasena: 'Password1' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('Debe fallar con credenciales incorrectas (401)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ correo: 'noexiste@mail.com', contrasena: 'Password1' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Credenciales inválidas');
    });
  });
});