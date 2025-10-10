// url: (local file, not a public GitHub repo)
const db = require('../config/db');
const pool = require('../config/db');

// Procesar venta (transacción)
async function processSale(req, res) {
  const { metodo_pago, id_empleado, id_cliente, items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items es requerido y debe ser un array' });
  }

  try {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'SELECT process_sale($1,$2,$3,$4) as resp',
        [metodo_pago, id_empleado, id_cliente, JSON.stringify(items)]
      );
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

// Ventas por día
async function getSalesByDay(req, res) {
  const { date } = req.params; // Espera formato YYYY-MM-DD
  const { local } = req.query; // Opcional: filtrar por local
  try {
    const queryBase = `
      SELECT
        b.fecha_emision,
        b.total,
        b.metodo_pago,
        COALESCE(u_cliente.nombre, '') AS cliente,
        COALESCE(l.nombre, '') AS local,
        array_agg(db.cantidad || 'x ' || p.nombre) AS productos
      FROM boleta b
      LEFT JOIN cliente c ON b.id_cliente_boleta = c.id_usuario_cliente
      LEFT JOIN usuario u_cliente ON c.id_usuario_cliente = u_cliente.id_usuario
      LEFT JOIN empleado e ON b.id_empleado_boleta = e.id_usuario_empleado
      LEFT JOIN locale l ON e.id_local = l.id_local
      JOIN detalle_boleta db ON b.id_boleta = db.id_boleta
      JOIN producto p ON db.id_producto = p.id_producto
      WHERE b.fecha_emision = $1
      ${local ? 'AND l.id_local = $2' : ''}
      GROUP BY b.id_boleta, u_cliente.nombre, l.nombre, b.fecha_emision, b.total, b.metodo_pago
      ORDER BY b.fecha_emision, b.id_boleta
    `;
    const params = local ? [date, local] : [date];

    const { rows } = await pool.query(queryBase, params);

    const result = rows.map(row => ({
      fecha_emision: row.fecha_emision,
      cliente: row.cliente,
      local: row.local,
      productos: row.productos,
      total: row.total,
      metodo_pago: row.metodo_pago,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Ventas por mes
async function getSalesByMonth(req, res) {
  const { month } = req.params; // Espera formato YYYY-MM
  const { local } = req.query; // Opcional: filtrar por local
  try {
    const queryBase = `
      SELECT
        b.fecha_emision,
        b.total,
        b.metodo_pago,
        COALESCE(u_cliente.nombre, '') AS cliente,
        COALESCE(l.nombre, '') AS local,
        array_agg(db.cantidad || 'x ' || p.nombre) AS productos
      FROM boleta b
      LEFT JOIN cliente c ON b.id_cliente_boleta = c.id_usuario_cliente
      LEFT JOIN usuario u_cliente ON c.id_usuario_cliente = u_cliente.id_usuario
      LEFT JOIN empleado e ON b.id_empleado_boleta = e.id_usuario_empleado
      LEFT JOIN locale l ON e.id_local = l.id_local
      JOIN detalle_boleta db ON b.id_boleta = db.id_boleta
      JOIN producto p ON db.id_producto = p.id_producto
      WHERE to_char(b.fecha_emision, 'YYYY-MM') = $1
      ${local ? 'AND l.id_local = $2' : ''}
      GROUP BY b.id_boleta, u_cliente.nombre, l.nombre, b.fecha_emision, b.total, b.metodo_pago
      ORDER BY b.fecha_emision, b.id_boleta
    `;
    const params = local ? [month, local] : [month];

    const { rows } = await pool.query(queryBase, params);

    const result = rows.map(row => ({
      fecha_emision: row.fecha_emision,
      cliente: row.cliente,
      local: row.local,
      productos: row.productos,
      total: row.total,
      metodo_pago: row.metodo_pago,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Ventas recientes (últimas N boletas)
async function getRecentSales(req, res) {
  const limit = parseInt(req.query.limit) || 10;
  try {
    const queryBase = `
      SELECT
        b.fecha_emision,
        b.total,
        b.metodo_pago,
        COALESCE(u_cliente.nombre, '') AS cliente,
        COALESCE(l.nombre, '') AS local,
        array_agg(db.cantidad || 'x ' || p.nombre) AS productos
      FROM boleta b
      LEFT JOIN cliente c ON b.id_cliente_boleta = c.id_usuario_cliente
      LEFT JOIN usuario u_cliente ON c.id_usuario_cliente = u_cliente.id_usuario
      LEFT JOIN empleado e ON b.id_empleado_boleta = e.id_usuario_empleado
      LEFT JOIN locale l ON e.id_local = l.id_local
      JOIN detalle_boleta db ON b.id_boleta = db.id_boleta
      JOIN producto p ON db.id_producto = p.id_producto
      GROUP BY b.id_boleta, u_cliente.nombre, l.nombre, b.fecha_emision, b.total, b.metodo_pago
      ORDER BY b.fecha_emision DESC, b.id_boleta DESC
      LIMIT $1
    `;
    const params = [limit];

    const { rows } = await pool.query(queryBase, params);

    const result = rows.map(row => ({
      fecha_emision: row.fecha_emision,
      cliente: row.cliente,
      local: row.local,
      productos: row.productos,
      total: row.total,
      metodo_pago: row.metodo_pago,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  processSale,
  getSalesByDay,
  getSalesByMonth,
  getRecentSales
};