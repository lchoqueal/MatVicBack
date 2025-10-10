const db = require('../config/db');
const pool = require('../config/db');
const { get } = require('../routes/salesRoutes');

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
  const { date } = req.params; // formato YYYY-MM-DD
  const { local } = req.query; // opcional
  try {
    const queryBase = `
      SELECT
        b.fecha_emision,
        b.total,
        b.metodo_pago,
        COALESCE(u_cliente.nombres, '') || ' ' || COALESCE(u_cliente.apellidos, '') AS cliente,
        COALESCE(u_empleado.nombres, '') || ' ' || COALESCE(u_empleado.apellidos, '') AS empleado,
        COALESCE(l.nombre, '') AS local,
        array_agg(db.cantidad || 'x ' || p.nombre) AS productos
      FROM boleta b
      LEFT JOIN cliente c ON b.id_cliente_boleta = c.id_usuario_cliente
      LEFT JOIN usuario u_cliente ON c.id_usuario_cliente = u_cliente.id_usuario
      LEFT JOIN empleado e ON b.id_empleado_boleta = e.id_usuario_empleado
      LEFT JOIN usuario u_empleado ON e.id_usuario_empleado = u_empleado.id_usuario
      LEFT JOIN locale l ON e.id_local = l.id_local
      JOIN detalle_boleta db ON b.id_boleta = db.id_boleta
      JOIN producto p ON db.id_producto = p.id_producto
      WHERE b.fecha_emision = $1
      ${local ? 'AND l.id_local = $2' : ''}
      GROUP BY b.id_boleta, u_cliente.nombres, u_cliente.apellidos, u_empleado.nombres, u_empleado.apellidos, l.nombre, b.fecha_emision, b.total, b.metodo_pago
      ORDER BY b.fecha_emision, b.id_boleta
    `;
    const params = local ? [date, local] : [date];

    const { rows } = await pool.query(queryBase, params);

    const result = rows.map(row => ({
      fecha_emision: row.fecha_emision,
      cliente: row.cliente,
      empleado: row.empleado,
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
  const { month } = req.params; // formato YYYY-MM
  const { local } = req.query;
  try {
    const queryBase = `
      SELECT
        b.fecha_emision,
        b.total,
        b.metodo_pago,
        COALESCE(u_cliente.nombres, '') || ' ' || COALESCE(u_cliente.apellidos, '') AS cliente,
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
      GROUP BY b.id_boleta, u_cliente.nombres, u_cliente.apellidos, l.nombre, b.fecha_emision, b.total, b.metodo_pago
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

// Ventas recientes
async function getRecentSales(req, res) {
  const limit = parseInt(req.query.limit) || 10;
  try {
    const queryBase = `
      SELECT
        b.fecha_emision,
        b.total,
        b.metodo_pago,
        COALESCE(u_cliente.nombres, '') || ' ' || COALESCE(u_cliente.apellidos, '') AS cliente,
        COALESCE(l.nombre, '') AS local,
        array_agg(db.cantidad || 'x ' || p.nombre) AS productos
      FROM boleta b
      LEFT JOIN cliente c ON b.id_cliente_boleta = c.id_usuario_cliente
      LEFT JOIN usuario u_cliente ON c.id_usuario_cliente = u_cliente.id_usuario
      LEFT JOIN empleado e ON b.id_empleado_boleta = e.id_usuario_empleado
      LEFT JOIN locale l ON e.id_local = l.id_local
      JOIN detalle_boleta db ON b.id_boleta = db.id_boleta
      JOIN producto p ON db.id_producto = p.id_producto
      GROUP BY b.id_boleta, u_cliente.nombres, u_cliente.apellidos, l.nombre, b.fecha_emision, b.total, b.metodo_pago
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

async function getStoresComparison(req, res) {
  try {
    // Obtener fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Ventas de hoy por local
    const todayQuery = `
      SELECT 
        l.id_local,
        l.nombre as nombre_local,
        COUNT(b.id_boleta) as ventas_hoy_count,
        COALESCE(SUM(b.total), 0) as ventas_hoy_total
      FROM locale l
      LEFT JOIN empleado e ON e.id_local = l.id_local
      LEFT JOIN boleta b ON b.id_empleado_boleta = e.id_usuario_empleado 
        AND DATE(b.fecha_emision) = $1
      GROUP BY l.id_local, l.nombre
      ORDER BY l.id_local
    `;
    
    // Total de productos (global, ya que no hay relación producto-local)
    const productsQuery = `
      SELECT COUNT(*) as total_productos FROM producto
    `;
    
    // Stock bajo por local (ajustar si tienes relación producto-local)
    const stockQuery = `
      SELECT COUNT(*) as productos_stock_bajo 
      FROM producto 
      WHERE stock <= min_stock
    `;
    
    // Encargado por local (primer empleado encontrado)
    const managerQuery = `
      SELECT 
        l.id_local,
        COALESCE(u.nombres || ' ' || u.apellidos, 'Sin asignar') as encargado
      FROM locale l
      LEFT JOIN empleado e ON e.id_local = l.id_local
      LEFT JOIN usuario u ON e.id_usuario_empleado = u.id_usuario
      WHERE e.id_usuario_empleado IS NOT NULL
      GROUP BY l.id_local, u.nombres, u.apellidos
      ORDER BY l.id_local
      LIMIT 1
    `;
    
    const todayResult = await pool.query(todayQuery, [today]);
    const productsResult = await pool.query(productsQuery);
    const stockResult = await pool.query(stockQuery);
    
    // Obtener encargados para cada local
    const managers = {};
    const managerQuery2 = `
      SELECT 
        e.id_local,
        u.nombres || ' ' || u.apellidos as encargado
      FROM empleado e
      JOIN usuario u ON e.id_usuario_empleado = u.id_usuario
      WHERE e.id_local IS NOT NULL
      GROUP BY e.id_local, u.nombres, u.apellidos
    `;
    const managerResult = await pool.query(managerQuery2);
    managerResult.rows.forEach(row => {
      if (!managers[row.id_local]) {
        managers[row.id_local] = row.encargado;
      }
    });
    
    const comparison = todayResult.rows.map((row) => ({
      id_local: row.id_local,
      nombre_local: row.nombre_local,
      ventas_hoy: parseFloat(row.ventas_hoy_total),
      ventas_hoy_count: parseInt(row.ventas_hoy_count),
      total_productos: parseInt(productsResult.rows[0].total_productos),
      stock_bajo: parseInt(stockResult.rows[0].productos_stock_bajo),
      encargado: managers[row.id_local] || 'Sin asignar'
    }));
    
    res.json(comparison);
  } catch (err) {
    console.error('Error en getStoresComparison:', err);
    res.status(500).json({ error: err.message });
  }
}

async function getMonthlyHistory(req, res) {
  const { local } = req.query;
  try {
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', b.fecha_emision), 'YYYY-MM') as mes,
        COALESCE(SUM(b.total), 0) as total_ventas,
        COUNT(b.id_boleta) as cantidad_ventas
      FROM boleta b
      LEFT JOIN empleado e ON b.id_empleado_boleta = e.id_usuario_empleado
      LEFT JOIN locale l ON e.id_local = l.id_local
      WHERE b.fecha_emision >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      ${local ? 'AND l.id_local = $1' : ''}
      GROUP BY DATE_TRUNC('month', b.fecha_emision)
      ORDER BY DATE_TRUNC('month', b.fecha_emision) ASC
    `;
    
    const params = local ? [local] : [];
    const { rows } = await pool.query(query, params);
    
    // Formatear para el gráfico (convertir mes a abreviatura)
    const monthNames = {
      '01': 'Ene', '02': 'Feb', '03': 'Mar', 
      '04': 'Abr', '05': 'May', '06': 'Jun',
      '07': 'Jul', '08': 'Ago', '09': 'Sep',
      '10': 'Oct', '11': 'Nov', '12': 'Dic'
    };
    
    const result = rows.map(row => ({
      month: monthNames[row.mes.split('-')[1]],
      sales: parseFloat(row.total_ventas),
      count: parseInt(row.cantidad_ventas)
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
  getRecentSales,
  getStoresComparison,
  getMonthlyHistory
};