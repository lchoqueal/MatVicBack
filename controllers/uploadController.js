const pool = require('../config/db');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { cleanupTempFile } = require('../middleware/upload');

const uploadController = {
  // Subir imagen para un producto
  async uploadProductImage(req, res) {
    let tempFilePath = null;
    
    try {
      const { id } = req.params; // ID del producto
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
      }
      
      tempFilePath = file.path;
      
      // Verificar que el producto existe
      const { rows } = await pool.query('SELECT * FROM producto WHERE id_producto = $1', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      
      const producto = rows[0];
      
      // Si ya tiene imagen, eliminar la anterior
      if (producto.imagen_url) {
        try {
          // Extraer public_id de la URL de Cloudinary
          const urlParts = producto.imagen_url.split('/');
          const fileWithExt = urlParts[urlParts.length - 1];
          const publicId = `productos/${fileWithExt.split('.')[0]}`;
          await deleteImage(publicId);
        } catch (deleteError) {
          console.warn('No se pudo eliminar imagen anterior:', deleteError.message);
        }
      }
      
      // Subir nueva imagen a Cloudinary
      const result = await uploadImage(tempFilePath, 'productos');
      
      // Actualizar la base de datos con la nueva URL
      await pool.query(
        'UPDATE producto SET imagen_url = $1 WHERE id_producto = $2',
        [result.secure_url, id]
      );
      
      // Limpiar archivo temporal
      cleanupTempFile(tempFilePath);
      
      res.json({
        message: 'Imagen subida exitosamente',
        imagen_url: result.secure_url,
        public_id: result.public_id
      });
      
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      
      // Limpiar archivo temporal en caso de error
      if (tempFilePath) {
        cleanupTempFile(tempFilePath);
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  },
  
  // Eliminar imagen de un producto
  async deleteProductImage(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener el producto
      const { rows } = await pool.query('SELECT * FROM producto WHERE id_producto = $1', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      
      const producto = rows[0];
      
      if (!producto.imagen_url) {
        return res.status(400).json({ error: 'El producto no tiene imagen' });
      }
      
      try {
        // Extraer public_id de la URL
        const urlParts = producto.imagen_url.split('/');
        const fileWithExt = urlParts[urlParts.length - 1];
        const publicId = `productos/${fileWithExt.split('.')[0]}`;
        
        // Eliminar de Cloudinary
        await deleteImage(publicId);
      } catch (deleteError) {
        console.warn('Error eliminando de Cloudinary:', deleteError.message);
      }
      
      // Actualizar base de datos
      await pool.query(
        'UPDATE producto SET imagen_url = NULL WHERE id_producto = $1',
        [id]
      );
      
      res.json({ message: 'Imagen eliminada exitosamente' });
      
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  }
};

module.exports = uploadController;