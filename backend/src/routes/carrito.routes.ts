import { Router } from 'express';
import { CarritoController } from '../controllers/carrito.controller';
import { authenticate } from '../middlewares';

const router = Router();

// Todas las rutas requieren estar autenticado
router.use(authenticate);

router.get('/', CarritoController.obtenerMiCarrito);
router.post('/items', CarritoController.agregarItem);
router.delete('/items/:productoId', CarritoController.eliminarItem);
router.delete('/', CarritoController.vaciarCarrito);

export default router;