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
  }
]
```

---

### 2. CARRITO - CREAR

#### POST /api/cart
Crea un nuevo carrito activo para el cliente autenticado.

**Método:** POST
**Autenticación:** ✅ REQUERIDA (JWT)
**Headers:** `Authorization: Bearer <token>`

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

---

### 3. CARRITO - VER

#### GET /api/cart/:id
Obtiene detalles completos del carrito.

**Response (200 OK):**
```json
{
  "id_carrito": 5,
  "id_cliente": 10,
  "estado": "activo",
  "cantidad_items": 2,
  "total": 106000,
  "items": [...]
}
```

---

### 4. CARRITO - AGREGAR PRODUCTO

#### POST /api/cart/:id/items

**Body:**
```json
{
  "id_producto": 7,
  "cantidad": 2
}
```

**Response (200 OK):** Carrito actualizado

---

### 5. CARRITO - ACTUALIZAR CANTIDAD

#### PUT /api/cart/:id/items/:itemId

**Body:**
```json
{
  "cantidad": 3
}
```

---

### 6. CARRITO - ELIMINAR PRODUCTO

#### DELETE /api/cart/:id/items/:itemId

**Response (200 OK):** Carrito actualizado

---

### 7. CARRITO - PROCESAR COMPRA

#### POST /api/cart/:id/checkout

**Response (201 CREATED):**
```json
{
  "success": true,
  "message": "Compra procesada exitosamente",
  "boleta": {
    "id_boleta": 17,
    "metodo_pago": "online",
    "total": 5000.00
  }
}
```

**Transacción ACID garantiza:**
1. ✅ Valida stock de todos los productos
2. ✅ Crea registro de boleta
3. ✅ Actualiza stock
4. ✅ Marca carrito como "completado"
5. ✅ O revierte TODO si falla

---

## ✅ Testing

### Prerequisitos

```bash
# Setup de usuarios (UNA SOLA VEZ)
node fix_admin.js
```

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
✅ TODOS LOS TESTS OK (11/11)
```

---

## ⚠️ Manejo de Errores

### Errores Comunes

| Problema | Solución |
|----------|----------|
| Tests no corren | Ejecutar `node fix_admin.js` primero |
| Puerto 3001 en uso | Detener otros procesos Node.js |
| JWT expirado | Hacer login nuevamente |
| Stock insuficiente | Verificar disponibilidad en catálogo |
| Carrito no encontrado | Crear nuevo carrito |

---

## 🗄️ Base de Datos

### Tablas Utilizadas

**carrito** - Almacena carritos de clientes
**detalle_carrito** - Items dentro de cada carrito
**boleta** - Compras realizadas
**detalle_boleta** - Items de cada compra

### Migraciones Requeridas
✅ **NINGUNA** - Todas las tablas existen en schema.sql

---

## 🔒 Seguridad

### Implementado

- ✅ **JWT Authentication** - Token con expiración 8 horas
- ✅ **Authorization** - Cada cliente solo accede a su carrito
- ✅ **Input Validation** - Cantidad > 0, IDs válidos, etc.
- ✅ **Stock Validation** - No vender más del disponible
- ✅ **ACID Transactions** - Checkout todo o nada

---

## 📊 Arquitectura

```
Frontend
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

---

## 📈 Próximas Mejoras (Futuros Sprints)

- [ ] Integración Stripe/PayPal
- [ ] Cupones y descuentos
- [ ] Historial de compras del cliente
- [ ] Devoluciones y cambios
- [ ] Reviews de productos
- [ ] Wishlist/Favoritos

---

**Estado:** ✅ **LISTO PARA PRODUCCIÓN**

**Última actualización:** 9 de diciembre de 2025
