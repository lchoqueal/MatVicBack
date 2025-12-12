const fetch = require('node-fetch');

(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombres: 'Prueba',
        apellidos: 'Cliente',
        name_user: 'cliente_unico_456',
        contrasena: 'Pass12345',
        dni: '11122233',
        telefono: '999000111',
        correo: 'prueba@local.test',
        direccion: 'Calle Test 1'
      }),
    });

    const text = await res.text();
    console.log('STATUS', res.status);
    try {
      console.log('BODY', JSON.parse(text));
    } catch (e) {
      console.log('BODY_TEXT', text);
    }
  } catch (err) {
    console.error('REQUEST ERROR', err.message);
    process.exit(1);
  }
})();
