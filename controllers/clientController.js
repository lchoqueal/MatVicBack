const bcrypt = require('bcrypt');
const Client = require('../models/clientModel');
const User = require('../models/userModel');

const clientController = {
  async register(req, res) {
    try {
      const { nombres, apellidos, name_user, contrasena, dni, telefono, correo, direccion, id_locale_usuario } = req.body;

      if (!nombres) return res.status(400).json({ error: 'nombres es requerido' });
      if (!apellidos) return res.status(400).json({ error: 'apellidos es requerido' });
      if (!name_user) return res.status(400).json({ error: 'name_user es requerido' });
      if (!contrasena) return res.status(400).json({ error: 'contrasena es requerido' });
      if (!dni) return res.status(400).json({ error: 'dni es requerido' });

      // verificar que username no exista
      const existing = await User.getByUsername(name_user);
      if (existing) return res.status(400).json({ error: 'name_user ya existe' });

      const hash = await bcrypt.hash(contrasena, 10);

      const created = await Client.create({ nombres, apellidos, name_user, contrasena: hash, dni, telefono, correo, direccion, id_locale_usuario });

      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = clientController;
