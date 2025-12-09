/**
 * Aplica los archivos SQL de migración en orden contra la BD configurada en .env
 * Uso: node scripts/apply_migrations.js
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const files = [
  path.join(__dirname, '..', 'schema.sql'),
  path.join(__dirname, '..', 'triggers_and_procedures.sql'),
  path.join(__dirname, '..', 'migrations', 'add_product_fields_and_alerts.sql')
];

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
    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.warn('Archivo no encontrado, saltando:', file);
        continue;
      }
      console.log('Ejecutando:', file);
      const sql = fs.readFileSync(file, 'utf8');
      await client.query(sql);
      console.log('OK:', path.basename(file));
    }
    console.log('Migraciones aplicadas.');
  } catch (err) {
    console.error('Error aplicando migraciones:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
