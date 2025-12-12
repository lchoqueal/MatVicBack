const pool = require('../config/db');

const cartController = {
  // Obtener carrito del usuario autenticado
  getCart: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Verificar que el usuario es cliente
      const clientQuery = `
        SELECT id_usuario_cliente FROM cliente 
        WHERE id_usuario_cliente = $1 AND estado = 'activo'
      `;
      const clientResult = await pool.query(clientQuery, [userId]);
      
      if (!clientResult.rows.length) {
        return res.status(403).json({ error: 'Solo clientes pueden acceder al carrito' });
      }
      
      // Obtener carrito activo del cliente
      const carritoQuery = `
        SELECT id_carrito, estado 
        FROM carrito 
        WHERE id_cliente = $1 AND estado_carrito = 'activo'
      `;
      const carritoResult = await pool.query(carritoQuery, [userId]);
      
      let carritoId;
      if (!carritoResult.rows.length) {
        // Crear carrito si no existe
        const createQuery = `
          INSERT INTO carrito (id_cliente, estado, estado_carrito) 
          VALUES ($1, 'activo', 'activo') 
          RETURNING id_carrito, estado
        `;
        const newCarrito = await pool.query(createQuery, [userId]);
        carritoId = newCarrito.rows[0].id_carrito;
      } else {
        carritoId = carritoResult.rows[0].id_carrito;
      }
      
      // Obtener items del carrito
      const itemsQuery = `
        SELECT 
          dc.id_detalle_carrito,
          dc.cantidad,
          p.id_producto,
          p.nombre,
          p.precio_unit,
          p.imagen_url,
          p.stock,
          (dc.cantidad * p.precio_unit) as subtotal
        FROM detalle_carrito dc
        JOIN producto p ON dc.id_producto = p.id_producto
        WHERE dc.id_carrito = $1 AND p.estado = 'activo'
        ORDER BY dc.id_detalle_carrito DESC
      `;
      
      const itemsResult = await pool.query(itemsQuery, [carritoId]);
      
      // Calcular total
      const total = itemsResult.rows.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
      
      res.json({
        success: true,
        carrito: {
          id_carrito: carritoId,
          items: itemsResult.rows,
          total: total,
          cantidad_items: itemsResult.rows.length
        }
      });
      
    } catch (error) {
      console.error('Error al obtener carrito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },  // Agregar producto al carrito
  addToCart: async (req, res) => {
    try {
      const userId = req.user.id;
      const { producto_id, cantidad = 1 } = req.body;
      
      if (!producto_id || cantidad <= 0) {
        return res.status(400).json({ 
          error: 'Se requiere producto_id y cantidad debe ser mayor a 0' 
        });
      }
      
      // Verificar que el usuario es cliente
      const clientQuery = `
        SELECT id_usuario_cliente FROM cliente 
        WHERE id_usuario_cliente = $1 AND estado = 'activo'
      `;
      const clientResult = await pool.query(clientQuery, [userId]);
      
      if (!clientResult.rows.length) {
        return res.status(403).json({ error: 'Solo clientes pueden agregar productos al carrito' });
      }
      
      // Verificar que el producto existe y está activo
      const productQuery = `
        SELECT id_producto, nombre, precio_unit, stock 
        FROM producto 
        WHERE id_producto = $1 AND estado = 'activo'
      `;
      const productResult = await pool.query(productQuery, [producto_id]);
      
      if (!productResult.rows.length) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      
      const producto = productResult.rows[0];
      
      // Verificar stock disponible
      if (producto.stock < cantidad) {
        return res.status(400).json({ 
          error: `Stock insuficiente. Disponible: ${producto.stock}` 
        });
      }
      
      // Obtener o crear carrito activo
      let carritoQuery = `
        SELECT id_carrito FROM carrito 
        WHERE id_cliente = $1 AND estado_carrito = 'activo'
      `;
      let carritoResult = await pool.query(carritoQuery, [userId]);
      
      let carritoId;
      if (!carritoResult.rows.length) {
        // Crear carrito
        const createCarritoQuery = `
          INSERT INTO carrito (id_cliente, estado, estado_carrito) 
          VALUES ($1, 'activo', 'activo') 
          RETURNING id_carrito
        `;
        const newCarrito = await pool.query(createCarritoQuery, [userId]);
        carritoId = newCarrito.rows[0].id_carrito;
      } else {
        carritoId = carritoResult.rows[0].id_carrito;
      }
      
      // Verificar si el producto ya está en el carrito
      const existingItemQuery = `
        SELECT id_detalle_carrito, cantidad 
        FROM detalle_carrito 
        WHERE id_carrito = $1 AND id_producto = $2
      `;
      const existingResult = await pool.query(existingItemQuery, [carritoId, producto_id]);
      
      if (existingResult.rows.length > 0) {
        // Actualizar cantidad si ya existe
        const newCantidad = existingResult.rows[0].cantidad + cantidad;
        
        // Verificar stock para la nueva cantidad
        if (producto.stock < newCantidad) {
          return res.status(400).json({ 
            error: `Stock insuficiente para cantidad total: ${newCantidad}. Disponible: ${producto.stock}` 
          });
        }
        
        const updateQuery = `
          UPDATE detalle_carrito 
          SET cantidad = $1
          WHERE id_carrito = $2 AND id_producto = $3
        `;
        
        await pool.query(updateQuery, [newCantidad, carritoId, producto_id]);
        
        res.json({
          success: true,
          message: 'Cantidad actualizada en el carrito',
          action: 'updated'
        });
      } else {
        // Insertar nuevo item al carrito
        const insertQuery = `
          INSERT INTO detalle_carrito (id_carrito, id_producto, cantidad)
          VALUES ($1, $2, $3)
        `;
        
        await pool.query(insertQuery, [carritoId, producto_id, cantidad]);
        
        res.status(201).json({
          success: true,
          message: 'Producto agregado al carrito',
          action: 'added'
        });
      }
      
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar cantidad de producto en carrito
  updateQuantity: async (req, res) => {
    try {
      const userId = req.user.id;
      const { producto_id, cantidad } = req.body;
      
      if (!producto_id || cantidad < 0) {
        return res.status(400).json({ 
          error: 'Se requiere producto_id y cantidad debe ser mayor o igual a 0' 
        });
      }
      
      // Obtener carrito del cliente
      const carritoQuery = `
        SELECT id_carrito FROM carrito 
        WHERE id_cliente = $1 AND estado_carrito = 'activo'
      `;
      const carritoResult = await pool.query(carritoQuery, [userId]);
      
      if (!carritoResult.rows.length) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
      }
      
      const carritoId = carritoResult.rows[0].id_carrito;
      
      // Si cantidad es 0, eliminar del carrito
      if (cantidad === 0) {
        const deleteQuery = `
          DELETE FROM detalle_carrito 
          WHERE id_carrito = $1 AND id_producto = $2
        `;
        
        const result = await pool.query(deleteQuery, [carritoId, producto_id]);
        
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }
        
        return res.json({
          success: true,
          message: 'Producto eliminado del carrito'
        });
      }
      
      // Verificar stock disponible
      const productQuery = `
        SELECT stock FROM producto 
        WHERE id_producto = $1 AND estado = 'activo'
      `;
      const productResult = await pool.query(productQuery, [producto_id]);
      
      if (!productResult.rows.length) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      
      const producto = productResult.rows[0];
      
      if (producto.stock < cantidad) {
        return res.status(400).json({ 
          error: `Stock insuficiente. Disponible: ${producto.stock}` 
        });
      }
      
      // Actualizar cantidad
      const updateQuery = `
        UPDATE detalle_carrito 
        SET cantidad = $1
        WHERE id_carrito = $2 AND id_producto = $3
      `;
      
      const result = await pool.query(updateQuery, [cantidad, carritoId, producto_id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
      }
      
      res.json({
        success: true,
        message: 'Cantidad actualizada exitosamente'
      });
      
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Eliminar producto del carrito
  removeFromCart: async (req, res) => {
    try {
      const userId = req.user.id;
      const { producto_id } = req.params;
      
      // Obtener carrito del cliente
      const carritoQuery = `
        SELECT id_carrito FROM carrito 
        WHERE id_cliente = $1 AND estado_carrito = 'activo'
      `;
      const carritoResult = await pool.query(carritoQuery, [userId]);
      
      if (!carritoResult.rows.length) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
      }
      
      const carritoId = carritoResult.rows[0].id_carrito;
      
      const deleteQuery = `
        DELETE FROM detalle_carrito 
        WHERE id_carrito = $1 AND id_producto = $2
      `;
      
      const result = await pool.query(deleteQuery, [carritoId, producto_id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
      }
      
      res.json({
        success: true,
        message: 'Producto eliminado del carrito exitosamente'
      });
      
    } catch (error) {
      console.error('Error al eliminar del carrito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Limpiar carrito completamente
  clearCart: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Obtener carrito del cliente
      const carritoQuery = `
        SELECT id_carrito FROM carrito 
        WHERE id_cliente = $1 AND estado_carrito = 'activo'
      `;
      const carritoResult = await pool.query(carritoQuery, [userId]);
      
      if (!carritoResult.rows.length) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
      }
      
      const carritoId = carritoResult.rows[0].id_carrito;
      
      const deleteQuery = `
        DELETE FROM detalle_carrito 
        WHERE id_carrito = $1
      `;
      
      const result = await pool.query(deleteQuery, [carritoId]);
      
      res.json({
        success: true,
        message: 'Carrito vaciado exitosamente',
        items_eliminados: result.rowCount
      });
      
    } catch (error) {
      console.error('Error al vaciar carrito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener cantidad de items en carrito
  getCartCount: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Obtener carrito del cliente
      const carritoQuery = `
        SELECT id_carrito FROM carrito 
        WHERE id_cliente = $1 AND estado_carrito = 'activo'
      `;
      const carritoResult = await pool.query(carritoQuery, [userId]);
      
      if (!carritoResult.rows.length) {
        return res.json({
          success: true,
          count: 0,
          total_items: 0
        });
      }
      
      const carritoId = carritoResult.rows[0].id_carrito;
      
      const countQuery = `
        SELECT COUNT(*) as count, COALESCE(SUM(cantidad), 0) as total_items
        FROM detalle_carrito 
        WHERE id_carrito = $1
      `;
      
      const result = await pool.query(countQuery, [carritoId]);
      
      res.json({
        success: true,
        count: parseInt(result.rows[0].count),
        total_items: parseInt(result.rows[0].total_items)
      });
      
    } catch (error) {
      console.error('Error al obtener cantidad del carrito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = cartController;module.exports = cartController;
