const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const salesController = require('../controllers/salesController');

// Procesar venta (requiere autenticación)
router.post('/', authMiddleware, salesController.processSale);

// Obtener ventas por día (requiere autenticación)
router.get('/byday/:date', authMiddleware, salesController.getSalesByDay);

// Obtener ventas por mes (requiere autenticación)
router.get('/bymonth/:month', authMiddleware, salesController.getSalesByMonth);

// Obtener últimas ventas (requiere autenticación)
router.get('/recent', authMiddleware, salesController.getRecentSales);

// Estadísticas avanzadas
router.get('/stats/monthly-history', salesController.getMonthlyHistory);

// Comparación entre locales
router.get('/stats/comparison', salesController.getStoresComparison);

module.exports = router;
