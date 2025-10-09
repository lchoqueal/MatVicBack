const Product = require('../models/productModel');

// opcional: inyectar io en runtime desde index.js
let io = null;
// la función setIO se exportará al final para no ser sobrescrita
function setIO(socketIo) {
  io = socketIo;
}

const productController = {
  async list(req, res) {
    try {
      const products = await Product.getAll();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async get(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.getById(id);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async create(req, res) {
    try {
      // validations
      if (!req.body.nombre) return res.status(400).json({ error: 'nombre es requerido' });
      const created = await Product.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await Product.update(id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async remove(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Product.remove(id);
      if (!deleted) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { stock } = req.body;
      const updated = await Product.updateStock(id, stock);
      // persistir alerta si corresponde
      if (updated && updated.min_stock !== undefined && updated.stock <= updated.min_stock) {
        // insertar alerta
        await require('../config/db').query('INSERT INTO alerta (id_producto, tipo, stock_actual, min_stock, mensaje) VALUES ($1,$2,$3,$4,$5)', [id, 'stock_minimo', updated.stock, updated.min_stock, `Stock en o por debajo de minimo: ${updated.stock}`]);
      }
      // emitir evento de stock actualizado
      if (io) io.emit('stock.updated', { productId: id, stock: updated.stock });
      // emitir alerta si stock <= min_stock
      if (updated && updated.min_stock !== undefined && updated.stock <= updated.min_stock) {
        if (io) io.emit('stock.alert', { productId: id, stock: updated.stock, min_stock: updated.min_stock });
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  // compra: incrementar stock
  async purchase(req, res) {
    try {
      const { id } = req.params;
      const { cantidad } = req.body;
      if (!cantidad || cantidad <= 0) return res.status(400).json({ error: 'cantidad debe ser mayor a 0' });
      const updated = await Product.incrementStock(id, cantidad);
      // emitir evento
      if (io) io.emit('stock.updated', { productId: id, stock: updated.stock });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  // transferencia simplificada entre productos
  async transfer(req, res) {
    try {
      const { from, to, cantidad } = req.body;
      if (!from || !to || !cantidad) return res.status(400).json({ error: 'from, to y cantidad son requeridos' });
      const result = await Product.transferStock(from, to, cantidad);
      // emitir eventos
      if (io) {
        io.emit('stock.updated', { productId: result.from.id_producto, stock: result.from.stock });
        io.emit('stock.updated', { productId: result.to.id_producto, stock: result.to.stock });
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async alerts(req, res) {
    try {
      const critical = await Product.getCritical();
      res.json(critical);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = productController;
// exportar setIO como propiedad del módulo
module.exports.setIO = setIO;
