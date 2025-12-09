const pool = require('../config/db');

const Cart = {
  // Obtener o crear carrito activo del cliente
  async getOrCreateCart(idCliente) {
    const { rows } = await pool.query(
      `SELECT id_carrito, estado, id_cliente FROM carrito 
       WHERE id_cliente = $1 AND estado = 'activo' 
       LIMIT 1`,
      [idCliente]
    );
    if (rows.length > 0) {
      return rows[0];
    }
    // Crear carrito nuevo si no existe activo
    const { rows: created } = await pool.query(
      `INSERT INTO carrito (estado, id_cliente) 
       VALUES ('activo', $1) 
       RETURNING id_carrito, estado, id_cliente`,
      [idCliente]
    );
    return created[0];
  },

  // Obtener carrito por ID
  async getById(idCarrito) {
    const { rows } = await pool.query(
      `SELECT id_carrito, estado, id_cliente FROM carrito WHERE id_carrito = $1`,
      [idCarrito]
    );
    return rows[0];
  },

  // Obtener items del carrito con información del producto
  async getItems(idCarrito) {
    const { rows } = await pool.query(
      `SELECT 
        dc.id_detalle_carrito,
        dc.cantidad,
        dc.id_carrito,
        dc.id_producto,
        p.nombre,
        p.descripcion,
        p.precio_unit,
        p.stock,
        (dc.cantidad * p.precio_unit) AS subtotal
       FROM detalle_carrito dc
       JOIN producto p ON dc.id_producto = p.id_producto
       WHERE dc.id_carrito = $1
       ORDER BY dc.id_detalle_carrito`,
      [idCarrito]
    );
    return rows;
  },

  // Agregar producto al carrito (o incrementar cantidad si ya existe)
  async addItem(idCarrito, idProducto, cantidad) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validar que el producto existe y tiene stock
      const { rows: productRows } = await client.query(
        `SELECT id_producto, stock, precio_unit FROM producto 
         WHERE id_producto = $1`,
        [idProducto]
      );
      if (productRows.length === 0) {
        throw new Error('Producto no encontrado');
      }
      if (productRows[0].stock < cantidad) {
        throw new Error('Stock insuficiente');
      }

      // Verificar si el producto ya está en el carrito
      const { rows: existingItems } = await client.query(
        `SELECT id_detalle_carrito, cantidad FROM detalle_carrito 
         WHERE id_carrito = $1 AND id_producto = $2`,
        [idCarrito, idProducto]
      );

      let result;
      if (existingItems.length > 0) {
        // Incrementar cantidad
        const newQuantity = existingItems[0].cantidad + cantidad;
        if (productRows[0].stock < newQuantity) {
          throw new Error('Stock insuficiente para la cantidad total');
        }
        const { rows: updated } = await client.query(
          `UPDATE detalle_carrito 
           SET cantidad = $1 
           WHERE id_detalle_carrito = $2 
           RETURNING id_detalle_carrito, cantidad, id_carrito, id_producto`,
          [newQuantity, existingItems[0].id_detalle_carrito]
        );
        result = updated[0];
      } else {
        // Agregar nuevo item
        const { rows: inserted } = await client.query(
          `INSERT INTO detalle_carrito (cantidad, id_carrito, id_producto) 
           VALUES ($1, $2, $3) 
           RETURNING id_detalle_carrito, cantidad, id_carrito, id_producto`,
          [cantidad, idCarrito, idProducto]
        );
        result = inserted[0];
      }

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Actualizar cantidad de un item
  async updateItemQuantity(idDetalleCarrito, newQuantity) {
    if (newQuantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }
    const { rows } = await pool.query(
      `UPDATE detalle_carrito 
       SET cantidad = $1 
       WHERE id_detalle_carrito = $2 
       RETURNING id_detalle_carrito, cantidad, id_carrito, id_producto`,
      [newQuantity, idDetalleCarrito]
    );
    if (rows.length === 0) {
      throw new Error('Item del carrito no encontrado');
    }
    return rows[0];
  },

  // Eliminar item del carrito
  async removeItem(idDetalleCarrito) {
    const { rows } = await pool.query(
      `DELETE FROM detalle_carrito 
       WHERE id_detalle_carrito = $1 
       RETURNING id_detalle_carrito`,
      [idDetalleCarrito]
    );
    if (rows.length === 0) {
      throw new Error('Item del carrito no encontrado');
    }
    return rows[0];
  },

  // Vaciar carrito
  async clearCart(idCarrito) {
    await pool.query(
      `DELETE FROM detalle_carrito WHERE id_carrito = $1`,
      [idCarrito]
    );
    return true;
  },

  // Procesar compra: crear boleta a partir del carrito
  async checkout(idCarrito, idEmpleado) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener carrito y cliente
      const { rows: cartRows } = await client.query(
        `SELECT id_carrito, id_cliente FROM carrito WHERE id_carrito = $1`,
        [idCarrito]
      );
      if (cartRows.length === 0) {
        throw new Error('Carrito no encontrado');
      }
      const idCliente = cartRows[0].id_cliente;

      // Obtener items del carrito
      const { rows: items } = await client.query(
        `SELECT dc.id_detalle_carrito, dc.cantidad, dc.id_producto, p.precio_unit, p.stock
         FROM detalle_carrito dc
         JOIN producto p ON dc.id_producto = p.id_producto
         WHERE dc.id_carrito = $1`,
        [idCarrito]
      );

      if (items.length === 0) {
        throw new Error('El carrito está vacío');
      }

      // Validar stock para todos los items
      for (const item of items) {
        if (item.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para producto ${item.id_producto}`);
        }
      }

      // Calcular total
      let total = 0;
      for (const item of items) {
        total += item.cantidad * item.precio_unit;
      }

      // Crear boleta (método de pago: online)
      const { rows: boltaRows } = await client.query(
        `INSERT INTO boleta (metodo_pago, fecha_emision, total, id_empleado_boleta, id_cliente_boleta)
         VALUES ('online', NOW(), $1, $2, $3)
         RETURNING id_boleta, total, fecha_emision`,
        [total, idEmpleado, idCliente]
      );
      const idBoleta = boltaRows[0].id_boleta;

      // Insertar detalles de boleta y actualizar stock
      for (const item of items) {
        const subtotal = item.cantidad * item.precio_unit;
        await client.query(
          `INSERT INTO detalle_boleta (sub_total, cantidad, id_boleta, id_producto)
           VALUES ($1, $2, $3, $4)`,
          [subtotal, item.cantidad, idBoleta, item.id_producto]
        );

        await client.query(
          `UPDATE producto SET stock = stock - $1 WHERE id_producto = $2`,
          [item.cantidad, item.id_producto]
        );

        // Notificar cambio de stock
        const { rows: productRows } = await client.query(
          `SELECT stock, min_stock FROM producto WHERE id_producto = $1`,
          [item.id_producto]
        );
        const newStock = productRows[0].stock;
        const minStock = productRows[0].min_stock;

        await client.query(
          `SELECT pg_notify('stock_updated', $1)`,
          [JSON.stringify({ productId: item.id_producto, stock: newStock })]
        );

        if (newStock <= minStock) {
          await client.query(
            `SELECT pg_notify('stock_alert', $1)`,
            [JSON.stringify({ productId: item.id_producto, stock: newStock, min_stock: minStock })]
          );
        }
      }

      // Cambiar estado del carrito a completado
      await client.query(
        `UPDATE carrito SET estado = 'completado' WHERE id_carrito = $1`,
        [idCarrito]
      );

      // Limpiar detalles del carrito
      await client.query(
        `DELETE FROM detalle_carrito WHERE id_carrito = $1`,
        [idCarrito]
      );

      await client.query('COMMIT');
      return {
        id_boleta: idBoleta,
        total: boltaRows[0].total,
        fecha_emision: boltaRows[0].fecha_emision,
        metodo_pago: 'online',
        cantidad_items: items.length
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = Cart;
