const pool = require('../config/db');
const bcrypt = require('bcrypt');

async function ensurePasswordColumn() {
  try {
    const q = `SELECT character_maximum_length FROM information_schema.columns
      WHERE table_name='usuario' AND column_name='contrasena'`;
    const res = await pool.query(q);
    if (res.rows.length === 0) {
      console.warn('No se encontró columna contrasena en tabla usuario. Asegúrate de haber ejecutado schema.sql');
      return;
    }
    const len = res.rows[0].character_maximum_length;
    if (!len || len < 255) {
      console.log('Ajustando tipo de columna `usuario.contrasena` a VARCHAR(255) ...');
      await pool.query("ALTER TABLE usuario ALTER COLUMN contrasena TYPE VARCHAR(255);");
      console.log('Columna actualizada.');
    } else {
      console.log('Columna contrasena ya tiene longitud suficiente (', len, ').');
    }
  } catch (err) {
    console.error('Error comprobando/alterando columna contrasena:', err.message);
    throw err;
  }
}

async function seed() {
  try {
    console.log('Iniciando seed...');

    // asegurar columna contrasena
    await ensurePasswordColumn();

    // asegurar columna min_stock en producto
    try {
      const col = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='producto' AND column_name='min_stock'");
      if (col.rows.length === 0) {
        console.log('Añadiendo columna min_stock a tabla producto...');
        await pool.query('ALTER TABLE producto ADD COLUMN min_stock INT DEFAULT 0');
        console.log('Columna min_stock añadida.');
      } else {
        console.log('Columna min_stock ya existe.');
      }
    } catch (err) {
      console.error('Error comprobando/añadiendo min_stock:', err.message);
      throw err;
    }

    console.log('Creando locale (si no existe)...');
    const existLocale = await pool.query("SELECT id_local FROM locale WHERE nombre = 'Local Central' LIMIT 1");
    if (existLocale.rows.length === 0) {
      await pool.query("INSERT INTO locale (nombre, direccion) VALUES ('Local Central', 'Av. Principal 123')");
      console.log('Locale creado.');
    } else {
      console.log('Locale ya existente.');
    }
    const resLocale = await pool.query("SELECT id_local FROM locale WHERE nombre = 'Local Central' LIMIT 1");
    const idLocal = resLocale.rows[0].id_local;
    console.log('Locale id:', idLocal);

    // crear admin user
    console.log('Creando usuario admin...');
    const password = 'Password123';
    const hash = await bcrypt.hash(password, 10);
    // insertar usuario admin si no existe
    const existUser = await pool.query("SELECT id_usuario FROM usuario WHERE name_user = 'admin' LIMIT 1");
    if (existUser.rows.length === 0) {
      const insertUser = `INSERT INTO usuario (nombres, apellidos, name_user, contrasena, dni, id_locale_usuario)
        VALUES ('Admin', 'Demo', 'admin', $1, '00000000', $2)`;
      await pool.query(insertUser, [hash, idLocal]);
      console.log('Usuario admin creado.');
    } else {
      console.log('Usuario admin ya existe.');
    }

    // obtener id del admin
    const u = await pool.query("SELECT id_usuario FROM usuario WHERE name_user = 'admin' LIMIT 1");
    if (u.rows.length === 0) throw new Error('No se pudo obtener id del usuario admin');
    const idAdmin = u.rows[0].id_usuario;
    console.log('Admin id:', idAdmin);

    // insertar en administrador
    console.log('Insertando en tabla administrador (si no existe)...');
    const existAdmin = await pool.query('SELECT id_usuario_admin FROM administrador WHERE id_usuario_admin = $1 LIMIT 1', [idAdmin]);
    if (existAdmin.rows.length === 0) {
      await pool.query(`INSERT INTO administrador (id_usuario_admin, area_gestion, nivel_acceso)
        VALUES ($1, 'inventario', 10)`, [idAdmin]);
      console.log('Registro en administrador creado.');
    } else {
      console.log('Registro administrador ya existe.');
    }

    // crear productos de ejemplo
    console.log('Insertando productos de ejemplo (si no existen)...');
    const products = [
      { nombre: 'Coca-Cola 500ml', categoria: 'Bebidas', stock: 50, min_stock: 10, precio_unit: 1.5 },
      { nombre: 'Arroz 1kg', categoria: 'Alimentos', stock: 20, min_stock: 5, precio_unit: 0.9 },
      { nombre: 'Jabón en polvo', categoria: 'Limpieza', stock: 5, min_stock: 5, precio_unit: 3.25 },
    ];
    for (const p of products) {
      const exists = await pool.query('SELECT id_producto FROM producto WHERE nombre = $1 LIMIT 1', [p.nombre]);
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO producto (nombre, categoria, stock, min_stock, precio_unit) VALUES ($1,$2,$3,$4,$5)`,
          [p.nombre, p.categoria, p.stock, p.min_stock, p.precio_unit]
        );
        console.log('Producto creado:', p.nombre);
      } else {
        console.log('Producto ya existe:', p.nombre);
      }
    }

    console.log('Seed completado. Usuario admin con username=admin y password=Password123');
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err.message);
    process.exit(1);
  }
}

seed();
