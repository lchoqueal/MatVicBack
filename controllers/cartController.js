const pool = require('../config/db');
const Cart = require('../models/cartModel');

const cartController = {
  // Historia 8: Obtener catálogo de productos disponibles (público, sin autenticación)
  async catalog(req, res) {
    try {
      const { rows } = await pool.query(
        `SELECT id_producto, nombre, descripcion, categoria, stock, precio_unit
         FROM producto 
         WHERE stock > 0 
         ORDER BY categoria, nombre`
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Historia 9: Obtener o crear carrito del cliente autenticado
  async getCart(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      // Verificar que el usuario es cliente
      const { rows: clientRows } = await pool.query(
        `SELECT id_usuario_cliente FROM cliente WHERE id_usuario_cliente = $1`,
        [userId]
      );
      if (clientRows.length === 0) {
        return res.status(403).json({ error: 'Solo clientes pueden acceder a carritos' });
      }

      // Obtener carrito
      const cart = await Cart.getById(id);
      if (!cart) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
      }

      // Verificar que el carrito pertenece al cliente
      if (cart.id_cliente !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para acceder a este carrito' });
      }

      // Obtener items del carrito
      const items = await Cart.getItems(id);

      // Calcular total
      let total = 0;
      for (const item of items) {
        total += item.subtotal;
      }

      res.json({
        id_carrito: cart.id_carrito,
        estado: cart.estado,
        items: items,
        total: total,
        cantidad_items: items.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Historia 9: Crear carrito o retornar el activo
  async createCart(req, res) {
    try {
      const userId = req.userId;

      // Verificar que el usuario es cliente
      const { rows: clientRows } = await pool.query(
        `SELECT id_usuario_cliente FROM cliente WHERE id_usuario_cliente = $1`,
        [userId]
      );
      if (clientRows.length === 0) {
        return res.status(403).json({ error: 'Solo clientes pueden crear carritos' });
      }

      // Obtener o crear carrito
      const cart = await Cart.getOrCreateCart(userId);
      res.status(201).json({
        id_carrito: cart.id_carrito,
        estado: cart.estado,
        items: [],
        total: 0,
        cantidad_items: 0
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Historia 9: Agregar producto al carrito
  async addItem(req, res) {
    try {
      const { id } = req.params;
      const { id_producto, cantidad } = req.body;
      const userId = req.userId;

      if (!id_producto || !cantidad || cantidad <= 0) {
        return res.status(400).json({ error: 'id_producto y cantidad (> 0) son requeridos' });
      }

      // Obtener carrito y verificar que pertenece al cliente
      const cart = await Cart.getById(id);
      if (!cart) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
      }
      if (cart.id_cliente !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para modificar este carrito' });
      }

      // Agregar item
      await Cart.addItem(id, id_producto, cantidad);

      // Retornar carrito actualizado
      const items = await Cart.getItems(id);
      let total = 0;
      for (const item of items) {
        total += item.subtotal;
      }

      res.json({
        id_carrito: id,
        estado: cart.estado,
        items: items,
        total: total,
        cantidad_items: items.length
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Historia 9: Actualizar cantidad de un item en el carrito
  async updateItemQuantity(req, res) {
    try {
      const { id, itemId } = req.params;
      const { cantidad } = req.body;
      const userId = req.userId;

      if (!cantidad || cantidad <= 0) {
        return res.status(400).json({ error: 'cantidad debe ser mayor a 0' });
      }

      // Obtener carrito y verificar que pertenece al cliente
      const cart = await Cart.getById(id);
      if (!cart) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
      }
      if (cart.id_cliente !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para modificar este carrito' });
      }

      // Actualizar cantidad
      await Cart.updateItemQuantity(itemId, cantidad);

      // Retornar carrito actualizado
      const items = await Cart.getItems(id);
      let total = 0;
      for (const item of items) {
        total += item.subtotal;
      }

      res.json({
        id_carrito: id,
        estado: cart.estado,
        items: items,
        total: total,
        cantidad_items: items.length
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Historia 9: Eliminar item del carrito
  async removeItem(req, res) {
    try {
      const { id, itemId } = req.params;
      const userId = req.userId;

      // Obtener carrito y verificar que pertenece al cliente
      const cart = await Cart.getById(id);
      if (!cart) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
      }
      if (cart.id_cliente !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para modificar este carrito' });
      }

      // Eliminar item
      await Cart.removeItem(itemId);

      // Retornar carrito actualizado
      const items = await Cart.getItems(id);
      let total = 0;
      for (const item of items) {
        total += item.subtotal;
      }

      res.json({
        id_carrito: id,
        estado: cart.estado,
        items: items,
        total: total,
        cantidad_items: items.length
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Historia 9: Procesar compra (checkout)
  async checkout(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      // Obtener carrito y verificar que pertenece al cliente
      const cart = await Cart.getById(id);
      if (!cart) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
      }
      if (cart.id_cliente !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para procesar este carrito' });
      }

      // Obtener un empleado válido para procesar la compra (el primero disponible)
      const { rows: empleados } = await pool.query(
        `SELECT id_usuario_empleado FROM empleado LIMIT 1`
      );
      
      if (empleados.length === 0) {
        return res.status(400).json({ error: 'No hay empleados disponibles para procesar la compra' });
      }

      const idEmpleado = empleados[0].id_usuario_empleado;
      const result = await Cart.checkout(id, idEmpleado);

      res.status(201).json({
        success: true,
        message: 'Compra procesada exitosamente',
        boleta: result
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

module.exports = cartController;
