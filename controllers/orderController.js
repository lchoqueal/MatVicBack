const pool = require('../config/db');

const orderController = {
  // Crear nuevo pedido (checkout)
  createOrder: async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { items, shippingInfo, metodoPago, notas = '' } = req.body;
      const userId = req.user.id;
      
      // Validar datos requeridos
      if (!items || !items.length || !shippingInfo || !metodoPago) {
        return res.status(400).json({ 
          error: 'Faltan datos requeridos: items, información de envío y método de pago' 
        });
      }
      
      // Verificar que el usuario es cliente
      const clientQuery = `
        SELECT id_usuario_cliente FROM cliente 
        WHERE id_usuario_cliente = $1 AND estado = 'activo'
      `;
      const clientResult = await client.query(clientQuery, [userId]);
      
      if (!clientResult.rows.length) {
        return res.status(403).json({ error: 'Solo clientes pueden crear pedidos' });
      }
      
      // Obtener un empleado para procesar la venta (el primero disponible)
      const empleadoQuery = `
        SELECT id_usuario_empleado FROM empleado 
        WHERE estado_empleado = 'activo' 
        LIMIT 1
      `;
      const empleadoResult = await client.query(empleadoQuery);
      
      if (!empleadoResult.rows.length) {
        throw new Error('No hay empleados disponibles para procesar la venta');
      }
      
      const idEmpleado = empleadoResult.rows[0].id_usuario_empleado;
      
      // Validar stock disponible y calcular total
      let total = 0;
      const validatedItems = [];
      
      for (const item of items) {
        const productQuery = `
          SELECT id_producto, nombre, precio_unit, stock 
          FROM producto 
          WHERE id_producto = $1 AND estado = 'activo'
        `;
        const productResult = await client.query(productQuery, [item.producto_id]);
        
        if (!productResult.rows.length) {
          throw new Error(`Producto ${item.producto_id} no encontrado`);
        }
        
        const product = productResult.rows[0];
        
        if (product.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}, Solicitado: ${item.cantidad}`);
        }
        
        const itemTotal = product.precio_unit * item.cantidad;
        total += itemTotal;
        
        validatedItems.push({
          ...item,
          nombre: product.nombre,
          precio_unit: product.precio_unit,
          sub_total: itemTotal
        });
      }
      
      // Crear la boleta
      const boletaQuery = `
        INSERT INTO boleta (
          metodo_pago, fecha_emision, total, 
          id_empleado_boleta, id_cliente_boleta, estado_boleta
        ) VALUES ($1, CURRENT_DATE, $2, $3, $4, 'activo')
        RETURNING id_boleta, fecha_emision
      `;
      
      const boletaValues = [metodoPago, total, idEmpleado, userId];
      const boletaResult = await client.query(boletaQuery, boletaValues);
      const boletaId = boletaResult.rows[0].id_boleta;
      const fechaEmision = boletaResult.rows[0].fecha_emision;
      
      // Insertar detalles de la boleta y actualizar stock
      for (const item of validatedItems) {
        // Insertar detalle de boleta
        const detalleQuery = `
          INSERT INTO detalle_boleta (
            sub_total, cantidad, id_boleta, id_producto
          ) VALUES ($1, $2, $3, $4)
        `;
        
        await client.query(detalleQuery, [
          item.sub_total,
          item.cantidad,
          boletaId,
          item.producto_id
        ]);
        
        // Actualizar stock del producto
        const updateStockQuery = `
          UPDATE producto 
          SET stock = stock - $1 
          WHERE id_producto = $2
        `;
        
        await client.query(updateStockQuery, [item.cantidad, item.producto_id]);
      }
      
      // Limpiar carrito del usuario
      const carritoQuery = `
        SELECT id_carrito FROM carrito 
        WHERE id_cliente = $1 AND estado_carrito = 'activo'
      `;
      const carritoResult = await client.query(carritoQuery, [userId]);
      
      if (carritoResult.rows.length > 0) {
        const carritoId = carritoResult.rows[0].id_carrito;
        await client.query('DELETE FROM detalle_carrito WHERE id_carrito = $1', [carritoId]);
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        boleta: {
          id_boleta: boletaId,
          fecha_emision: fechaEmision,
          total,
          metodo_pago: metodoPago,
          estado: 'activo',
          items: validatedItems
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al crear pedido:', error);
      
      if (error.message.includes('Stock insuficiente') || 
          error.message.includes('no encontrado') ||
          error.message.includes('Faltan datos') ||
          error.message.includes('No hay empleados')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor al crear pedido' 
      });
    } finally {
      client.release();
    }
  },

  // Obtener pedidos del usuario (boletas)
  getUserOrders: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const boletasQuery = `
        SELECT 
          b.id_boleta, b.fecha_emision, b.total, b.metodo_pago,
          b.estado_boleta as estado
        FROM boleta b
        WHERE b.id_cliente_boleta = $1 AND b.estado_boleta = 'activo'
        ORDER BY b.fecha_emision DESC
      `;
      
      const boletasResult = await pool.query(boletasQuery, [userId]);
      
      res.json({
        success: true,
        pedidos: boletasResult.rows
      });
      
    } catch (error) {
      console.error('Error al obtener pedidos del usuario:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al obtener pedidos' 
      });
    }
  },

  // Obtener detalles de un pedido (boleta)
  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.rol === 'administrador';
      
      // Query principal de la boleta
      const boletaQuery = `
        SELECT 
          b.*,
          c.nombres as cliente_nombres, c.apellidos as cliente_apellidos,
          uc.correo as cliente_email
        FROM boleta b
        JOIN cliente cl ON b.id_cliente_boleta = cl.id_usuario_cliente
        JOIN usuario c ON cl.id_usuario_cliente = c.id_usuario
        JOIN cliente uc ON c.id_usuario = uc.id_usuario_cliente
        WHERE b.id_boleta = $1 ${!isAdmin ? 'AND b.id_cliente_boleta = $2' : ''}
      `;
      
      const boletaParams = isAdmin ? [id] : [id, userId];
      const boletaResult = await pool.query(boletaQuery, boletaParams);
      
      if (!boletaResult.rows.length) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      
      const boleta = boletaResult.rows[0];
      
      // Obtener detalles de la boleta
      const detallesQuery = `
        SELECT 
          db.cantidad, db.sub_total,
          p.id_producto, p.nombre as producto_nombre,
          p.imagen_url, p.precio_unit
        FROM detalle_boleta db
        JOIN producto p ON db.id_producto = p.id_producto
        WHERE db.id_boleta = $1
      `;
      
      const detallesResult = await pool.query(detallesQuery, [id]);
      
      res.json({
        success: true,
        pedido: {
          ...boleta,
          items: detallesResult.rows
        }
      });
      
    } catch (error) {
      console.error('Error al obtener detalles del pedido:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al obtener detalles del pedido' 
      });
    }
  },

  // Obtener todas las boletas (solo admin)
  getAllOrders: async (req, res) => {
    try {
      const { page = 1, limit = 10, estado, fecha_desde, fecha_hasta } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const queryParams = [];
      let paramCount = 0;
      
      if (estado) {
        paramCount++;
        whereClause += ` AND b.estado_boleta = $${paramCount}`;
        queryParams.push(estado);
      }
      
      if (fecha_desde) {
        paramCount++;
        whereClause += ` AND b.fecha_emision >= $${paramCount}`;
        queryParams.push(fecha_desde);
      }
      
      if (fecha_hasta) {
        paramCount++;
        whereClause += ` AND b.fecha_emision <= $${paramCount}`;
        queryParams.push(fecha_hasta);
      }
      
      const boletasQuery = `
        SELECT 
          b.id_boleta, b.fecha_emision, b.total, b.metodo_pago,
          b.estado_boleta as estado,
          c.nombres as cliente_nombres, c.apellidos as cliente_apellidos,
          cl.correo as cliente_email
        FROM boleta b
        JOIN cliente cl ON b.id_cliente_boleta = cl.id_usuario_cliente
        JOIN usuario c ON cl.id_usuario_cliente = c.id_usuario
        ${whereClause}
        ORDER BY b.fecha_emision DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      queryParams.push(limit, offset);
      
      const boletasResult = await pool.query(boletasQuery, queryParams);
      
      // Contar total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM boleta b
        ${whereClause}
      `;
      
      const countResult = await pool.query(countQuery, queryParams.slice(0, paramCount));
      const total = parseInt(countResult.rows[0].total);
      
      res.json({
        success: true,
        pedidos: boletasResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error al obtener todas las boletas:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al obtener pedidos' 
      });
    }
  },

  // Actualizar estado de la boleta (solo admin)
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      const validStates = ['activo', 'cancelado', 'procesado'];
      
      if (!validStates.includes(estado)) {
        return res.status(400).json({ 
          error: `Estado inválido. Estados válidos: ${validStates.join(', ')}` 
        });
      }
      
      const updateQuery = `
        UPDATE boleta 
        SET estado_boleta = $1
        WHERE id_boleta = $2
        RETURNING id_boleta, estado_boleta, fecha_emision
      `;
      
      const result = await pool.query(updateQuery, [estado, id]);
      
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      
      res.json({
        success: true,
        message: 'Estado del pedido actualizado exitosamente',
        pedido: result.rows[0]
      });
      
    } catch (error) {
      console.error('Error al actualizar estado del pedido:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al actualizar estado' 
      });
    }
  }
};

module.exports = orderController;