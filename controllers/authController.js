const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
  // --- LOGIN (Ajustado para no pedir 'rol' si no existe) ---
  async login(req, res) {
    const { username, name_user, password, contrasena } = req.body; 
    const userLogin = username || name_user;
    const passLogin = password || contrasena;

    if (!userLogin || !passLogin) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    
    try {
      // Quitamos 'rol' del select si no existe, o traemos todo *
      const { rows } = await pool.query('SELECT * FROM usuario WHERE name_user = $1 LIMIT 1', [userLogin]);
      const user = rows[0];
      
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
      
      const match = await bcrypt.compare(passLogin, user.contrasena || '');
      if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });
      
      const token = jwt.sign(
        // Si no tienes columna rol, no lo enviamos en el token o lo ponemos 'cliente' por defecto
        { id: user.id_usuario, username: user.name_user, role: 'cliente' }, 
        process.env.JWT_SECRET || 'secret', 
        { expiresIn: '8h' }
      );
      
      res.json({ 
        token, 
        user: { 
          id_usuario: user.id_usuario,
          name_user: user.name_user, 
          // rol: user.rol // Comentado porque no existe en tu tabla
        } 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

 // --- REGISTRO ADAPTADO A TUS TABLAS REALES ---
  async register(req, res) {
    const { name_user, correo, contrasena } = req.body;

    if (!name_user || !correo || !contrasena) {
      return res.status(400).json({ error: 'Faltan datos requeridos.' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. VERIFICACIÓN (Separada para no dar error de columna inexistente)
      
      // A) Buscamos solo el nombre en tabla USUARIO
      const checkUser = await client.query('SELECT * FROM usuario WHERE name_user = $1', [name_user]);
      if (checkUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'El nombre de usuario ya está ocupado.' });
      }

      // B) Buscamos el correo en tabla CLIENTE (¡Aquí sí existe la columna!)
      const checkMail = await client.query('SELECT * FROM cliente WHERE correo = $1', [correo]);
      if (checkMail.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Este correo ya está registrado.' });
      }

      // 2. ENCRIPTAR CONTRASEÑA
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

      // 3. INSERTAR EN 'USUARIO' 
      // ⚠️ IMPORTANTE: Aquí NO ponemos 'correo' ni 'rol' porque tus tablas no los tienen.
      // Solo llenamos: name_user, contrasena y estado.
      const userRes = await client.query(`
        INSERT INTO usuario (name_user, contrasena, estado) 
        VALUES ($1, $2, 'activo') 
        RETURNING id_usuario, name_user
      `, [name_user, hashedPassword]);
      
      const newUser = userRes.rows[0];

      // 4. INSERTAR EN 'CLIENTE'
      // ✅ AQUÍ SÍ guardamos el correo.
      await client.query(`
        INSERT INTO cliente (id_usuario_cliente, correo, estado) 
        VALUES ($1, $2, 'activo')
      `, [newUser.id_usuario, correo]);

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: newUser
      });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Error Base de Datos:', err.message);
      res.status(500).json({ error: 'Error interno: ' + err.message });
    } finally {
      client.release();
    }
  }
};

module.exports = authController;
