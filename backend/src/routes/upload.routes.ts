import { Router } from 'express';
import { uploadProducto } from '../middlewares/upload';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/upload/producto:
 *   post:
 *     summary: Subir una imagen de producto
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagen subida con éxito
 *       400:
 *         description: Error en la subida
 */
router.post('/producto', authenticate, requireRole('ADMIN', 'ALMACENERO'), uploadProducto.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ninguna imagen' });
  }

  const url = `/uploads/productos/${req.file.filename}`;
  res.status(200).json({ 
    message: 'Imagen subida con éxito',
    url 
  });
});

export default router;
