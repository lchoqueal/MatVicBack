const express = require('express');
const router = express.Router();
const { processSale } = require('../controllers/salesController');
const authMiddleware = require('../middleware/authMiddleware');
const { getSalesByDay, getSalesByMonth } = require('../controllers/salesController');

// Procesar venta (requiere autenticación)
router.post('/', authMiddleware, processSale);

// Obtener ventas por día (requiere autenticación)
router.get('/byday/:date', authMiddleware, getSalesByDay);

// Obtener ventas por mes (requiere autenticación)
router.get('/bymonth/:month', authMiddleware, getSalesByMonth);

module.exports = router;
