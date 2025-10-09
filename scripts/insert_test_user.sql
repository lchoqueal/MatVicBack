-- Inserta un usuario de prueba en la tabla usuario.
-- Nota: la columna `contrasena` debe contener el hash bcrypt. Genera el hash desde Node o una herramienta.

-- Ejemplo (NO EJECUTAR si no has generado el hash):
-- INSERT INTO usuario (nombres, apellidos, name_user, contrasena, dni, id_locale_usuario)
-- VALUES ('Admin', 'Demo', 'admin', '$2b$10$...TU_HASH_BCRYPT...', '00000000', NULL);

-- Generar hash en Node.js (ejemplo):
-- const bcrypt = require('bcrypt');
-- bcrypt.hash('Password123', 10).then(h => console.log(h));
