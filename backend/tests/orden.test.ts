import request from 'supertest';
import app from './setup';

describe('Módulo de Órdenes (API /api/v1/ordenes)', () => {
  let tokenCliente: string;
  let productoId: string;

  // Se ejecuta antes de todos los tests de este bloque
  beforeAll(async () => {
    // 1. Registrar y loguear para obtener token
    const correo = `cliente_orden_${Date.now()}@mail.com`;
    const resAuth = await request(app).post('/api/v1/auth/registro').send({
      nombre: 'Cliente', apellido: 'Orden', correo, contrasena: 'Password1'
    });
    tokenCliente = resAuth.body.data.accessToken;

    // 2. Obtener un producto válido del seed para agregar al carrito
    const resProd = await request(app).get('/api/v1/productos?limit=1');
    productoId = resProd.body.data.data[0].id;

    // 3. Agregar al carrito
    await request(app)
      .post('/api/v1/carrito/items')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ productoId, cantidad: 1 });
  });

  describe('POST / (Crear Orden)', () => {
    it('Debe crear una orden exitosamente (201)', async () => {
      const response = await request(app)
        .post('/api/v1/ordenes')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          metodoEnvioId: '11111111-1111-1111-1111-111111111111', // ID del seed de métodos de envío
          direccionEnvio: {
            nombreReceptor: 'Test Receiver',
            direccion: 'Av. Siempre Viva 742',
            ciudad: 'Lima',
            departamento: 'Lima',
            telefonoReceptor: '999999999'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('numeroOrden');
      expect(response.body.data.numeroOrden).toMatch(/^ORD-\d{4}\d{6}$/);
    });

    it('Debe fallar si el carrito está vacío (400)', async () => {
      // Intentar crear otra orden sin rellenar el carrito
      const response = await request(app)
        .post('/api/v1/ordenes')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          metodoEnvioId: '11111111-1111-1111-1111-111111111111',
          direccionEnvio: { nombreReceptor: 'T', direccion: 'Calle Falsa', ciudad: 'C', departamento: 'D', telefonoReceptor: '1' }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('El carrito está vacío');
    });
  });

  describe('GET /mis-ordenes', () => {
    it('Debe listar las órdenes del cliente autenticado (200)', async () => {
      const response = await request(app)
        .get('/api/v1/ordenes/mis-ordenes')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });
  });
});