const request = require('supertest');
// Este test es un esqueleto — requiere que la API esté corriendo y la DB tenga datos de prueba.
describe('Sales E2E', () => {
  const API = process.env.API_URL || 'http://localhost:3001';
  let token;

  test('login admin', async () => {
    const res = await request(API).post('/api/auth/login').send({ username: 'admin', password: 'Password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test('process sale and update stock', async () => {
    // obtiene productos
    const p = await request(API).get('/api/products');
    expect(p.statusCode).toBe(200);
    const first = p.body[0];
    expect(first).toBeDefined();

    const res = await request(API).post('/api/sales').set('Authorization', `Bearer ${token}`).send({ metodo_pago: 'efectivo', id_empleado: null, id_cliente: null, items: [{ id_producto: first.id_producto, cantidad: 1 }] });
    expect(res.statusCode).toBe(200);
    expect(res.body.id_boleta).toBeDefined();
  });
});
