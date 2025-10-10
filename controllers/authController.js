const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
  async login(req, res) {
    const { username, password } = req.body; // frontend usa name_user
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    try {
      const { rows } = await pool.query('SELECT * FROM usuario WHERE name_user = $1 LIMIT 1', [username]);
      const user = rows[0];
      console.log('Intento login:', username, password, user && user.contrasena);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const match = await bcrypt.compare(password, user.contrasena || '');
      console.log('Resultado bcrypt.compare:', match);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id_usuario, username: user.name_user }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '8h',
      });
      res.json({ token, user: { id: user.id_usuario, username: user.name_user, nombres: user.nombres } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = authController;


