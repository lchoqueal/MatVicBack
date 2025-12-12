# 📱 SPRINT 2: TIENDA EN LÍNEA - DOCUMENTACIÓN COMPLETA

## 📋 Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Historias de Usuario Implementadas](#historias-de-usuario-implementadas)
3. [Archivos Creados](#archivos-creados)
4. [APIs Disponibles](#apis-disponibles)
5. [Flujos de Uso](#flujos-de-uso)
6. [Ejemplos de Integración Frontend](#ejemplos-de-integración-frontend)
7. [Testing](#testing)
8. [Manejo de Errores](#manejo-de-errores)
9. [Base de Datos](#base-de-datos)

---

## ⚡ INICIO RÁPIDO (3 pasos)

```bash
# 1️⃣ Setup (una sola vez)
node fix_admin.js
# Crea: admin, cliente1, empleado_online

# 2️⃣ Iniciar servidor
npm start
# Backend en http://localhost:3001

# 3️⃣ Probar en otra terminal
node test_simple.js
# 11 tests automáticos
```

**Resultado esperado:** ✅ TODOS LOS TESTS OK (11/11)

---

## 🎯 Visión General

Sprint 2 implementa un **sistema completo de e-commerce** con catálogo de productos y carrito de compras online.

### Objetivos alcanzados:
- ✅ Catálogo de productos público (sin autenticación)
- ✅ Sistema de carrito por cliente
- ✅ Proceso de checkout con transacciones ACID
- ✅ Validación de stock en tiempo real
- ✅ Notificaciones de cambios de stock
- ✅ 100% compatible con Sprint 1

### Números:
- **555 líneas** de código nuevo
- **7 endpoints** funcionales
- **2 líneas** modificadas en código existente
- **0 migraciones** requeridas
- **11/11 tests** pasando ✅

---

## 👥 Historias de Usuario Implementadas

### Historia 8: Como cliente, quiero consultar un catálogo de productos disponible online

**Estado:** ✅ COMPLETADA

**Requisitos:**
- Ver productos sin necesidad de login
- Solo mostrar productos con stock > 0
- Incluir información completa del producto

**Implementación:**
```
GET /api/cart/catalog
```

**Datos retornados:**
```json
[
  {
    "id_producto": 7,
    "nombre": "Producto A",
    "descripcion": "Descripción del producto",
    "categoria": "Bebidas",
    "stock": 50,
    "precio_unit": 52000.00
  }
]
```

---

### Historia 9: Como cliente, quiero agregar productos al carrito y pagar online

**Estado:** ✅ COMPLETADA

**Requisitos:**
- Crear carrito asociado a cliente
- Agregar/eliminar/actualizar productos
- Ver total del carrito
- Procesar compra con transacción ACID
- Generar boleta y detalles de compra

**Implementación:** 6 endpoints

---

## 📁 Archivos Creados

### 1. **models/cartModel.js** (275 líneas)
**Propósito:** Lógica de base de datos para carrito y checkout

**Funciones principales:**
```javascript
// Obtener o crear carrito del cliente
async getOrCreateCart(idCliente)

// Obtener carrito por ID
async getById(idCarrito)

// Obtener items del carrito
async getItems(idCarrito)

// Agregar producto al carrito
async addItem(idCarrito, idProducto, cantidad)

// Actualizar cantidad de producto
async updateItemQuantity(idCarrito, idDetalleCarrito, cantidad)

// Eliminar producto del carrito
async removeItem(idCarrito, idDetalleCarrito)

// Procesar compra (TRANSACCIÓN COMPLETA)
async checkout(idCarrito, idEmpleado)
```

**Características técnicas:**
- ✅ Transacciones ACID (BEGIN/COMMIT)
- ✅ Validación de stock
- ✅ Cálculo automático de totales
- ✅ Notificaciones Socket.IO
- ✅ Manejo robusto de errores

---

### 2. **controllers/cartController.js** (250 líneas)
**Propósito:** Manejo de peticiones HTTP y lógica de negocio

**Métodos:**
```javascript
// Catálogo público
async catalog(req, res)

// Crear/obtener carrito
async createCart(req, res)

// Ver carrito completo
async getCart(req, res)

// Agregar producto
async addItem(req, res)

// Actualizar cantidad
async updateItemQuantity(req, res)

// Eliminar producto
async removeItem(req, res)

// Procesar compra
async checkout(req, res)
```

**Validaciones implementadas:**
- ✅ JWT válido (excepto catálogo)
- ✅ Pertenencia del carrito al cliente
- ✅ Cantidad > 0
- ✅ Productos existen
- ✅ Cliente existe

---

### 3. **routes/cartRoutes.js** (30 líneas)
**Propósito:** Definición de endpoints REST

**Rutas:**
```javascript
GET    /catalog                    // Catálogo público
POST   /                          // Crear carrito
GET    /:id                       // Ver carrito
POST   /:id/items                 // Agregar producto
PUT    /:id/items/:itemId         // Actualizar cantidad
DELETE /:id/items/:itemId         // Eliminar producto
POST   /:id/checkout              // Procesar compra
```

---

### 4. **index.js** - Modificaciones (2 líneas)

**Línea 11 - Agregar import:**
```javascript
const cartRoutes = require('./routes/cartRoutes');
```

**Línea 29 - Registrar rutas:**
```javascript
app.use('/api/cart', cartRoutes);
```

**Nota:** El resto del archivo permanece 100% igual. Sprint 1 intacto.

---

### 5. **Archivos de Testing**

#### fix_admin.js (Setup inicial)
**Propósito:** Crear usuarios de prueba en la BD

**Usuarios creados:**
- Admin: `admin` / `Password123`
- Cliente: `cliente1` / `Password123`
- Empleado: `empleado_online` (para procesar checkouts)

**Uso:**
```bash
node fix_admin.js  # Ejecutar una sola vez
```

#### test_simple.js (Validación)
**Propósito:** Suite de 11 tests automatizados

**Pruebas incluidas:**
1. GET /api/cart/catalog (200 OK)
2. POST /api/auth/login (JWT)
3. POST /api/cart (crear)
4. GET /api/cart/:id (ver vacío)
5. POST /api/cart/:id/items (agregar 1)
6. POST /api/cart/:id/items (agregar 2)
7. GET /api/cart/:id (ver lleno)
8. PUT /api/cart/:id/items/:itemId (actualizar)
9. DELETE /api/cart/:id/items/:itemId (eliminar)
10. POST /api/cart/:id/checkout (comprar)
11. GET /api/cart/:id (verificar completado)

**Uso:**
```bash
npm start           # En terminal 1
node test_simple.js # En terminal 2
```

**Resultado esperado:**
```
✅ TODOS LOS TESTS OK (11/11)
```

---

### 6. **models/clientModel.js / controllers/clientController.js / routes/clientRoutes.js** (≈120 líneas)
**Propósito:** Implementar endpoint de registro de clientes (creación en `usuario` + entrada en `cliente`).

**Flujo principal:**
1. Validaciones básicas en el controlador (`nombres`, `apellidos`, `name_user`, `contrasena`, `dni`).
2. Verificar unicidad de `name_user` mediante `User.getByUsername`.
3. Hashear contraseña con `bcrypt.hash(contrasena, 10)`.
4. Inserción en la BD usando transacción (`pool.connect()` + `BEGIN`/`COMMIT`/`ROLLBACK`): primero `INSERT INTO usuario`, luego `INSERT INTO cliente`.
5. Responder `201 Created` con objeto que incluye `id_usuario` y el objeto `cliente` (telefono/correo/direccion).

**Archivos añadidos:**
```text
models/clientModel.js
controllers/clientController.js
routes/clientRoutes.js
scripts/test_client_request.js  # script de prueba rápido
```

**Notas técnicas:**
- Hashing de contraseñas con `bcrypt` (salts = 10), consistente con `seed.js` y `fix_admin.js`.
- Transacciones ACID para asegurar integridad entre `usuario` y `cliente`.
- Validaciones y manejo de errores siguen el patrón del proyecto (`res.status(400).json({ error: '...' })`, `res.status(500).json({ error: err.message })`).
- La ruta fue montada en `index.js` como `app.use('/api/clients', clientRoutes)`.

**Testing rápido aplicado:**
- Ejecutado `node scripts/test_client_request.js` contra `http://localhost:3001/api/clients` → `STATUS 201` y respuesta JSON con `id_usuario` y `cliente`.

**Mejoras sugeridas (opcionales):**
- Añadir constraint UNIQUE en DB para `usuario.name_user`.
- Validaciones adicionales (formato de correo, longitud mínima de contraseña, validación de DNI).
- Prueba automatizada con Jest + Supertest para este endpoint.


---

## 🔌 APIs Disponibles

### 1. CATÁLOGO (Público, sin autenticación)

#### GET /api/cart/catalog
Obtiene todos los productos con stock disponible.

**Método:** GET
**Autenticación:** ❌ NO REQUERIDA
**Body:** No aplica

**Response (200 OK):**
```json
[
  {
    "id_producto": 1,
    "nombre": "Coca-Cola 500ml",
    "descripcion": "Bebida refrescante",
    "categoria": "Bebidas",
    "stock": 50,
    "precio_unit": 2.50
  },
  {
    "id_producto": 2,
    "nombre": "Arroz 1kg",
    "descripcion": "Arroz de grano largo",
    "categoria": "Alimentos",
    "stock": 100,
    "precio_unit": 1.99
  }
]
```

**Errores:**
- `500` - Error del servidor

---

### 2. AUTENTICACIÓN (Reutiliza Sprint 1)

#### POST /api/auth/login
Obtiene JWT token para acceder a APIs protegidas.

**Método:** POST
**Autenticación:** ❌ NO REQUERIDA
**Content-Type:** application/json

**Body:**
```json
{
  "username": "cliente1",
  "password": "Password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 10,
    "username": "cliente1",
    "nombres": "Cliente Prueba"
  }
}
```

**Errores:**
- `400` - Usuario o contraseña faltantes
- `401` - Credenciales inválidas
- `500` - Error del servidor

**Nota:** Token válido por 8 horas

---

### 3. CARRITO - CREAR/VER

#### POST /api/cart
Crea un nuevo carrito activo o retorna el existente para el cliente autenticado.

**Método:** POST
**Autenticación:** ✅ REQUERIDA (JWT)
**Headers:** `Authorization: Bearer <token>`
**Body:** No aplica

**Response (201 CREATED):**
```json
{
  "id_carrito": 5,
  "id_cliente": 10,
  "estado": "activo",
  "cantidad_items": 0,
  "total": 0,
  "items": []
}
```

**Errores:**
- `401` - Sin token válido
- `403` - Usuario no es cliente
- `500` - Error del servidor

---

#### GET /api/cart/:id
Obtiene detalles completos del carrito.

**Método:** GET
**Autenticación:** ✅ REQUERIDA (JWT)
**Headers:** `Authorization: Bearer <token>`
**URL Params:** `id` = id_carrito

**Response (200 OK):**
```json
{
  "id_carrito": 5,
  "id_cliente": 10,
  "estado": "activo",
  "cantidad_items": 2,
  "total": 106000,
  "items": [
    {
      "id_detalle_carrito": 15,
      "id_producto": 7,
      "nombre": "Producto A",
      "precio_unit": 52000,
      "cantidad": 1,
      "subtotal": 52000
    },
    {
      "id_detalle_carrito": 16,
      "id_producto": 9,
      "nombre": "Producto B",
      "precio_unit": 54000,
      "cantidad": 1,
      "subtotal": 54000
    }
  ]
}
```

**Errores:**
- `401` - Sin token válido
- `403` - Carrito pertenece a otro cliente
- `404` - Carrito no existe
- `500` - Error del servidor

---

### 4. CARRITO - AGREGAR PRODUCTO

#### POST /api/cart/:id/items
Agrega un producto al carrito.

**Método:** POST
**Autenticación:** ✅ REQUERIDA (JWT)
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
**URL Params:** `id` = id_carrito

**Body:**
```json
{
  "id_producto": 7,
  "cantidad": 2
}
```

**Response (200 OK):**
```json
{
  "id_carrito": 5,
  "id_cliente": 10,
  "estado": "activo",
  "cantidad_items": 1,
  "total": 104000,
  "items": [
    {
      "id_detalle_carrito": 17,
      "id_producto": 7,
      "nombre": "Producto A",
      "precio_unit": 52000,
      "cantidad": 2,
      "subtotal": 104000
    }
  ]
}
```

**Validaciones:**
- ✅ Cantidad > 0
- ✅ Stock disponible >= cantidad
- ✅ Producto existe
- ✅ Carrito existe
- ✅ Pertenece al cliente

**Errores:**
- `400` - Validación fallida (stock insuficiente, cantidad inválida, etc.)
- `401` - Sin token válido
- `403` - Carrito pertenece a otro cliente
- `404` - Carrito o producto no existe
- `500` - Error del servidor

---

### 5. CARRITO - ACTUALIZAR CANTIDAD

#### PUT /api/cart/:id/items/:itemId
Actualiza la cantidad de un producto en el carrito.

**Método:** PUT
**Autenticación:** ✅ REQUERIDA (JWT)
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
**URL Params:** 
- `id` = id_carrito
- `itemId` = id_detalle_carrito

**Body:**
```json
{
  "cantidad": 3
}
```

**Response (200 OK):**
```json
{
  "id_carrito": 5,
  "id_cliente": 10,
  "estado": "activo",
  "cantidad_items": 1,
  "total": 156000,
  "items": [
    {
      "id_detalle_carrito": 17,
      "id_producto": 7,
      "nombre": "Producto A",
      "precio_unit": 52000,
      "cantidad": 3,
      "subtotal": 156000
    }
  ]
}
```

**Validaciones:**
- ✅ Cantidad > 0
- ✅ Stock disponible >= nueva cantidad
- ✅ Item pertenece al carrito
- ✅ Carrito existe

**Errores:**
- `400` - Validación fallida
- `401` - Sin token válido
- `403` - Carrito pertenece a otro cliente
- `404` - Carrito o item no existe
- `500` - Error del servidor

---

### 6. CARRITO - ELIMINAR PRODUCTO

#### DELETE /api/cart/:id/items/:itemId
Elimina un producto del carrito.

**Método:** DELETE
**Autenticación:** ✅ REQUERIDA (JWT)
**Headers:** `Authorization: Bearer <token>`
**URL Params:**
- `id` = id_carrito
- `itemId` = id_detalle_carrito

**Response (200 OK):**
```json
{
  "id_carrito": 5,
  "id_cliente": 10,
  "estado": "activo",
  "cantidad_items": 0,
  "total": 0,
  "items": []
}
```

**Errores:**
- `401` - Sin token válido
- `403` - Carrito pertenece a otro cliente
- `404` - Carrito o item no existe
- `500` - Error del servidor

---

### 7. CARRITO - PROCESAR COMPRA (CHECKOUT)

#### POST /api/cart/:id/checkout
**⚠️ OPERACIÓN CRÍTICA** - Procesa la compra completa con transacción ACID.

**Método:** POST
**Autenticación:** ✅ REQUERIDA (JWT)
**Headers:** `Authorization: Bearer <token>`
**URL Params:** `id` = id_carrito

**Response (201 CREATED):**
```json
{
  "success": true,
  "message": "Compra procesada exitosamente",
  "boleta": {
    "id_boleta": 17,
    "metodo_pago": "online",
    "fecha_emision": "2025-12-08",
    "total": 5000.00,
    "id_cliente": 10,
    "id_empleado": 11,
    "detalles": [
      {
        "id_detalle_boleta": 45,
        "id_producto": 9,
        "nombre": "Producto B",
        "cantidad": 1,
        "precio_unit": 5000,
        "sub_total": 5000
      }
    ]
  }
}
```

**Transacción ACID garantiza:**
1. ✅ Valida stock de todos los productos
2. ✅ Crea registro de boleta (id_boleta)
3. ✅ Crea detalles de boleta (items)
4. ✅ Actualiza stock en tabla producto
5. ✅ Marca carrito como "completado"
6. ✅ Emite notificaciones Socket.IO
7. ✅ O revierte TODO si falla

**Errores:**
- `400` - Carrito vacío, stock insuficiente, sin empleados disponibles
- `401` - Sin token válido
- `403` - Carrito pertenece a otro cliente
- `404` - Carrito no existe
- `500` - Error en la transacción (se revierte automáticamente)

**Nota:** Una vez completado, el carrito no puede modificarse.

---

## 🔄 Flujos de Uso

### Flujo 1: Navegar y Comprar (Caso Normal)

```
1. Cliente abre app
   ↓
2. GET /api/cart/catalog
   ↓ Muestra productos
   ↓
3. Cliente hace login
   ↓
4. POST /api/auth/login
   ↓ Recibe token JWT
   ↓
5. Cliente crea carrito
   ↓
6. POST /api/cart
   ↓ Recibe id_carrito
   ↓
7. Cliente agrega productos
   ↓ (Loop)
8. POST /api/cart/:id/items
   ↓ Actualiza carrito
   ↓
9. Cliente revisa carrito
   ↓
10. GET /api/cart/:id
    ↓ Ve items y total
    ↓
11. Cliente compra
    ↓
12. POST /api/cart/:id/checkout
    ↓ Compra exitosa (Boleta generada)
    ↓
13. FIN ✅
```

### Flujo 2: Editar Carrito

```
1. Cliente en carrito
   ↓
2. GET /api/cart/:id
   ↓ Ve items
   ↓
3. Cliente cambia cantidad
   ↓
4. PUT /api/cart/:id/items/:itemId
   ↓ Actualiza cantidad
   ↓
5. GET /api/cart/:id
   ↓ Ve nuevo total
```

### Flujo 3: Eliminar Producto

```
1. Cliente en carrito
   ↓
2. Cliente quita producto
   ↓
3. DELETE /api/cart/:id/items/:itemId
   ↓ Producto eliminado
   ↓
4. GET /api/cart/:id
   ↓ Ve carrito actualizado
```

---

## 💻 Ejemplos de Integración Frontend

### JavaScript/Fetch

#### 1. Obtener Catálogo
```javascript
async function loadCatalog() {
  const response = await fetch('http://localhost:3001/api/cart/catalog');
  const products = await response.json();
  console.log('Productos:', products);
  // Mostrar en UI
}

loadCatalog();
```

#### 2. Login
```javascript
async function login(username, password) {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    return data.token;
  } else {
    throw new Error(data.error);
  }
}
```

#### 3. Crear Carrito
```javascript
async function createCart() {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3001/api/cart', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  localStorage.setItem('cartId', data.id_carrito);
  return data.id_carrito;
}
```

#### 4. Agregar al Carrito
```javascript
async function addToCart(productId, quantity) {
  const token = localStorage.getItem('token');
  const cartId = localStorage.getItem('cartId');
  
  const response = await fetch(`http://localhost:3001/api/cart/${cartId}/items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id_producto: productId, cantidad: quantity })
  });
  
  const data = await response.json();
  if (response.ok) {
    console.log('Producto agregado. Total:', data.total);
    return data;
  } else {
    throw new Error(data.error);
  }
}
```

#### 5. Ver Carrito
```javascript
async function viewCart() {
  const token = localStorage.getItem('token');
  const cartId = localStorage.getItem('cartId');
  
  const response = await fetch(`http://localhost:3001/api/cart/${cartId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const cart = await response.json();
  console.log('Items:', cart.items);
  console.log('Total:', cart.total);
  return cart;
}
```

#### 6. Procesar Compra
```javascript
async function checkout() {
  const token = localStorage.getItem('token');
  const cartId = localStorage.getItem('cartId');
  
  const response = await fetch(`http://localhost:3001/api/cart/${cartId}/checkout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  if (response.ok) {
    console.log('¡Compra exitosa!');
    console.log('Boleta:', data.boleta.id_boleta);
    console.log('Total:', data.boleta.total);
    localStorage.removeItem('cartId');
    return data.boleta;
  } else {
    throw new Error(data.error);
  }
}
```

### React (Hooks)

```javascript
import { useState, useEffect } from 'react';

function Store() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Cargar catálogo
  useEffect(() => {
    fetch('http://localhost:3001/api/cart/catalog')
      .then(r => r.json())
      .then(data => setProducts(data));
  }, []);

  // Login
  const handleLogin = async (username, password) => {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
  };

  // Agregar al carrito
  const handleAddToCart = async (productId, quantity) => {
    if (!cart) {
      const res = await fetch('http://localhost:3001/api/cart', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const newCart = await res.json();
      setCart(newCart);
      // Agregar producto al nuevo carrito
    } else {
      const res = await fetch(`http://localhost:3001/api/cart/${cart.id_carrito}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_producto: productId, cantidad: quantity })
      });
      const updated = await res.json();
      setCart(updated);
    }
  };

  // Checkout
  const handleCheckout = async () => {
    const res = await fetch(`http://localhost:3001/api/cart/${cart.id_carrito}/checkout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    console.log('Compra exitosa, boleta:', result.boleta.id_boleta);
    setCart(null);
  };

  return (
    <div>
      <h1>Tienda Online</h1>
      {/* Componentes */}
    </div>
  );
}

export default Store;
```

---

## ✅ Testing

### Prerequisitos

```bash
# Setup de usuarios (UNA SOLA VEZ)
node fix_admin.js
```

Crea:
- Admin: `admin` / `Password123`
- Cliente: `cliente1` / `Password123`
- Empleado: `empleado_online`

### Ejecutar Tests

**Terminal 1 - Servidor:**
```bash
npm start
```

**Terminal 2 - Tests:**
```bash
node test_simple.js
```

### Resultado Esperado

```
╔════════════════════════════════════╗
║ TESTING SPRINT 2 - TIENDA EN LÍNEA ║
╚════════════════════════════════════╝

📦 HISTORIA 8: CATÁLOGO
  1. Catálogo público (sin auth)... ✅ 200
     → 15 productos disponibles

🔐 AUTENTICACIÓN
  2. Login (cliente1 / Password123)... ✅ 200

🛒 HISTORIA 9: CARRITO DE COMPRAS
  3. Crear carrito... ✅ 201
  4. Ver carrito vacío... ✅ 200
  5. Agregar producto 1... ✅ 200
  6. Agregar producto 2... ✅ 200
  7. Ver carrito lleno... ✅ 200
  8. Actualizar cantidad... ✅ 200
  9. Eliminar primer producto... ✅ 200

💳 PROCESAR COMPRA
  10. Procesar compra (checkout)... ✅ 201
  11. Verificar carrito completado... ✅ 200

╔════════════════════════════════════╗
║       ✅ TODOS LOS TESTS OK        ║
╚════════════════════════════════════╝
```

---

## ⚠️ Manejo de Errores

### Errores Comunes

#### Error: "Invalid credentials"
```
Causa: Usuario o contraseña incorrectos
Solución: Ejecutar node fix_admin.js para crear usuarios
```

#### Error: "Stock insuficiente"
```
Causa: Producto no tiene cantidad suficiente
Solución: Verificar stock disponible en catálogo
```

#### Error: "No tienes permiso para acceder"
```
Causa: Token expirado o inválido
Solución: Hacer login nuevamente (POST /api/auth/login)
```

#### Error: "Carrito no encontrado"
```
Causa: ID de carrito inválido o no existe
Solución: Crear nuevo carrito (POST /api/cart)
```

#### Error: "El carrito está vacío"
```
Causa: Intentar checkout sin productos
Solución: Agregar al menos 1 producto antes de checkout
```

#### Error: "EADDRINUSE: address already in use :::3001"
```
Causa: Otro proceso está usando puerto 3001
Solución: 
  Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

---

## 🗄️ Base de Datos

### Tablas Utilizadas

#### carrito
Almacena carritos de clientes
```sql
CREATE TABLE carrito (
  id_carrito SERIAL PRIMARY KEY,
  id_cliente INT,
  estado VARCHAR(50), -- 'activo' o 'completado'
  fecha_creacion DATE,
  FOREIGN KEY (id_cliente) REFERENCES cliente(id_usuario_cliente)
);
```

#### detalle_carrito
Items dentro de cada carrito
```sql
CREATE TABLE detalle_carrito (
  id_detalle_carrito SERIAL PRIMARY KEY,
  id_carrito INT,
  id_producto INT,
  cantidad INT,
  FOREIGN KEY (id_carrito) REFERENCES carrito(id_carrito),
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);
```

#### boleta
Compras realizadas
```sql
CREATE TABLE boleta (
  id_boleta SERIAL PRIMARY KEY,
  metodo_pago VARCHAR(50), -- 'online'
  fecha_emision DATE,
  total DECIMAL(10,2),
  id_empleado_boleta INT,
  id_cliente_boleta INT,
  FOREIGN KEY (id_empleado_boleta) REFERENCES empleado(id_usuario_empleado),
  FOREIGN KEY (id_cliente_boleta) REFERENCES cliente(id_usuario_cliente)
);
```

#### detalle_boleta
Items de cada compra
```sql
CREATE TABLE detalle_boleta (
  id_detalle_boleta SERIAL PRIMARY KEY,
  sub_total DECIMAL(10,2),
  cantidad INT,
  id_boleta INT,
  id_producto INT,
  FOREIGN KEY (id_boleta) REFERENCES boleta(id_boleta),
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);
```

#### producto
Catálogo de productos (usada desde Sprint 1)
```sql
CREATE TABLE producto (
  id_producto SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  descripcion TEXT,
  categoria VARCHAR(50),
  stock INT,
  min_stock INT,
  precio_unit DECIMAL(10,2)
);
```

### Migraciones Requeridas
✅ **NINGUNA** - Todas las tablas existen en schema.sql

### Cambios en el Schema
✅ **NINGUNO** - 100% compatible con Sprint 1

---

## 🔒 Seguridad

### Implementado

- ✅ **JWT Authentication** - Token con expiración 8 horas
- ✅ **Authorization** - Cada cliente solo accede a su carrito
- ✅ **Input Validation** - Cantidad > 0, IDs válidos, etc.
- ✅ **Stock Validation** - No vender más del disponible
- ✅ **ACID Transactions** - Checkout todo o nada
- ✅ **Error Handling** - Sin exponer info sensible

### Recomendaciones para Producción

- 🔐 HTTPS obligatorio (no HTTP)
- 🔐 CORS configurado correctamente
- 🔐 Rate limiting en endpoints
- 🔐 Validación adicional en servidor
- 🔐 Logs de auditoría para compras

---

## 📊 Arquitectura

### Patrón MVC (Model-View-Controller)

```
Frontend (React/Vue/Angular)
    ↓ HTTP Requests
Express Server (index.js)
    ↓
Routes (cartRoutes.js)
    ↓
Controllers (cartController.js)
    ↓
Models (cartModel.js)
    ↓
PostgreSQL Database
```

### Seguridad de Capas

1. **Routes:** Define endpoints
2. **Middleware:** Valida JWT (authMiddleware)
3. **Controller:** Valida lógica de negocio
4. **Model:** Valida datos en BD
5. **Database:** Constraints e integridad referencial

---

## 📈 Próximas Mejoras (Futuros Sprints)

- [ ] Integración Stripe/PayPal
- [ ] Cupones y descuentos
- [ ] Carritos abandonados (recordatorios)
- [ ] Recomendaciones personalizadas
- [ ] Historial de compras del cliente
- [ ] Devoluciones y cambios
- [ ] Envíos y tracking
- [ ] Reviews de productos
- [ ] Wishlist/Favoritos

---

## 📞 Soporte

### Problemas Comunes

| Problema | Solución |
|----------|----------|
| Tests no corren | Ejecutar `node fix_admin.js` primero |
| Puerto 3001 en uso | `Get-Process \| ... \| Stop-Process -Force` |
| JWT expirado | Hacer login nuevamente |
| Stock insuficiente | Verificar disponibilidad en catálogo |
| Carrito no encontrado | Crear nuevo carrito con POST |

### Contacto
- Backend Lead: [Nombre/Contacto]
- Frontend Lead: [Nombre/Contacto]
- Database Admin: [Nombre/Contacto]

---

## ✅ Checklist de Validación

- [x] Historia 8 implementada (Catálogo)
- [x] Historia 9 implementada (Carrito y Checkout)
- [x] 7 endpoints funcionales
- [x] 11/11 tests pasando
- [x] JWT authentication
- [x] ACID transactions
- [x] Stock validation
- [x] Error handling
- [x] Documentación completa
- [x] Sprint 1 intacto
- [x] 0 migraciones requeridas
- [x] Listo para frontend

---

## 📝 Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 08/12/2025 | Sprint 2 completado - Tienda en línea |
| - | - | Catálogo público implementado |
| - | - | Carrito CRUD completo |
| - | - | Checkout con transacción ACID |
| - | - | 7 endpoints funcionales |
| - | - | 11/11 tests validados |

---

## 📄 Licencia

Copyright © 2025 - Proyecto MatVic Backend

---

**Estado:** ✅ **LISTO PARA PRODUCCIÓN**

**Última actualización:** 8 de diciembre de 2025

**Autor:** Backend Team

