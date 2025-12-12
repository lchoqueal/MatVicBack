const pool = require('../config/db');

const Cart = {
  // Busca un carrito activo para el cliente
  async findOrCreateByUserId(id_cliente) {
    // Buscar carrito activo
    let { rows } = await pool.query(
      'SELECT * FROM carrito WHERE id_cliente = $1 AND estado = $2 LIMIT 1',
      [id_cliente, 'activo']
    );
    if (rows.length > 0) return rows[0];
    // Si no existe, crear uno nuevo
    ({ rows } = await pool.query(
      'INSERT INTO carrito (estado, id_cliente) VALUES ($1, $2) RETURNING *',
      ['activo', id_cliente]
    ));
    return rows[0];
  },

  // 2. OBTENER CARRITO POR ID
  async getById(idCarrito) {
    const { rows } = await pool.query(
      `SELECT id_carrito, estado_carrito, estado, id_cliente 
       FROM carrito WHERE id_carrito = $1`,
      [idCarrito]
    );
    return rows[0];
  },

  // 3. OBTENER ITEMS DEL CARRITO
  async getItems(idCarrito) {
    // Nota: Usamos 'id_detalle_carrito' como confirmaste en tu SQL
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

  // 4. AGREGAR ITEM (Con transacción para seguridad)
  async addItem(idCarrito, idProducto, cantidad) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // A. Validar producto y stock
      const { rows: productRows } = await client.query(
        `SELECT id_producto, stock, precio_unit FROM producto WHERE id_producto = $1`,
        [idProducto]
      );
      
      if (productRows.length === 0) throw new Error('Producto no encontrado');
      if (productRows[0].stock < cantidad) throw new Error('Stock insuficiente');

      // B. Verificar si el producto ya está en el carrito
      const { rows: existingItems } = await client.query(
        `SELECT id_detalle_carrito, cantidad FROM detalle_carrito 
         WHERE id_carrito = $1 AND id_producto = $2`,
        [idCarrito, idProducto]
      );

      let result;
      if (existingItems.length > 0) {
        // C. Actualizar cantidad si ya existe
        const newQuantity = existingItems[0].cantidad + cantidad;
        if (productRows[0].stock < newQuantity) throw new Error('Stock insuficiente para el total solicitado');
        
        const { rows: updated } = await client.query(
          `UPDATE detalle_carrito 
           SET cantidad = $1 
           WHERE id_detalle_carrito = $2 
           RETURNING id_detalle_carrito, cantidad, id_carrito, id_producto`,
          [newQuantity, existingItems[0].id_detalle_carrito]
        );
        result = updated[0];
      } else {
        // D. Insertar nuevo si no existe
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

  // 5. ACTUALIZAR CANTIDAD DE UN ITEM
  async updateItemQuantity(idDetalleCarrito, newQuantity) {
    if (newQuantity <= 0) throw new Error('La cantidad debe ser mayor a 0');
    
    const { rows } = await pool.query(
      `UPDATE detalle_carrito SET cantidad = $1 
       WHERE id_detalle_carrito = $2 
       RETURNING id_detalle_carrito, cantidad`,
      [newQuantity, idDetalleCarrito]
    );
    return rows[0];
  },

  // 6. ELIMINAR ITEM
  async removeItem(idDetalleCarrito) {
    const { rows } = await pool.query(
      `DELETE FROM detalle_carrito 
       WHERE id_detalle_carrito = $1 
       RETURNING id_detalle_carrito`,
      [idDetalleCarrito]
    );
    return rows[0];
  },

  // 7. CHECKOUT (Procesar Compra)
  async checkout(idCarrito, idEmpleado) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // A. Obtener info del carrito
      const { rows: cartRows } = await client.query(
        `SELECT id_carrito, id_cliente FROM carrito WHERE id_carrito = $1`,
        [idCarrito]
      );
      if (cartRows.length === 0) throw new Error('Carrito no encontrado');
      const idCliente = cartRows[0].id_cliente;

      // B. Obtener los productos del carrito
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
        if (item.stock < item.cantidad) throw new Error(`Stock insuficiente para producto ID ${item.id_producto}`);
        total += item.cantidad * item.precio_unit;
      }

      // D. Crear Boleta
      // Nota: Asumimos columnas estándar (id_cliente, id_empleado, monto_total).
      // Si tu tabla usa nombres distintos, ajusta aquí.
      const { rows: boletaRows } = await client.query(
        `INSERT INTO boleta (metodo_pago, fecha_emision, monto_total, id_empleado, id_cliente)
         VALUES ('online', NOW(), $1, $2, $3)
         RETURNING id_boleta, monto_total, fecha_emision`,
        [total, idEmpleado, idCliente]
      );
      const idBoleta = boletaRows[0].id_boleta;

      // E. Mover items a detalle_boleta y descontar stock
      for (const item of items) {
        const subTotal = item.cantidad * item.precio_unit;

        // Insertar en detalle_boleta (Usando 'sub_total' como en tu SQL)
        await client.query(
          `INSERT INTO detalle_boleta (sub_total, cantidad, id_boleta, id_producto)
           VALUES ($1, $2, $3, $4)`,
          [subTotal, item.cantidad, idBoleta, item.id_producto]
        );

        // Actualizar Stock
        await client.query(
          `UPDATE producto SET stock = stock - $1 WHERE id_producto = $2`,
          [item.cantidad, item.id_producto]
        );
      }

      // F. CERRAR CARRITO
      // Aquí aplicamos tu lógica actualizada:
      // estado_carrito -> 'cerrado' (ya no está activo)
      // estado -> 'pagado' (ya se procesó el pago)
      await client.query(
        `UPDATE carrito 
         SET estado_carrito = 'cerrado', estado = 'pagado' 
         WHERE id_carrito = $1`,
        [idCarrito]
      );

      // G. Limpiar detalle_carrito (Opcional, para no duplicar data si se reusara, aunque aquí lo cerramos)
      await client.query(
        `DELETE FROM detalle_carrito WHERE id_carrito = $1`,
        [idCarrito]
      );

      await client.query('COMMIT');
      return {
        success: true,
        id_boleta: idBoleta,
        total: total,
        items_count: items.length
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
