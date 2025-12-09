const BaseRepository = require('./BaseRepository');
const pool = require('../config/db');

class ProductModel extends BaseRepository {
  constructor() {
    super('producto');
  }

  async getById(id) {
    return super.getById(id, 'id_producto');
  }

  async remove(id) {
    return super.remove(id, 'id_producto');
  }

  async getAll() {
    const { rows } = await pool.query('SELECT id_producto, nombre, descripcion, categoria, stock, min_stock, precio_unit, imagen_url FROM producto ORDER BY id_producto');
    return rows;
  }

  async create(data) {
    const { nombre, descripcion = null, categoria, stock = 0, min_stock = 0, precio_unit = 0 } = data;
    const { rows } = await pool.query(
      `INSERT INTO producto (nombre, descripcion, categoria, stock, min_stock, precio_unit)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_producto, nombre, descripcion, categoria, stock, min_stock, precio_unit, imagen_url`,
      [nombre, descripcion, categoria, stock, min_stock, precio_unit]
    );
    return rows[0];
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of ['nombre','descripcion','categoria','stock','min_stock','precio_unit','imagen_url']) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    }
    if (fields.length === 0) return this.getById(id);
    values.push(id);
    const { rows } = await pool.query(`UPDATE producto SET ${fields.join(', ')} WHERE id_producto = $${idx} RETURNING id_producto, nombre, descripcion, categoria, stock, min_stock, precio_unit, imagen_url`, values);
    return rows[0];
  }

  async updateStock(id, newStock) {
    const { rows } = await pool.query(
      'UPDATE producto SET stock = $1 WHERE id_producto = $2 RETURNING id_producto, nombre, descripcion, categoria, stock, min_stock, precio_unit, imagen_url',
      [newStock, id]
    );
    return rows[0];
  }

  async getCritical() {
    const { rows } = await pool.query(`
      SELECT 
        id_producto,
        nombre,
        descripcion,
        categoria,
        stock as stock_actual,
        min_stock,
        precio_unit,
        imagen_url,
        'Local General' as local
      FROM producto 
      WHERE stock <= min_stock 
      ORDER BY id_producto
    `);
    return rows;
  }

  async incrementStock(id, qty) {
    const { rows } = await pool.query(
      'UPDATE producto SET stock = stock + $1 WHERE id_producto = $2 RETURNING id_producto, nombre, descripcion, categoria, stock, min_stock, precio_unit, imagen_url',
      [qty, id]
    );
    return rows[0];
  }

  async transferStock(idFrom, idTo, qty) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const fromRes = await client.query('UPDATE producto SET stock = stock - $1 WHERE id_producto = $2 RETURNING id_producto, stock', [qty, idFrom]);
      if (fromRes.rowCount === 0) throw new Error('Producto origen no existe o stock insuficiente');
      if (fromRes.rows[0].stock < 0) throw new Error('Stock insuficiente en origen');
      const toRes = await client.query('UPDATE producto SET stock = stock + $1 WHERE id_producto = $2 RETURNING id_producto, stock', [qty, idTo]);
      if (toRes.rowCount === 0) throw new Error('Producto destino no existe');
      await client.query('COMMIT');
      return { from: fromRes.rows[0], to: toRes.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new ProductModel();


