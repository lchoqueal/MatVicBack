const express = require('express');
const router = express.Router();
const AlertsController = require('../controllers/alertsController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Listar alertas
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', authMiddleware, AlertsController.list);
/**
 * @swagger
 * /api/alerts/{id}:
 *   get:
 *     summary: Obtener alerta por ID
 *     tags: [Alertas]
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
 *         description: Alerta no encontrada
 */
router.get('/:id', authMiddleware, AlertsController.get);
/**
 * @swagger
 * /api/alerts/{id}/attend:
 *   post:
 *     summary: Atender alerta
 *     tags: [Alertas]
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
 *         description: Alerta no encontrada
 */
router.post('/:id/attend', authMiddleware, AlertsController.attend);

module.exports = router;
