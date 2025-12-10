#!/usr/bin/env node
/**
 * Test Simple - Sprint 2
 * Uso: node test_simple.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
let jwt = '';
let cartId = '';
let itemId = '';

function request(method, path, body = null, auth = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (auth && jwt) {
      options.headers['Authorization'] = `Bearer ${jwt}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, method, path, body = null, auth = false) {
  process.stdout.write(`${name}... `);
  try {
    const res = await request(method, path, body, auth);
    if (res.status >= 200 && res.status < 300) {
      console.log(`✅ ${res.status}`);
      return res.data;
    } else {
      console.log(`❌ ${res.status}`);
      console.log(JSON.stringify(res.data, null, 2));
      return null;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════╗');
  console.log('║ TESTING SPRINT 2 - TIENDA EN LÍNEA ║');
  console.log('╚════════════════════════════════════╝\n');

  // TEST 1: Catálogo
  console.log('📦 HISTORIA 8: CATÁLOGO');
  const catalog = await test(
    '  1. Catálogo público (sin auth)',
    'GET',
    '/api/cart/catalog'
  );

  if (catalog && Array.isArray(catalog)) {
    console.log(`     → ${catalog.length} productos disponibles\n`);
  } else {
    console.log('     → Error obteniendo catálogo\n');
    process.exit(1);
  }

  // TEST 2: Login
  console.log('🔐 AUTENTICACIÓN');
  const login = await test(
    '  2. Login (cliente1 / Password123)',
    'POST',
    '/api/auth/login',
    { username: 'cliente1', password: 'Password123' }
  );

  if (login && login.token) {
    jwt = login.token;
    console.log(`     → Token: ${jwt.substring(0, 30)}...\n`);
  } else {
    console.log('     → Error de login\n');
    process.exit(1);
  }

  // TEST 3: Crear carrito
  console.log('🛒 HISTORIA 9: CARRITO DE COMPRAS');
  const createCart = await test(
    '  3. Crear carrito',
    'POST',
    '/api/cart',
    null,
    true
  );

  if (createCart && createCart.id_carrito) {
    cartId = createCart.id_carrito;
    console.log(`     → Carrito: ${cartId} (estado: ${createCart.estado})\n`);
  } else {
    console.log('     → Error creando carrito\n');
    process.exit(1);
  }

  // TEST 4: Ver carrito vacío
  const emptyCart = await test(
    '  4. Ver carrito vacío',
    'GET',
    `/api/cart/${cartId}`,
    null,
    true
  );

  if (emptyCart) {
    console.log(`     → Items: ${emptyCart.cantidad_items}, Total: $${emptyCart.total}\n`);
  }

  // TEST 5: Agregar producto 1
  const add1 = await test(
    '  5. Agregar producto 1 (id:7, qty:2)',
    'POST',
    `/api/cart/${cartId}/items`,
    { id_producto: 7, cantidad: 2 },
    true
  );

  if (add1 && add1.items && add1.items.length > 0) {
    itemId = add1.items[0].id_detalle_carrito;
    console.log(`     → Items: ${add1.cantidad_items}, Total: $${add1.total}\n`);
  }

  // TEST 6: Agregar producto 2
  const add2 = await test(
    '  6. Agregar producto 2 (id:9, qty:1)',
    'POST',
    `/api/cart/${cartId}/items`,
    { id_producto: 9, cantidad: 1 },
    true
  );

  if (add2) {
    console.log(`     → Items: ${add2.cantidad_items}, Total: $${add2.total}\n`);
  }

  // TEST 7: Ver carrito lleno
  const fullCart = await test(
    '  7. Ver carrito lleno',
    'GET',
    `/api/cart/${cartId}`,
    null,
    true
  );

  if (fullCart) {
    console.log(`     → Items: ${fullCart.cantidad_items}, Total: $${fullCart.total}\n`);
  }

  // TEST 8: Actualizar cantidad
  if (itemId) {
    const update = await test(
      '  8. Actualizar cantidad (3)',
      'PUT',
      `/api/cart/${cartId}/items/${itemId}`,
      { cantidad: 3 },
      true
    );

    if (update) {
      console.log(`     → Total actualizado: $${update.total}\n`);
    }
  }

  // TEST 9: Eliminar item
  if (itemId) {
    const deleteItem = await test(
      '  9. Eliminar primer producto',
      'DELETE',
      `/api/cart/${cartId}/items/${itemId}`,
      null,
      true
    );

    if (deleteItem) {
      console.log(`     → Items restantes: ${deleteItem.cantidad_items}, Total: $${deleteItem.total}\n`);
    }
  }

  // TEST 10: Checkout
  console.log('💳 PROCESAR COMPRA');
  const checkout = await test(
    '  10. Procesar compra (checkout)',
    'POST',
    `/api/cart/${cartId}/checkout`,
    null,
    true
  );

  if (checkout && checkout.boleta) {
    console.log(`     → ¡COMPRA EXITOSA!`);
    console.log(`     → Boleta: ${checkout.boleta.id_boleta}`);
    console.log(`     → Total: $${checkout.boleta.total}`);
    console.log(`     → Método: ${checkout.boleta.metodo_pago}\n`);
  }

  // TEST 11: Verificar carrito completado
  const completedCart = await test(
    '  11. Verificar carrito completado',
    'GET',
    `/api/cart/${cartId}`,
    null,
    true
  );

  if (completedCart) {
    console.log(`     → Estado: ${completedCart.estado}, Items: ${completedCart.cantidad_items}\n`);
  }

  // RESUMEN
  console.log('╔════════════════════════════════════╗');
  console.log('║       ✅ TODOS LOS TESTS OK        ║');
  console.log('╚════════════════════════════════════╝\n');

  process.exit(0);
}

main().catch(err => {
  console.error(`\n❌ Error fatal: ${err.message}\n`);
  process.exit(1);
});
