const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

// Historia 8: Catálogo de productos disponibles (público, sin autenticación)
router.get('/catalog', cartController.catalog);

// Historia 9: Operaciones del carrito (requieren autenticación)

// Crear carrito
router.post('/', authMiddleware, cartController.createCart);

// Obtener carrito
router.get('/:id', authMiddleware, cartController.getCart);

// Agregar item al carrito
router.post('/:id/items', authMiddleware, cartController.addItem);

// Actualizar cantidad de un item
router.put('/:id/items/:itemId', authMiddleware, cartController.updateItemQuantity);

// Eliminar item del carrito
router.delete('/:id/items/:itemId', authMiddleware, cartController.removeItem);

// Procesar compra (checkout)
router.post('/:id/checkout', authMiddleware, cartController.checkout);

module.exports = router;
