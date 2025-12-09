const express = require('express');
const router = express.Router();
const AlertsController = require('../controllers/alertsController');
const authMiddleware = require('../middleware/authMiddleware');

// listar alertas (paginado)
router.get('/', authMiddleware, AlertsController.list);
router.get('/:id', authMiddleware, AlertsController.get);
router.post('/:id/attend', authMiddleware, AlertsController.attend);

module.exports = router;
