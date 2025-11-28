const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
  async login(req, res) {
    const { username, password } = req.body; // frontend usa name_user
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    
    try {
      // Buscar el usuario
      const { rows } = await pool.query('SELECT * FROM usuario WHERE name_user = $1 LIMIT 1', [username]);
      const user = rows[0];
      
      console.log('Intento login:', username, password, user && user.contrasena);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      
      const match = await bcrypt.compare(password, user.contrasena || '');
      console.log('Resultado bcrypt.compare:', match);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      // Determinar el rol del usuario verificando las tablas relacionadas
      let role = 'user'; // rol por defecto
      
      // Verificar si es administrador
      const { rows: adminRows } = await pool.query(
        'SELECT * FROM administrador WHERE id_usuario_admin = $1', 
        [user.id_usuario]
      );
      
      if (adminRows.length > 0) {
        role = 'admin';
      } else {
        // Verificar si es empleado
        const { rows: empleadoRows } = await pool.query(
          'SELECT * FROM empleado WHERE id_usuario_empleado = $1', 
          [user.id_usuario]
        );
        
        if (empleadoRows.length > 0) {
          role = 'empleado';
        } else {
          // Verificar si es cliente
          const { rows: clienteRows } = await pool.query(
            'SELECT * FROM cliente WHERE id_usuario_cliente = $1', 
            [user.id_usuario]
          );
          
          if (clienteRows.length > 0) {
            role = 'cliente';
          }
        }
      }

      const token = jwt.sign(
        { id: user.id_usuario, username: user.name_user, role }, 
        process.env.JWT_SECRET || 'secret', 
        { expiresIn: '8h' }
      );
      
      console.log('Login exitoso para usuario:', user.name_user, 'con rol:', role);
      
      res.json({ 
        token, 
        user: { 
          id: user.id_usuario, 
          username: user.name_user, 
          nombres: user.nombres,
          apellidos: user.apellidos,
          role: role
        } 
      });
      
    } catch (err) {
      console.error('Error en login:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = authController;