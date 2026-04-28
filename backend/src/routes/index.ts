import { Router } from 'express';
import authRoutes from './auth.routes';
import productoRoutes from './producto.routes';
import categoriaRoutes from './categoria.routes';
import carritoRoutes from './carrito.routes';
import ordenRoutes from './orden.routes';
import inventarioRoutes from './inventario.routes';
import clienteRoutes from './cliente.routes';
import reporteRoutes from './reporte.routes';
import unidadMedidaRoutes from './unidad-medida.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/productos', productoRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/carrito', carritoRoutes);
router.use('/ordenes', ordenRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/clientes', clienteRoutes);
router.use('/reportes', reporteRoutes);
router.use('/unidades-medida', unidadMedidaRoutes);

export default router;