const express = require('express');
const router = express.Router();
const { upload, handleMulterError } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * /api/uploads/product/{id}:
 *   post:
 *     summary: Subir imagen de producto
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagen subida
 *       401:
 *         description: No autenticado
 */
router.post('/product/:id', 
  upload.single('imagen'), 
  uploadController.uploadProductImage
);

/**
 * @swagger
 * /api/uploads/product/{id}:
 *   delete:
 *     summary: Eliminar imagen de producto
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Imagen eliminada
 *       401:
 *         description: No autenticado
 */
router.delete('/product/:id', 
  uploadController.deleteProductImage
);

// Middleware para manejar errores de Multer
router.use(handleMulterError);

module.exports = router;
module.exports = router;
