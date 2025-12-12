const pool = require('../config/db');

const Cart = {
  // 1. Obtener o crear carrito activo
  async getOrCreateCart(idCliente) {
    // CORRECCIÓN: Usamos 'estado_carrito' que es la columna que tiene el default en tu BD
    const { rows } = await pool.query(
      `SELECT id_carrito, estado_carrito, id_cliente FROM carrito 
       WHERE id_cliente = $1 AND estado_carrito = 'activo' 
       LIMIT 1`,
      [idCliente]
    );

    if (rows.length > 0) {
      return rows[0];
    }

    // Si no existe, creamos uno nuevo.
    // CORRECCIÓN: Insertamos en 'estado_carrito' y también en 'estado' para evitar confusiones
    const { rows: created } = await pool.query(
      `INSERT INTO carrito (id_cliente, estado_carrito, estado) 
       VALUES ($1, 'activo', 'activo') 
       RETURNING id_carrito, estado_carrito, id_cliente`,
      [idCliente]
    );
    return created[0];
  },

  // 2. Obtener carrito por ID
  async getById(idCarrito) {
    const { rows } = await pool.query(
      `SELECT id_carrito, estado_carrito, id_cliente FROM carrito WHERE id_carrito = $1`,
      [idCarrito]
    );
    return rows[0];
  },

  // 3. Obtener items
  async getItems(idCarrito) {
    const { rows } = await pool.query(
      `SELECT 
        dc.id_detalle_carrito, -- CORRECCIÓN: Nombre exacto de tu tabla
        dc.cantidad,
        dc.id_carrito,
        dc.id_producto,
        p.nombre,
        p.descripcion,
        p.precio_unit,
        p.stock,
        p.imagen_url,
        (dc.cantidad * p.precio_unit) AS subtotal
       FROM detalle_carrito dc
       JOIN producto p ON dc.id_producto = p.id_producto
       WHERE dc.id_carrito = $1
       ORDER BY dc.id_detalle_carrito`,
      [idCarrito]
    );
    return rows;
  },

  // 4. Agregar item
  async addItem(idCarrito, idProducto, cantidad) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validar stock
      const { rows: productRows } = await client.query(
        `SELECT id_producto, stock, precio_unit FROM producto WHERE id_producto = $1`,
        [idProducto]
      );
      
      if (productRows.length === 0) throw new Error('Producto no encontrado');
      if (productRows[0].stock < cantidad) throw new Error('Stock insuficiente');

      // Verificar si ya existe en el carrito
      const { rows: existingItems } = await client.query(
        `SELECT id_detalle_carrito, cantidad FROM detalle_carrito 
         WHERE id_carrito = $1 AND id_producto = $2`,
        [idCarrito, idProducto]
      );

      let result;
      if (existingItems.length > 0) {
        // Actualizar existente
        const newQuantity = existingItems[0].cantidad + cantidad;
        if (productRows[0].stock < newQuantity) throw new Error('Stock insuficiente para el total');
        
        const { rows: updated } = await client.query(
          `UPDATE detalle_carrito 
           SET cantidad = $1 
           WHERE id_detalle_carrito = $2 
           RETURNING id_detalle_carrito, cantidad, id_carrito, id_producto`,
          [newQuantity, existingItems[0].id_detalle_carrito]
        );
        result = updated[0];
      } else {
        // Insertar nuevo
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

  // 5. Actualizar cantidad
  async updateItemQuantity(idDetalleCarrito, newQuantity) {
    if (newQuantity <= 0) throw new Error('Cantidad debe ser mayor a 0');
    
    const { rows } = await pool.query(
      `UPDATE detalle_carrito SET cantidad = $1 
       WHERE id_detalle_carrito = $2 
       RETURNING id_detalle_carrito, cantidad`,
      [newQuantity, idDetalleCarrito]
    );
    return rows[0];
  },

  // 6. Eliminar item
  async removeItem(idDetalleCarrito) {
    const { rows } = await pool.query(
      `DELETE FROM detalle_carrito WHERE id_detalle_carrito = $1 RETURNING id_detalle_carrito`,
      [idDetalleCarrito]
    );
    return rows[0];
  },

  // 7. CHECKOUT
  async checkout(idCarrito, idEmpleado) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // A. Obtener datos del carrito
      const { rows: cartRows } = await client.query(
        `SELECT id_carrito, id_cliente FROM carrito WHERE id_carrito = $1`,
        [idCarrito]
      );
      if (cartRows.length === 0) throw new Error('Carrito no encontrado');
      const idCliente = cartRows[0].id_cliente;

      // B. Obtener items
      const { rows: items } = await client.query(
        `SELECT dc.id_producto, dc.cantidad, p.precio_unit, p.stock
         FROM detalle_carrito dc
         JOIN producto p ON dc.id_producto = p.id_producto
         WHERE dc.id_carrito = $1`,
        [idCarrito]
      );

      if (items.length === 0) throw new Error('El carrito está vacío');

      // C. Validar Stock y Calcular Total
      let total = 0;
      for (const item of items) {
        if (item.stock < item.cantidad) throw new Error(`Stock insuficiente para producto ${item.id_producto}`);
        total += item.cantidad * item.precio_unit;
      }

      // D. Crear Boleta
      // CORRECCIÓN: Verifica si tus columnas en 'boleta' son id_empleado/id_cliente o id_empleado_boleta/id_cliente_boleta
      // Basado en tu último SQL, NO definiste la tabla boleta completa, pero asumiré nombres estándar.
      // Si falla aquí, revisa los nombres de columnas de tu tabla 'boleta'.
      const { rows: boletaRows } = await client.query(
        `INSERT INTO boleta (metodo_pago, fecha_emision, monto_total, id_empleado, id_cliente)
         VALUES ('online', NOW(), $1, $2, $3)
         RETURNING id_boleta, monto_total, fecha_emision`,
        [total, idEmpleado, idCliente]
      );
      const idBoleta = boletaRows[0].id_boleta;

      // E. Insertar Detalles de Boleta
      for (const item of items) {
        const subTotal = item.cantidad * item.precio_unit;

        // CORRECCIÓN: Usamos 'sub_total' (con guion bajo) que es como lo definiste en tu SQL
        await client.query(
          `INSERT INTO detalle_boleta (sub_total, cantidad, id_boleta, id_producto)
           VALUES ($1, $2, $3, $4)`,
          [subTotal, item.cantidad, idBoleta, item.id_producto]
        );

        // F. Descontar Stock
        await client.query(
          `UPDATE producto SET stock = stock - $1 WHERE id_producto = $2`,
          [item.cantidad, item.id_producto]
        );
      }

      // G. Cerrar Carrito
      // CORRECCIÓN: Actualizamos 'estado_carrito'
      await client.query(
        `UPDATE carrito SET estado_carrito = 'completado', estado = 'completado' WHERE id_carrito = $1`,
        [idCarrito]
      );

      // H. Limpiar detalles
      await client.query(
        `DELETE FROM detalle_carrito WHERE id_carrito = $1`,
        [idCarrito]
      );

      await client.query('COMMIT');
      return {
        id_boleta: idBoleta,
        total: total,
        items_procesados: items.length
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
