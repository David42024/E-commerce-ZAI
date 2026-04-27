import { Router } from 'express';
import { ClienteController } from '../controllers/cliente.controller';
import { authenticate, requireRole, requirePermission } from '../middlewares';

const router = Router();

// Rutas del propio cliente
router.get('/perfil', authenticate, ClienteController.getPerfil);
router.post('/lista-deseos/:productoId', authenticate, ClienteController.toggleListaDeseos);

// Rutas de Admin sobre clientes
router.get('/admin/todos', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'), ClienteController.listarAdmin);
router.get('/admin/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'), ClienteController.obtenerDetalleAdmin);

export default router;