const express = require('express');

const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');


/**
 * @swagger
 * /api/products/alerts:
 *   get:
 *     summary: Productos con stock crítico
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 `$ref: '#/components/schemas/Producto'
 */
router.get('/alerts', productController.alerts);

/**
 * @swagger
 * /api/products/stats:
 *   get:
 *     summary: Estadísticas de productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalStock:
 *                   type: integer
 *                 totalProducts:
 *                   type: integer
 *                 lowStockProducts:
 *                   type: integer
 */
router.get('/stats', productController.stats);

// busqueda de productos (antes de /:id para evitar conflictos)
router.get('/search', productController.search);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 `$ref: '#/components/schemas/Producto'
 */
router.get('/', productController.list);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtener producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               `$ref: '#/components/schemas/Producto'
 *       404:
 *         description: Producto no encontrado
 */
router.get('/:id', productController.get);
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               categoria:
 *                 type: string
 *               stock:
 *                 type: integer
 *               precio_unit:
 *                 type: number
 *               imagen:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Creado
 *         content:
 *           application/json:
 *             schema:
 *               `$ref: '#/components/schemas/Producto'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 */
router.post('/', authMiddleware, adminMiddleware, productController.create);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Productos]
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
 *               nombre:
 *                 type: string
 *               categoria:
 *                 type: string
 *               stock:
 *                 type: integer
 *               precio_unit:
 *                 type: number
 *               imagen:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               `$ref: '#/components/schemas/Producto'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Producto no encontrado
 */
router.put('/:id', authMiddleware, adminMiddleware, productController.update);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Productos]
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
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Producto no encontrado
 */
router.delete('/:id', authMiddleware, adminMiddleware, productController.remove);

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Actualizar stock
 *     tags: [Productos]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Producto no encontrado
 */
router.patch('/:id/stock', authMiddleware, adminMiddleware, productController.updateStock);
/**
 * @swagger
 * /api/products/{id}/purchase:
 *   post:
 *     summary: Registrar compra
 *     tags: [Productos]
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
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Producto no encontrado
 */
router.post('/:id/purchase', authMiddleware, adminMiddleware, productController.purchase);

/**
 * @swagger
 * /api/products/transfer:
 *   post:
 *     summary: Transferir productos
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 */
router.post('/transfer', authMiddleware, adminMiddleware, productController.transfer);

module.exports = router;
