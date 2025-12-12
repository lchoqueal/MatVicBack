const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
  // --- LOGIN (Tu código original) ---
  async login(req, res) {
    // Nota: Aceptamos 'username' o 'name_user' para flexibilidad con el frontend
    const { username, name_user, password, contrasena } = req.body; 
    
    const userLogin = username || name_user;
    const passLogin = password || contrasena;

    if (!userLogin || !passLogin) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    
    try {
      const { rows } = await pool.query('SELECT * FROM usuario WHERE name_user = $1 LIMIT 1', [userLogin]);
      const user = rows[0];
      
      console.log('Intento login:', userLogin, user ? 'Usuario encontrado' : 'No encontrado');
      
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
      
      const match = await bcrypt.compare(passLogin, user.contrasena || '');
      console.log('Resultado bcrypt.compare:', match);
      
      if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });
      
      const token = jwt.sign(
        { id: user.id_usuario, username: user.name_user, role: user.rol }, 
        process.env.JWT_SECRET || 'secret', 
        { expiresIn: '8h' }
      );
      
      res.json({ 
        token, 
        user: { 
          id_usuario: user.id_usuario, // Unifiqué nombres para que coincidan con BD
          name_user: user.name_user, 
          rol: user.rol 
        } 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // --- REGISTRO (NUEVO CÓDIGO) ---
  async register(req, res) {
    const { name_user, correo, contrasena } = req.body;

    // Validaciones básicas
    if (!name_user || !correo || !contrasena) {
      return res.status(400).json({ error: 'Faltan datos requeridos (Usuario, Correo, Contraseña)' });
    }

    const client = await pool.connect(); // Conexión especial para transacción

    try {
      await client.query('BEGIN'); // Iniciamos transacción

      // 1. Verificar si ya existe el usuario o correo
      const checkRes = await client.query(
        'SELECT * FROM usuario WHERE name_user = $1 OR correo = $2', 
        [name_user, correo]
      );
      
      if (checkRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'El nombre de usuario o correo ya está registrado.' });
      }

      // 2. Encriptar la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

      // 3. Insertar en tabla USUARIO
      // Por defecto el rol es 'cliente'
      const userQuery = `
        INSERT INTO usuario (name_user, correo, contrasena, rol) 
        VALUES ($1, $2, $3, 'cliente') 
        RETURNING id_usuario, name_user, correo, rol
      `;
      const userRes = await client.query(userQuery, [name_user, correo, hashedPassword]);
      const newUser = userRes.rows[0];

      // 4. Insertar en tabla CLIENTE (Vinculado al usuario)
      // Asumimos estado 'activo' por defecto
      const clientQuery = `
        INSERT INTO cliente (id_usuario_cliente, estado) 
        VALUES ($1, 'activo')
      `;
      await client.query(clientQuery, [newUser.id_usuario]);

      await client.query('COMMIT'); // Confirmamos los cambios en BD

      // 5. Respuesta exitosa
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: newUser
      });

    } catch (err) {
      await client.query('ROLLBACK'); // Si algo falla, deshacemos todo
      console.error('Error en registro:', err);
      res.status(500).json({ error: 'Error interno al registrar usuario' });
    } finally {
      client.release(); // Liberamos la conexión
    }
  }
};

module.exports = authController;
