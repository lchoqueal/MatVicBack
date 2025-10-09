const express = require('express');
const router = express.Router();
const { processSale } = require('../controllers/salesController');
const authMiddleware = require('../middleware/authMiddleware');

// Procesar venta (requiere autenticación)
router.post('/', authMiddleware, processSale);

module.exports = router;
