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
 *     summary: Ventas por día
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/byday/:date', authMiddleware, salesController.getSalesByDay);

/**
 * @swagger
 * /api/sales/bymonth/{month}:
 *   get:
 *     summary: Ventas por mes
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/bymonth/:month', authMiddleware, salesController.getSalesByMonth);

/**
 * @swagger
 * /api/sales/recent:
 *   get:
 *     summary: Últimas ventas
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
 *     summary: Historial mensual
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
