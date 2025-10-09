const db = require('../config/db');

async function processSale(req, res) {
  const { metodo_pago, id_empleado, id_cliente, items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items es requerido y debe ser un array' });
  }

  try {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query('SELECT process_sale($1,$2,$3,$4) as resp', [metodo_pago, id_empleado, id_cliente, JSON.stringify(items)]);
      await client.query('COMMIT');
      return res.json(result.rows[0].resp);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error al procesar venta', err);
      return res.status(500).json({ error: err.message || 'Error interno' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('DB connection error', err);
    return res.status(500).json({ error: 'DB connection error' });
  }
}

module.exports = { processSale };
