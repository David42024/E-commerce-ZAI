import request from 'supertest';
import app from './setup';

describe('RBAC - Control de Acceso basado en Roles', () => {
  let tokenAdmin: string;
  let tokenCliente: string;

  beforeAll(async () => {
    const resLoginAdmin = await request(app).post('/api/v1/auth/login').send({
      correo: 'admin@zai.com', contrasena: 'password123'
    });
    if (!resLoginAdmin.body.data) {
      console.error('Login Admin Fallido:', resLoginAdmin.body);
    }
    tokenAdmin = resLoginAdmin.body.data.accessToken;

    const clienteEmail = `cliente_test_${Date.now()}@mail.com`;
    const resCliente = await request(app).post('/api/v1/auth/registro').send({
      nombre: 'Cliente', apellido: 'Test', correo: clienteEmail, contrasena: 'Password1'
    });
    if (!resCliente.body.data) {
      console.error('Registro Cliente Fallido:', resCliente.body);
    }
    tokenCliente = resCliente.body.data.accessToken;
  });

  describe('Acceso a Rutas Administrativas', () => {
    it('Debe permitir a un ADMIN listar todas las órdenes (200)', async () => {
      const response = await request(app)
        .get('/api/v1/ordenes/admin/todas')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('Debe denegar a un CLIENTE listar todas las órdenes (403)', async () => {
      const response = await request(app)
        .get('/api/v1/ordenes/admin/todas')
        .set('Authorization', `Bearer ${tokenCliente}`);
      
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Acceso denegado');
    });

    it('Debe denegar acceso a usuarios no autenticados (401)', async () => {
      const response = await request(app).get('/api/v1/ordenes/admin/todas');
      expect(response.status).toBe(401);
    });
  });

  describe('Acceso a Inventario', () => {
    it('Debe permitir a un ADMIN ver alertas de inventario (200)', async () => {
      const response = await request(app)
        .get('/api/v1/inventario/alertas')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      
      expect(response.status).toBe(200);
    });

    it('Debe denegar a un CLIENTE ver alertas de inventario (403)', async () => {
      const response = await request(app)
        .get('/api/v1/inventario/alertas')
        .set('Authorization', `Bearer ${tokenCliente}`);
      
      expect(response.status).toBe(403);
    });
  });
});
