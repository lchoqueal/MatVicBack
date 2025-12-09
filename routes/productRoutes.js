const express = require('express');

const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { upload, handleMulterError } = require('../middleware/upload');

// endpoint para productos criticos (colocar antes de las rutas con parámetros)
router.get('/alerts', productController.alerts);

// endpoint para estadísticas de productos
router.get('/stats', authMiddleware, productController.stats);

// lectura pública
router.get('/', productController.list);
router.get('/:id', productController.get);
// creación y modificación requieren autenticación y privilegios de admin
router.post('/', authMiddleware, adminMiddleware, upload.single('imagen'), productController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('imagen'), productController.update);
router.delete('/:id', authMiddleware, adminMiddleware, productController.remove);
router.patch('/:id/stock', authMiddleware, adminMiddleware, productController.updateStock);
// compras y transferencias
router.post('/:id/purchase', authMiddleware, adminMiddleware, productController.purchase);
router.post('/transfer', authMiddleware, adminMiddleware, productController.transfer);

module.exports = router;

// Middleware para manejar errores de Multer
router.use(handleMulterError);

module.exports = router;
