const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MatVicBack API',
      version: '1.0.0',
      description: 'Documentación de la API de MatVicBack',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor local'
      },
      {
        url: 'https://matvicback-develop.onrender.com',
        description: 'Servidor Render Develop'
      }
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};
