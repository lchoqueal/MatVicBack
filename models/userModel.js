const pool = require('../config/db');

const User = {
  async getAll() {
    const { rows } = await pool.query(
      'SELECT id_usuario, nombres, apellidos, name_user, dni, id_locale_usuario FROM usuario ORDER BY id_usuario'
    );
    return rows;
  },
  async getById(id) {
    const { rows } = await pool.query('SELECT * FROM usuario WHERE id_usuario = $1', [id]);
    return rows[0];
  },
  async getByUsername(username) {
    const { rows } = await pool.query('SELECT * FROM usuario WHERE name_user = $1 LIMIT 1', [username]);
    return rows[0];
  },
  async getByEmail(email) {
    const { rows } = await pool.query(
      `SELECT u.* FROM usuario u
       JOIN cliente c ON u.id_usuario = c.id_usuario_cliente
       WHERE c.correo = $1
       LIMIT 1`,
      [email]
    );
    return rows[0];
  },
};

module.exports = User;
