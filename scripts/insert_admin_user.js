/**
 * Script para insertar el usuario admin con su rol en la BD
 * Uso: node scripts/insert_admin_user.js
 */
const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  });
  
  await client.connect();
  try {
    // Hash bcrypt para 'admin123'
    const hashAdminPassword = '$2b$10$SIdPlQKQe9.h7DpGJI5J5e2gSoJ/aExCCa3ORJrenpLeuPposDLfe';
    
    // Verificar si el usuario ya existe
    const checkUser = await client.query(
      'SELECT id_usuario FROM usuario WHERE name_user = $1',
      ['admin']
    );
    
    if (checkUser.rows.length > 0) {
      console.log('Usuario admin ya existe. ID:', checkUser.rows[0].id_usuario);
      const userId = checkUser.rows[0].id_usuario;
      
      // Verificar si es administrador
      const checkAdmin = await client.query(
        'SELECT id_usuario_admin FROM administrador WHERE id_usuario_admin = $1',
        [userId]
      );
      
      if (checkAdmin.rows.length > 0) {
        console.log('El usuario admin ya tiene el rol de administrador.');
      } else {
        // Asignar rol de administrador
        await client.query(
          'INSERT INTO administrador (id_usuario_admin, area_gestion, nivel_acceso) VALUES ($1, $2, $3)',
          [userId, 'Sistema', 10]
        );
        console.log('Rol de administrador asignado al usuario admin.');
      }
    } else {
      // Insertar nuevo usuario
      const insertUser = await client.query(
        `INSERT INTO usuario (nombres, apellidos, name_user, contrasena, dni, id_locale_usuario)
         VALUES ($1, $2, $3, $4, $5, NULL)
         RETURNING id_usuario`,
        ['Admin', 'System', 'admin', hashAdminPassword, '00000000']
      );
      
      const userId = insertUser.rows[0].id_usuario;
      console.log('Usuario admin creado con ID:', userId);
      
      // Asignar rol de administrador
      await client.query(
        'INSERT INTO administrador (id_usuario_admin, area_gestion, nivel_acceso) VALUES ($1, $2, $3)',
        [userId, 'Sistema', 10]
      );
      console.log('Rol de administrador asignado.');
    }
    
    console.log('\n✓ Usuario admin listo para usar con contraseña: admin123');
  } catch (err) {
    console.error('Error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
