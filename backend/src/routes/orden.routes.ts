import { Router } from 'express';
import { OrdenController } from '../controllers/orden.controller';
import { authenticate, requireRole } from '../middlewares';

const router = Router();

// Rutas de Cliente
router.post('/', authenticate, OrdenController.crear);
router.get('/mis-ordenes', authenticate, OrdenController.listarMisOrdenes);

// Rutas de Administrador
router.get('/admin/todas', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'GERENTE_VENTAS', 'VENDEDOR'), OrdenController.listarTodas);
router.get('/todas', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'GERENTE_VENTAS', 'VENDEDOR'), OrdenController.listarTodas);
router.patch('/:id/estado', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'GERENTE_VENTAS', 'VENDEDOR'), OrdenController.cambiarEstado);

// Detalle de orden (cliente autenticado o admin según lógica de servicio)
router.get('/:id', authenticate, OrdenController.obtenerDetalle);

export default router;