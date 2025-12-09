/**
 * Script para verificar que la configuración de Swagger es válida
 */
const swaggerSpec = require('../config/swagger');

console.log('Verificando configuración de Swagger...\n');

if (swaggerSpec && swaggerSpec.info) {
  console.log('✓ Swagger configurado correctamente');
  console.log('  Título:', swaggerSpec.info.title);
  console.log('  Versión:', swaggerSpec.info.version);
  console.log('  Servidores:', swaggerSpec.servers?.length || 0);
  console.log('  Tags:', swaggerSpec.tags?.length || 0);
  
  const paths = Object.keys(swaggerSpec.paths || {});
  console.log('  Rutas documentadas:', paths.length);
  
  if (paths.length > 0) {
    console.log('\nRutas encontradas:');
    paths.forEach(path => {
      const methods = Object.keys(swaggerSpec.paths[path]);
      console.log(`  - ${path}: [${methods.join(', ').toUpperCase()}]`);
    });
  } else {
    console.log('\n⚠ No se encontraron rutas documentadas. Verifica que los comentarios @swagger estén presentes en los archivos de rutas.');
  }
} else {
  console.error('✗ Error: Swagger no está configurado correctamente');
}
