const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
  // LOGIN CON DETECCION DE ROL REAL
  async login(req, res) {
    const { username, name_user, password, contrasena } = req.body;
    const userLogin = username || name_user;
    const passLogin = password || contrasena;

    if (!userLogin || !passLogin) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    
    try {
      // Obtener usuario base
      const { rows } = await pool.query('SELECT * FROM usuario WHERE name_user = $1 LIMIT 1', [userLogin]);
      const user = rows[0];

      if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });

      const match = await bcrypt.compare(passLogin, user.contrasena || '');
      if (!match) return res.status(401).json({ error: 'Credenciales invalidas' });

      // DETERMINAR ROL REAL CONSULTANDO LAS TABLAS ESPECIFICAS
      let userRole = 'cliente'; // Por defecto cliente
      
      // Verificar si es administrador
      const adminQuery = 'SELECT id_usuario_admin FROM administrador WHERE id_usuario_admin = $1';
      const adminResult = await pool.query(adminQuery, [user.id_usuario]);
      
      if (adminResult.rows.length > 0) {
        userRole = 'administrador';
      } else {
        // Verificar si es empleado
        const empleadoQuery = 'SELECT id_usuario_empleado FROM empleado WHERE id_usuario_empleado = $1 AND estado_empleado = 'activo'';
        const empleadoResult = await pool.query(empleadoQuery, [user.id_usuario]);
        
        if (empleadoResult.rows.length > 0) {
          userRole = 'empleado';
        } else {
          // Verificar si es cliente
          const clienteQuery = 'SELECT id_usuario_cliente FROM cliente WHERE id_usuario_cliente = $1 AND estado = 'activo'';
          const clienteResult = await pool.query(clienteQuery, [user.id_usuario]);
          
          if (clienteResult.rows.length > 0) {
            userRole = 'cliente';
          }
        }
      }

      const token = jwt.sign(
        { 
          id: user.id_usuario, 
          username: user.name_user, 
          role: userRole 
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '8h' }
      );

      res.json({
        token,
        user: {
          id_usuario: user.id_usuario,
          name_user: user.name_user,
          nombres: user.nombres,
          apellidos: user.apellidos,
          role: userRole
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
