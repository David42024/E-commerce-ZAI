import { Router } from 'express';
import { ReporteController } from '../controllers/reporte.controller';
import { ReporteProgramacionController } from '../controllers/reporteProgramacion.controller';
import { authenticate, requireRole } from '../middlewares';

const router = Router();

router.use(authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'GERENTE_VENTAS'));

// Reportes inmediatos
router.get('/operacional/ordenes', ReporteController.descargarOrdenes);
router.get('/operacional/inventario', ReporteController.descargarInventario);
router.get('/operacional/clientes', ReporteController.descargarClientes);
router.get('/gestion/financiero', ReporteController.descargarFinanciero);
router.get('/gestion/mas-vendidos', ReporteController.descargarMasVendidos);
router.get('/actividad', ReporteController.getLogsActividad);
router.get('/gestion/ventas', ReporteController.descargarGestionVentas);
router.get('/dashboard', ReporteController.getDashboardData);

// Programación de reportes
router.get('/programacion', ReporteProgramacionController.listar);
router.post('/programacion', ReporteProgramacionController.crear);
router.patch('/programacion/:id', ReporteProgramacionController.actualizar);
router.delete('/programacion/:id', ReporteProgramacionController.eliminar);
router.post('/programacion/ejecutar-manual', ReporteProgramacionController.ejecutarManual);

export default router;