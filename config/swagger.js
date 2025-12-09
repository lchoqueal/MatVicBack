const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

/**
 * Configuración de Swagger/OpenAPI
 * Define la estructura y metadata de la documentación de la API
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MatVic API - Sistema de Gestión de Inventario y Ventas',
      version: '1.0.0',
      description: `
        API RESTful para el sistema MatVic - Gestión integral de inventarios, productos, ventas y usuarios.
        
        **Características principales:**
        - Gestión de productos con control de stock
        - Sistema de alertas de stock crítico
        - Gestión de ventas y reportes
        - Autenticación y autorización de usuarios
        - Carga de imágenes a Cloudinary
        
        **Arquitectura:**
        - Backend: Node.js + Express
        - Base de datos: PostgreSQL
        - Documentación: OpenAPI 3.0 (Swagger)
      `,
      contact: {
        name: 'Equipo MatVic',
        email: 'soporte@matvic.com'
      },
      license: {
        name: 'ISC',
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de desarrollo local'
      },
      {
        url: 'https://matvicback-develop.onrender.com',
        description: 'Servidor de desarrollo (Render)'
      },
      {
        url: 'https://mat-vic-back.vercel.app',
        description: 'Servidor de producción (Vercel)'
      }
    ],
    tags: [
      {
        name: 'Productos',
        description: 'Endpoints para gestión de productos e inventario'
      },
      {
        name: 'Autenticación',
        description: 'Endpoints de autenticación y autorización'
      },
      {
        name: 'Usuarios',
        description: 'Gestión de usuarios del sistema'
      },
      {
        name: 'Ventas',
        description: 'Registro y consulta de ventas'
      },
      {
        name: 'Alertas',
        description: 'Sistema de alertas de stock crítico'
      },
      {
        name: 'Uploads',
        description: 'Carga de archivos e imágenes'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT (sin "Bearer"). Obtén el token desde /api/auth/login'
        }
      },
      schemas: {
        Producto: {
          type: 'object',
          properties: {
            id_producto: {
              type: 'integer',
              description: 'ID único del producto',
              example: 1
            },
            nombre: {
              type: 'string',
              description: 'Nombre del producto',
              example: 'Laptop HP Pavilion'
            },
            descripcion: {
              type: 'string',
              nullable: true,
              description: 'Descripción detallada del producto',
              example: 'Laptop de alto rendimiento con 16GB RAM'
            },
            categoria: {
              type: 'string',
              description: 'Categoría del producto',
              example: 'Electrónica'
            },
            stock: {
              type: 'integer',
              description: 'Cantidad actual en stock',
              example: 25
            },
            min_stock: {
              type: 'integer',
              description: 'Stock mínimo antes de alerta',
              example: 5
            },
            precio_unit: {
              type: 'number',
              format: 'decimal',
              description: 'Precio unitario del producto',
              example: 2500.50
            },
            imagen_url: {
              type: 'string',
              nullable: true,
              description: 'URL de la imagen del producto',
              example: 'https://res.cloudinary.com/demo/image/upload/v1234567890/products/laptop.jpg'
            }
          },
          required: ['nombre', 'categoria']
        },
        ProductoInput: {
          type: 'object',
          properties: {
            nombre: {
              type: 'string',
              description: 'Nombre del producto',
              example: 'Mouse Logitech'
            },
            descripcion: {
              type: 'string',
              description: 'Descripción del producto',
              example: 'Mouse inalámbrico ergonómico'
            },
            categoria: {
              type: 'string',
              description: 'Categoría del producto',
              example: 'Accesorios'
            },
            stock: {
              type: 'integer',
              description: 'Stock inicial',
              example: 50,
              default: 0
            },
            min_stock: {
              type: 'integer',
              description: 'Stock mínimo',
              example: 10,
              default: 0
            },
            precio_unit: {
              type: 'number',
              description: 'Precio unitario',
              example: 45.99,
              default: 0
            }
          },
          required: ['nombre', 'categoria']
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error',
              example: 'Producto no encontrado'
            }
          }
        }
      }
    }
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js')
  ]
};

const swaggerSpec = swaggerJsdoc(options);

console.log('Swagger - Rutas documentadas:', Object.keys(swaggerSpec.paths || {}).length);
console.log('Swagger - Paths:', Object.keys(swaggerSpec.paths || {}));

module.exports = swaggerSpec;
