// Script de prueba que hace una petición POST a /api/sales
let fetcher;
try {
  // node-fetch v2
  fetcher = require('node-fetch');
} catch (e) {
  if (typeof fetch !== 'undefined') {
    fetcher = fetch;
  } else {
    console.error('Instala node-fetch o usa Node >=18 que incluya fetch global');
    process.exit(1);
  }
}

const API = process.env.API_URL || 'http://localhost:3001';
const TOKEN = process.env.TEST_TOKEN || ''; // si tu endpoint requiere auth, setear TEST_TOKEN

async function run() {
  const body = {
    metodo_pago: 'efectivo',
    id_empleado: null,
    id_cliente: null,
    items: [
      { id_producto: 1, cantidad: 1 },
    ],
  };

  const res = await fetcher(`${API}/api/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log('Response:', res.status, data);
}

run().catch(err => console.error(err));
