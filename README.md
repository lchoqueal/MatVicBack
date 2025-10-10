# MatVicBack - Quickstart

Este README rápido explica cómo levantar el backend minimalista para desarrollo.

Requisitos
- Node.js (>=16 recomendado)
- PostgreSQL corriendo localmente o accesible

Instalación
1. Copia el archivo de ejemplo de variables de entorno:

   cp .env.example .env

2. Edita `.env` con tus credenciales de PostgreSQL.

# MatVicBack — Documentación completa

Este README documenta exhaustivamente el backend de MatVic: cómo instalarlo, las variables de entorno necesarias, los scripts SQL (esquema, migraciones y procedimientos), la API (endpoints, métodos, cuerpos JSON, respuestas), eventos en tiempo real (Socket.IO) y cómo probar y desplegar.

## Índice

- Requisitos
- Estructura de archivos importantes
- Variables de entorno
- Instalación rápida
- Scripts SQL (qué hacen y en qué orden ejecutarlos)
- Endpoints REST (ruta, método, cuerpo JSON, respuesta)
- WebSockets / Socket.IO (eventos y payloads)
- Migraciones y seed
- Tests y E2E
- Operaciones y troubleshooting
- Seguridad y despliegue

---

## Requisitos

- Node.js (recomendado >= 18)
- PostgreSQL (>= 12)
- npm o yarn

---

## Estructura de archivos importantes

Rutas relativas a `MatVicBack/`:

- `index.js` — entrada del servidor. Inicia Express, Socket.IO y arranca el DB listener (`services/dbListener.js`).
- `config/db.js` — Pool de `pg` para consultas.
- `services/dbListener.js` — escucha canales PostgreSQL (`LISTEN`) y reemite NOTIFY a Socket.IO.
- `controllers/*` — controladores para `auth`, `product`, `sales`, `user`.
- `models/*` — acceso a la BD (productModel, userModel, etc.).
- `routes/*` — rutas Express agrupadas.
- `db/schema.sql` — DDL principal para crear tablas.
- `db/triggers_and_procedures.sql` — funciones PL/pgSQL y triggers (`process_sale`, `fn_notify_stock_change`).
- `db/migrations/add_product_fields_and_alerts.sql` — migración que añade `descripcion`, `codigo`, `min_stock` y tabla `alerta` (persistencia de alertas).
- `scripts/seed.js` — script para poblar datos iniciales (locale, admin, productos).
- `scripts/test_sale_request.js` — script Node para probar POST `/api/sales` con token.
- `services/dbListener.js` — escucha NOTIFY y reemite por Socket.IO.

---

## Variables de entorno (archivo `.env`)

Crea un `.env` basado en `.env.example`. Variables principales:

- DB_HOST — host de PostgreSQL (ej. localhost)
- DB_PORT — puerto (ej. 5432)
- DB_NAME — nombre de la base de datos
- DB_USER — usuario de la BD
- DB_PASS — contraseña del usuario
- PORT — puerto en que corre Express (por defecto 3001)
- JWT_SECRET — secreto para firmar JWT
- DATABASE_URL — (opcional) string de conexión PostgreSQL; si no existe se usan DB_*

---

## Instalación rápida

Desde la carpeta `MatVicBack`:

```powershell
npm install
cp .env.example .env   # editar .env con tus credenciales
npm run seed            # opcional: crea admin + productos de ejemplo
npm run dev             # arranca en modo desarrollo (nodemon)
# o
npm start               # arranca en producción
```

> Nota: en Windows PowerShell puede haber restricciones de ejecución de `npm` (npm.ps1). Si ves error "ejecución de scripts está deshabilitada", usa `npm.cmd run <script>` o ejecuta node directamente.

---

## Scripts SQL — orden y propósito

1. `db/schema.sql`
    - Contiene el DDL principal con las tablas del sistema: `producto`, `usuario`, `cliente`, `boleta`, `detalle_boleta`, `administrador`, etc.
    - Ejecutar primero si partes de cero: `psql -U <user> -d <db> -f db/schema.sql`

2. `db/triggers_and_procedures.sql`
    - Crea la función `process_sale(metodo_pago, id_empleado, id_cliente, items JSON)`:
       - items: JSON array [{"id_producto":1,"cantidad":2,"precio_unit":1.5}, ...]
       - Valida existencia y stock, usa `SELECT ... FOR UPDATE` sobre productos para evitar race conditions.
       - Inserta en `boleta` y `detalle_boleta`, actualiza `producto.stock`, y emite `pg_notify('stock_updated', payload)` y `pg_notify('stock_alert', payload)` cuando corresponde.
    - Crea `fn_notify_stock_change()` y trigger `trg_notify_stock_change` sobre `producto` para emitir NOTIFY cuando el stock cambie por cualquier otra vía.

3. `db/migrations/add_product_fields_and_alerts.sql`
    - Añade columnas `descripcion TEXT`, `codigo VARCHAR(100)`, y asegura `min_stock` INT.
    - Crea tabla `alerta` para persistir alertas de stock con campos: id_alerta, id_producto, tipo, stock_actual, min_stock, mensaje, creado_en, atendido.

Ejecución recomendada:
- Ejecuta `schema.sql`, luego `triggers_and_procedures.sql`, y finalmente las migraciones si tu DB ya existía y necesita columnas adicionales.

---

## API — Endpoints detallados

Formato: RUTA — MÉTODO — DESCRIPCIÓN — BODY (JSON) — RESPUESTA

