const pool = require('../config/db');

const Client = {
  async create(data) {
    const {
      nombres,
      apellidos,
      name_user,
      contrasena,
      dni,
      telefono = null,
      correo = null,
      direccion = null,
      id_locale_usuario = null,
    } = data;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userRes = await client.query(
        `INSERT INTO usuario (nombres, apellidos, name_user, contrasena, dni, id_locale_usuario)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_usuario, nombres, apellidos, name_user, dni, id_locale_usuario`,
        [nombres, apellidos, name_user, contrasena, dni, id_locale_usuario]
      );

      const idUsuario = userRes.rows[0].id_usuario;

      const clienteRes = await client.query(
        `INSERT INTO cliente (id_usuario_cliente, telefono, correo, direccion)
         VALUES ($1,$2,$3,$4) RETURNING telefono, correo, direccion`,
        [idUsuario, telefono, correo, direccion]
      );

      await client.query('COMMIT');

      return { id_usuario: idUsuario, nombres: userRes.rows[0].nombres, apellidos: userRes.rows[0].apellidos, name_user: userRes.rows[0].name_user, dni: userRes.rows[0].dni, id_locale_usuario: userRes.rows[0].id_locale_usuario, cliente: clienteRes.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = Client;
