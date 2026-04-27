import { Router } from 'express';
import { UnidadMedidaController } from '../controllers/unidad-medida.controller';

const router = Router();

router.get('/', UnidadMedidaController.listar);

export default router;
