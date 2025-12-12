const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

// Obtener carrito del usuario
router.get('/', authMiddleware, cartController.getCart);

// Agregar producto al carrito
router.post('/add', authMiddleware, cartController.addToCart);

// Actualizar cantidad de producto
router.put('/update', authMiddleware, cartController.updateQuantity);

// Eliminar producto del carrito
router.delete('/remove/:producto_id', authMiddleware, cartController.removeFromCart);

// Vaciar carrito
router.delete('/clear', authMiddleware, cartController.clearCart);

// Obtener cantidad de items
router.get('/count', authMiddleware, cartController.getCartCount);

module.exports = router;
