const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
  // --- LOGIN (Sin cambios, está correcto) ---
  async login(req, res) {
    const { username, name_user, password, contrasena } = req.body; 
    
    const userLogin = username || name_user;
    const passLogin = password || contrasena;

    if (!userLogin || !passLogin) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    
    try {
      const { rows } = await pool.query('SELECT * FROM usuario WHERE name_user = $1 LIMIT 1', [userLogin]);
      const user = rows[0];
      
      console.log('Intento login:', userLogin, user ? 'Encontrado' : 'No encontrado');
      
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
      
      const match = await bcrypt.compare(passLogin, user.contrasena || '');
      
      if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });
      
      const token = jwt.sign(
        { id: user.id_usuario, username: user.name_user, role: user.rol }, 
        process.env.JWT_SECRET || 'secret', 
        { expiresIn: '8h' }
      );
      
      res.json({ 
        token, 
        user: { 
          id_usuario: user.id_usuario,
          name_user: user.name_user, 
          rol: user.rol 
        } 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // --- REGISTRO (OPTIMIZADO) ---
  async register(req, res) {
    const { name_user, correo, contrasena } = req.body;

    // 1. Validaciones básicas
    if (!name_user || !correo || !contrasena) {
      return res.status(400).json({ error: 'Faltan datos requeridos (Usuario, Correo, Contraseña)' });
    }

    const client = await pool.connect(); 

    try {
      await client.query('BEGIN'); // Iniciar transacción

      // 2. Verificar duplicados (Usuario o Correo)
      const checkRes = await client.query(
        'SELECT * FROM usuario WHERE name_user = $1 OR correo = $2', 
        [name_user, correo]
      );
      
      if (checkRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'El nombre de usuario o el correo ya están registrados.' });
      }

      // 3. Encriptar contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

      // 4. Insertar en USUARIO
      const userQuery = `
        INSERT INTO usuario (name_user, correo, contrasena, rol) 
        VALUES ($1, $2, $3, 'cliente') 
        RETURNING id_usuario, name_user, correo, rol
      `;
      const userRes = await client.query(userQuery, [name_user, correo, hashedPassword]);
      const newUser = userRes.rows[0];

      // 🛡️ CONTROL DE ERRORES EXTRA
      if (!newUser || !newUser.id_usuario) {
        throw new Error("No se pudo generar el ID del usuario.");
      }

      // 5. Insertar en CLIENTE
      // ✅ MEJORA: Insertamos también el CORREO para mantener consistencia con tu tabla.
      const clientQuery = `
        INSERT INTO cliente (id_usuario_cliente, correo, estado) 
        VALUES ($1, $2, 'activo')
      `;
      await client.query(clientQuery, [newUser.id_usuario, correo]);

      await client.query('COMMIT'); // Confirmar todo

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: newUser
      });

    } catch (err) {
      await client.query('ROLLBACK'); // Deshacer cambios si falla
      console.error('Error crítico en registro:', err);
      res.status(500).json({ error: 'Error interno: ' + err.message });
    } finally {
      client.release(); // Liberar conexión
    }
  }
};

module.exports = authController;
