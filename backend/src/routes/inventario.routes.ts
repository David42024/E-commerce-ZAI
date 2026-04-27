import { Router } from 'express';
import { InventarioController } from '../controllers/inventario.controller';
import { authenticate, requireRole } from '../middlewares';

const router = Router();

// Solo ciertos roles pueden ver y ajustar inventario
router.use(authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'GERENTE_INVENTARIO'));

router.get('/alertas', InventarioController.getAlertas);
router.get('/movimientos', InventarioController.listarMovimientos);
router.post('/ajustes/:productoId', InventarioController.ajustarStock);

export default router;