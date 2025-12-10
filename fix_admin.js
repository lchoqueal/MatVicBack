const pool = require('./config/db');
const bcrypt = require('bcrypt');

async function reset() {
  try {
    // Limpiar datos previos
    await pool.query("DELETE FROM cliente WHERE id_usuario_cliente IN (SELECT id_usuario FROM usuario WHERE name_user IN ('admin', 'cliente1'))");
    await pool.query("DELETE FROM administrador WHERE id_usuario_admin IN (SELECT id_usuario FROM usuario WHERE name_user IN ('admin', 'cliente1'))");
    await pool.query("DELETE FROM empleado WHERE id_usuario_empleado IN (SELECT id_usuario FROM usuario WHERE name_user = 'empleado_online')");
    await pool.query("DELETE FROM usuario WHERE name_user IN ('admin', 'cliente1', 'empleado_online')");
    console.log('✓ Datos previos eliminados');
    
    const password = 'Password123';
    const hash = await bcrypt.hash(password, 10);
    
    // Obtener local
    const locale = await pool.query('SELECT id_local FROM locale LIMIT 1');
    const idLocal = locale.rows[0]?.id_local || 1;
    
    // Crear admin
    const adminRes = await pool.query(
      `INSERT INTO usuario (nombres, apellidos, name_user, contrasena, dni, id_locale_usuario) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_usuario`,
      ['Admin', 'Demo', 'admin', hash, '00000000', idLocal]
    );
    const adminId = adminRes.rows[0].id_usuario;
    
    // Registrar admin
    await pool.query(
      `INSERT INTO administrador (id_usuario_admin, area_gestion, nivel_acceso) VALUES ($1, $2, $3)`,
      [adminId, 'inventario', 10]
    );
    console.log('✅ Admin creado: admin / Password123');
    
    // Crear cliente
    const clientRes = await pool.query(
      `INSERT INTO usuario (nombres, apellidos, name_user, contrasena, dni, id_locale_usuario) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_usuario`,
      ['Cliente', 'Prueba', 'cliente1', hash, '12345678', idLocal]
    );
    const clientId = clientRes.rows[0].id_usuario;
    
    // Registrar cliente en tabla cliente
    await pool.query(
      `INSERT INTO cliente (id_usuario_cliente, telefono) VALUES ($1, $2)`,
      [clientId, '555-1234']
    );
    console.log('✅ Cliente creado: cliente1 / Password123');
    
    // Crear empleado para el checkout
    const empleadoRes = await pool.query(
      `INSERT INTO usuario (nombres, apellidos, name_user, contrasena, dni, id_locale_usuario) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_usuario`,
      ['Sistema', 'Online', 'empleado_online', hash, '99999999', idLocal]
    );
    const empleadoUserId = empleadoRes.rows[0].id_usuario;
    
    // Registrar empleado
    await pool.query(
      `INSERT INTO empleado (id_usuario_empleado, fecha_ingreso, cargo) VALUES ($1, CURRENT_DATE, $2)`,
      [empleadoUserId, 'Sistema Online']
    );
    console.log('✅ Empleado de sistema creado');
    
    // Obtener un empleado válido para usar en checkout
    // El issue es que boleta.id_empleado_boleta no es SERIAL, es una FK
    // Necesitamos obtener el id_usuario_empleado que es la PK de empleado
    console.log(`\n✅ Credenciales de prueba:`);
    console.log(`  Admin: admin / Password123`);
    console.log(`  Cliente: cliente1 / Password123`);
    console.log(`  Empleado ID (para checkout): ${empleadoUserId}`);
    
    process.exit(0);
  } catch(err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

reset();
