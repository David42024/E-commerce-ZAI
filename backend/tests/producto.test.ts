import request from 'supertest';
import app from './setup';

describe('Módulo de Catálogo (API /api/v1/productos)', () => {
  
  describe('GET /', () => {
    it('Debe obtener el catálogo con paginación por defecto (12 items)', async () => {
      const response = await request(app).get('/api/v1/productos');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.limit).toBe(12);
    });

    it('Debe permitir cambiar el límite de paginación', async () => {
      const response = await request(app).get('/api/v1/productos?limit=5');

      expect(response.status).toBe(200);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.data.length).toBeLessThanOrEqual(5);
    });

    it('Debe filtrar por búsqueda (fuzzy)', async () => {
      // Asumiendo que en el seed hay un producto llamado "Smartphone Pro Max"
      const response = await request(app).get('/api/v1/productos?search=Smartphone');

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThan(0);
      response.body.data.data.forEach((p: any) => {
        expect(p.nombre.toLowerCase()).toContain('smartphone');
      });
    });
  });

  describe('GET /:id', () => {
    it('Debe retornar 404 si el producto no existe', async () => {
      const fakeId = '11111111-1111-1111-1111-111111111111';
      const response = await request(app).get(`/api/v1/productos/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Producto no encontrado');
    });

    it('Debe bloquear creación de producto si no es Admin (401/403)', async () => {
      const response = await request(app)
        .post('/api/v1/productos')
        .send({ nombre: 'Producto Hack', sku: 'HACK-001' }); // Sin token

      expect(response.status).toBe(401); // El middleware auth atrapa esto
    });
  });
});