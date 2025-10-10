const express = require('express');
const router = express.Router();
const { processSale } = require('../controllers/salesController');
const authMiddleware = require('../middleware/authMiddleware');
const { getSalesByDay, getSalesByMonth } = require('../controllers/salesController');
const { getRecentSales } = require('../controllers/salesController');

// Procesar venta (requiere autenticación)
router.post('/', authMiddleware, processSale);

// Obtener ventas por día (requiere autenticación)
router.get('/byday/:date', authMiddleware, getSalesByDay);

// Obtener ventas por mes (requiere autenticación)
router.get('/bymonth/:month', authMiddleware, getSalesByMonth);

// Obtener últimas ventas (requiere autenticación)
router.get('/recent', authMiddleware, getRecentSales);

// Estadísticas avanzadas
router.get('/stats/monthly-history', salesController.getMonthlyHistory);

// Comparación entre locales
router.get('/stats/comparison', salesController.getStoresComparison);

module.exports = router;
