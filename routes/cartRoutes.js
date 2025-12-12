const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/cart/catalog:
 *   get:
 *     summary: Catálogo de productos disponibles
 *     tags: [Carrito]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/catalog', cartController.catalog);

// Historia 9: Operaciones del carrito (requieren autenticación)

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Crear carrito
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Carrito creado
 */
router.post('/', authMiddleware, cartController.createCart);

/**
 * @swagger
 * /api/cart/{id}:
 *   get:
 *     summary: Obtener carrito
 *     tags: [Carrito]
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
 *         description: OK
 *       404:
 *         description: Carrito no encontrado
 */
router.get('/:id', authMiddleware, cartController.getCart);

/**
 * @swagger
 * /api/cart/{id}/items:
 *   post:
 *     summary: Agregar item al carrito
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               producto_id:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item agregado
 *       404:
 *         description: Carrito no encontrado
 */
router.post('/:id/items', authMiddleware, cartController.addItem);

/**
 * @swagger
 * /api/cart/{id}/items/{itemId}:
 *   put:
 *     summary: Actualizar cantidad de un item
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidad:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cantidad actualizada
 *       404:
 *         description: Carrito o item no encontrado
 */
router.put('/:id/items/:itemId', authMiddleware, cartController.updateItemQuantity);

/**
 * @swagger
 * /api/cart/{id}/items/{itemId}:
 *   delete:
 *     summary: Eliminar item del carrito
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item eliminado
 *       404:
 *         description: Carrito o item no encontrado
 */
router.delete('/:id/items/:itemId', authMiddleware, cartController.removeItem);

/**
 * @swagger
 * /api/cart/{id}/checkout:
 *   post:
 *     summary: Procesar compra (checkout)
 *     tags: [Carrito]
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
 *         description: Compra procesada
 *       404:
 *         description: Carrito no encontrado
 */
router.post('/:id/checkout', authMiddleware, cartController.checkout);

module.exports = router;
