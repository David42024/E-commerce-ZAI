import { Router } from 'express';
import { ProductoController } from '../controllers/producto.controller';
import { authenticate, requireRole } from '../middlewares';

const router = Router();

router.get('/', ProductoController.listar); // Público
router.get('/admin/todos', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'), ProductoController.listarAdmin); // Admin
router.get('/:id', ProductoController.detalle); // Público
router.post('/', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'), ProductoController.crear); // Admin
router.patch('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'), ProductoController.actualizar); // Admin
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'), ProductoController.eliminar); // Admin

export default router;