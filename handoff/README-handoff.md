Handoff rápido para frontend

Contenido:
- Postman collection (`postman_collection.json`)
- `.env.example` (variables que el frontend/back necesita conocer)

Instrucciones rápidas:
1. Backend corre en: http://localhost:3001
2. Endpoints principales:
   - POST /api/auth/login -> body: { username, password }
   - GET /api/products
   - POST /api/sales -> body: { metodo_pago, id_empleado, id_cliente, items: [...] }
   - GET /api/alerts -> requires auth
3. Token: hacer login y usar header `Authorization: Bearer <token>`

Ejecutar backend (desde MatVicBack):

```powershell
npm install
# opcional: aplicar migraciones (recomendado)
npm run migrate
npm run seed
npm run dev
```

Abrir frontend (MatVicFront2.0):
```powershell
cd ..\MatVicFront2.0
npm install
npm run dev
```

Postman: importar `postman_collection.json` y completar variable `base_url` con `http://localhost:3001`.

Verificación completa (pasos para enviar el repo):
1. Desde `MatVicBack` aplica migraciones y seed:

```powershell
npm install
npm run migrate
npm run seed
```

2. Arranca backend:

```powershell
npm run dev
```

3. Ejecuta prueba de venta (puedes usar Postman o el script incluido):

```powershell
# si tienes token (de login) exportalo a TEST_TOKEN o pega en Postman
node .\scripts\test_sale_request.js
```

4. Ejecuta tests E2E (requiere que el servidor y la DB estén listos):

```powershell
npm run test:e2e
```

5. Para empaquetar el repo y enviarlo (simple): desde la raíz del proyecto crea un zip con los archivos relevantes:

```powershell
cd ..\
Compress-Archive -Path .\MatVicBack, .\MatVicFront2.0 -DestinationPath MatVic_Entrega.zip
```

Entrega el `MatVic_Entrega.zip` o sube el repo al remoto (GitHub) e indica el link al frontend.
