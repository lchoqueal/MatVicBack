const db = require('../config/db');

const AlertsController = {
  async list(req, res) {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    try {
      const { rows } = await db.query(
        'SELECT id_alerta, id_producto, tipo, stock_actual, min_stock, mensaje, atendido, creado_en FROM alerta ORDER BY creado_en DESC LIMIT $1 OFFSET $2', 
        [limit, offset]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Error interno del servidor al obtener alertas' });
    }
  },
  async get(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await db.query('SELECT * FROM alerta WHERE id_alerta = $1', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Alerta no encontrada' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async attend(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await db.query('UPDATE alerta SET atendido = TRUE WHERE id_alerta = $1 RETURNING *', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Alerta no encontrada' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = AlertsController;
