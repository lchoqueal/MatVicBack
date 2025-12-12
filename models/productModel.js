const pool = require('../config/db');

const Product = {
  // 1. LISTA GENERAL
  async getAll() {
    // CORREGIDO: imagen_url
    const { rows } = await pool.query('SELECT id_producto, nombre, descripcion, categoria, stock, min_stock, precio_unit, imagen_url FROM producto ORDER BY id_producto');
    return rows;
  },

  // 2. DETALLE DE UN PRODUCTO
  async getById(id) {
    // CORREGIDO: imagen_url
    const { rows } = await pool.query('SELECT id_producto, nombre, descripcion, categoria, stock, min_stock, precio_unit, imagen_url FROM producto WHERE id_producto = $1', [id]);
    return rows[0];
  },

  // 3. CREAR PRODUCTO
  async create(data) {
    // CORREGIDO: imagen_url (singular)
    const { nombre, descripcion = null, categoria, stock = 0, min_stock = 0, precio_unit = 0, imagen_url = null } = data;
    
    const { rows } = await pool.query(
      `INSERT INTO producto (nombre, descripcion, categoria, stock, min_stock, precio_unit, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id_producto, nombre, descripcion, categoria, stock, min_stock, precio_unit, imagen_url`,
      [nombre, descripcion, categoria, stock, min_stock, precio_unit, imagen_url]
    );
    return rows[0];
  },

  // 4. ACTUALIZAR PRODUCTO
  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    // CORREGIDO: 'imagen_url' en la lista permitida
    const allowedFields = ['nombre', 'descripcion', 'categoria', 'stock', 'min_stock', 'precio_unit', 'imagen_url'];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
      }













    }

    if (fields.length === 0) return this.getById(id);
    
    values.push(id);
    
    // CORREGIDO: imagen_url al RETURNING
    const { rows } = await pool.query(
      `UPDATE producto SET ${fields.join(', ')} WHERE id_producto = $${idx} RETURNING id_producto, nombre, descripcion, categoria, stock, min_stock, precio_unit, imagen_url`, 
      values
    );
    return rows[0];
  },

  async remove(id) {
    const { rows } = await pool.query('DELETE FROM producto WHERE id_producto = $1 RETURNING id_producto', [id]);
    return rows[0];
  },

  async updateStock(id, newStock) {
    const { rows } = await pool.query(
      'UPDATE producto SET stock = $1 WHERE id_producto = $2 RETURNING id_producto, nombre, descripcion, categoria, stock, min_stock, precio_unit',
      [newStock, id]
    );
    return rows[0];
  },

  async getCritical() {
    // CORREGIDO: imagen_url
    const { rows } = await pool.query('SELECT id_producto, nombre, descripcion, categoria, stock, min_stock, precio_unit, imagen_url FROM producto WHERE stock <= min_stock ORDER BY id_producto');
    return rows;
  },

  async incrementStock(id, qty) {
    const { rows } = await pool.query(
      'UPDATE producto SET stock = stock + $1 WHERE id_producto = $2 RETURNING id_producto, nombre, descripcion, categoria, stock, min_stock, precio_unit',
      [qty, id]
    );
    return rows[0];
  },

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
};







































module.exports = Product;