Base: `http://<HOST>:<PORT>` (por defecto http://localhost:3001)

Autenticación: JWT en header `Authorization: Bearer <token>`.

### Auth
- POST /api/auth/login — Login
   - Body: { "username": "admin", "password": "Password123" }
   - Respuesta: { "token": "<JWT>", "user": { id, username, ... } }

### Usuarios
- GET /api/users
   - Método: GET
   - Descripción: lista usuarios
   - Respuesta: Array de usuarios

- GET /api/users/:id
   - Método: GET
   - Descripción: obtener usuario por id

### Productos
- GET /api/products
   - Método: GET
   - Descripción: lista todos los productos
   - Respuesta: [{ id_producto, nombre, descripcion, codigo, categoria, stock, min_stock, precio_unit }, ...]

- GET /api/products/:id
   - Método: GET
   - Descripción: retorna producto por id

- GET /api/products/alerts
   - Método: GET
   - Descripción: retorna productos cuyo stock <= min_stock
   - Respuesta: array de productos críticos

- POST /api/products
   - Método: POST (admin)
   - Body: { nombre, descripcion, codigo, categoria, stock, min_stock, precio_unit }
   - Respuesta: objeto producto creado (201)

- PUT /api/products/:id
   - Método: PUT (admin)
   - Body: cualquier campo a actualizar entre: nombre, descripcion, codigo, categoria, stock, min_stock, precio_unit
   - Respuesta: objeto producto actualizado

- DELETE /api/products/:id
   - Método: DELETE (admin)
   - Respuesta: { deleted: true }

- PATCH /api/products/:id/stock
   - Método: PATCH (admin)
   - Body: { stock: <int> }
   - Descripción: actualiza stock a valor específico
   - Comportamiento: emite `stock.updated` y si stock <= min_stock persiste alerta y emite `stock.alert`.

- POST /api/products/:id/purchase
   - Método: POST (admin)
   - Body: { cantidad: <int> }
   - Descripción: incrementa stock en `cantidad` (compra)
   - Respuesta: producto actualizado; emite `stock.updated`.

- POST /api/products/transfer
   - Método: POST (admin)
   - Body: { from: <id_producto>, to: <id_producto>, cantidad: <int> }
   - Descripción: transfiere stock entre productos (transferencia simplificada). Emite `stock.updated` para ambos.

### Ventas
- POST /api/sales
   - Método: POST (auth)
   - Body: { metodo_pago, id_empleado, id_cliente, items: [{ id_producto, cantidad, precio_unit? }, ...] }
   - Respuesta: { id_boleta, total }
   - Observaciones:
      - El procedimiento `process_sale` hace la lógica atómica: valida existencia/stock, decrementa stock con FOR UPDATE, inserta `boleta` y `detalle_boleta` y envía NOTIFY.
      - Si stock insuficiente o producto inexistente, se lanza excepción y la transacción se revierte.

### Alertas
- GET /api/alerts (no creado por defecto, pero puedes usar GET /api/products/alerts)
   - Sugerencia: Implementar: GET /api/alerts para listar filas en tabla `alerta` y POST /api/alerts/:id/attend para marcarlas atendidas.

---

## WebSockets / Socket.IO

- Endpoint de Socket.IO: el servidor arranca en el mismo host/puerto que la API (ej. http://localhost:3001) y acepta conexiones CORS: origin '*' (configurable en `index.js`).
- Eventos emitidos por el backend (cliente debe escuchar estos):
   - `stock.updated` — payload: { productId: <int>, stock: <int> }
   - `stock.alert` — payload: { productId: <int>, stock: <int>, min_stock: <int> }

Ejemplo cliente JavaScript (React):
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3001');
socket.on('stock.updated', data => console.log('stock.updated', data));
socket.on('stock.alert', data => console.log('stock.alert', data));
```

---

## Migraciones y seed

- Ejecutar migraciones (si tu DB ya tiene tabla producto pero faltan columnas):
   - `psql -U <user> -d <db> -f db/migrations/add_product_fields_and_alerts.sql`
- Ejecutar triggers/procedures:
   - `psql -U <user> -d <db> -f db/triggers_and_procedures.sql`
- Seed (crea admin + productos de ejemplo):
   - `npm run seed`

---

## Tests y E2E

- Se incluyó un esqueleto de test en `tests/sales.e2e.test.js` usando `supertest` + `jest`.
- Requisitos: la API debe estar corriendo y la BD poblada con el seed antes de ejecutar los tests.
- Para ejecutar tests (desde `MatVicBack`):
   - `npm install` (si no lo hiciste)
   - `npx jest` o `npm test` (configurar script `test` en package.json para usar jest)

---

## Operaciones y troubleshooting

Problemas comunes
- "client password must be a string" al iniciar el listener: asegúrate de definir `DB_PASS` como string en `.env` y que `dbListener` use las mismas variables que `config/db.js`.
- "value too long for type character varying(50)" al insertar contraseñas: el seed ya ajusta la longitud de `contrasena` a VARCHAR(255). Si tienes errores, revisa `schema.sql` o ejecuta la migración.
- PowerShell: "ejecución de scripts está deshabilitada" al ejecutar `npm run`: usar `npm.cmd run <script>` o ejecutar `node` directamente.

Logs y monitoreo
- `dbListener` emite reconexiones automáticas y límites de payload para evitar crash por mensajes demasiado grandes.
- Puedes añadir logging adicional en `services/dbListener.js` e `index.js` para capturar más eventos.

---

## Seguridad y despliegue (recomendaciones)

- No comitees `.env` con credenciales.
- Usa HTTPS en producción y restringe CORS en `index.js`.
- Mantén `JWT_SECRET` fuera del repo (gestor de secretos o variables en entorno de despliegue).
- Considera usar una herramienta de migraciones (node-pg-migrate, knex, Flyway) en lugar de SQL suelto para control de versiones.
