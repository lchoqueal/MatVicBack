const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const salesController = require('../controllers/salesController');

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Procesar venta
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliente_id:
 *                 type: integer
 *               productos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_producto:
 *                       type: integer
 *                     cantidad:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Venta procesada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post('/', authMiddleware, salesController.processSale);

/**
 * @swagger
 * /api/sales/byday/{date}:
 *   get:
 *     summary: Obtener ventas por día
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/byday/:date', authMiddleware, salesController.getSalesByDay);

/**
 * @swagger
 * /api/sales/bymonth/{month}:
 *   get:
 *     summary: Obtener ventas por mes
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *           example: "2025-12"
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/bymonth/:month', authMiddleware, salesController.getSalesByMonth);

/**
 * @swagger
 * /api/sales/recent:
 *   get:
 *     summary: Obtener últimas ventas
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/recent', authMiddleware, salesController.getRecentSales);

/**
 * @swagger
 * /api/sales/stats/monthly-history:
 *   get:
 *     summary: Historial mensual de ventas
 *     tags: [Ventas]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/stats/monthly-history', salesController.getMonthlyHistory);

/**
 * @swagger
 * /api/sales/stats/comparison:
 *   get:
 *     summary: Comparación entre locales
 *     tags: [Ventas]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/stats/comparison', salesController.getStoresComparison);

module.exports = router;
