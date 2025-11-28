const express = require('express');
const router = express.Router();
const { upload, handleMulterError } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const verifyToken = require('../middleware/verifyToken');

// Middleware de autenticación para todas las rutas
router.use(verifyToken);

// POST /api/uploads/product/:id - Subir imagen para un producto
router.post('/product/:id', 
  upload.single('imagen'), 
  uploadController.uploadProductImage
);

// DELETE /api/uploads/product/:id - Eliminar imagen de un producto
router.delete('/product/:id', 
  uploadController.deleteProductImage
);

// Middleware para manejar errores de Multer
router.use(handleMulterError);

module.exports = router;