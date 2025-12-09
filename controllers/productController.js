const Product = require('../models/productModel');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { cleanupTempFile } = require('../middleware/upload');

// opcional: inyectar io en runtime desde index.js
let io = null;
// la función setIO se exportará al final para no ser sobrescrita
function setIO(socketIo) {
  io = socketIo;
}

const productController = {
  async list(req, res) {
    try {
      const products = await Product.getAll();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async get(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.getById(id);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async create(req, res) {
    let tempFilePath = null;
    
    try {
      console.log('=== CREATE PRODUCT DEBUG ===');
      console.log('Body:', req.body);
      console.log('File:', req.file ? { filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype } : 'No file');
      
      // validations
      if (!req.body.nombre) return res.status(400).json({ error: 'nombre es requerido' });
      
      // Crear el producto primero
      const created = await Product.create(req.body);
      
      // Si hay imagen, subirla a Cloudinary
      if (req.file) {
        tempFilePath = req.file.path;
        console.log('Archivo temporal creado:', tempFilePath);
        
        try {
          console.log('Intentando subir a Cloudinary...');
          const result = await uploadImage(tempFilePath, 'productos');
          console.log('Imagen subida exitosamente:', result.secure_url);
          
          // Actualizar el producto con la URL de la imagen
          const updated = await Product.update(created.id_producto, { 
            imagen_url: result.secure_url 
          });
          console.log('Producto actualizado con imagen URL');
          
          // Limpiar archivo temporal
          cleanupTempFile(tempFilePath);
          
          return res.status(201).json(updated);
        } catch (uploadError) {
          console.error('Error subiendo imagen:', uploadError);
          // Si falla la imagen, devolver producto sin imagen
          cleanupTempFile(tempFilePath);
        }
      }
      
      res.status(201).json(created);
    } catch (err) {
      // Limpiar archivo temporal en caso de error
      if (tempFilePath) {
        cleanupTempFile(tempFilePath);
      }
      res.status(500).json({ error: err.message });
    }
  },
  async update(req, res) {
    let tempFilePath = null;
    
    try {
      const { id } = req.params;
      
      // Verificar que el producto existe
      const existingProduct = await Product.getById(id);
      if (!existingProduct) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      
      // Si hay nueva imagen, procesarla
      if (req.file) {
        tempFilePath = req.file.path;
        
        try {
          // Eliminar imagen anterior si existe
          if (existingProduct.imagen_url) {
            try {
              const urlParts = existingProduct.imagen_url.split('/');
              const fileWithExt = urlParts[urlParts.length - 1];
              const publicId = `productos/${fileWithExt.split('.')[0]}`;
              await deleteImage(publicId);
            } catch (deleteError) {
              console.warn('No se pudo eliminar imagen anterior:', deleteError.message);
            }
          }
          
          // Subir nueva imagen
          const result = await uploadImage(tempFilePath, 'productos');
          
          // Agregar URL de imagen a los datos de actualización
          req.body.imagen_url = result.secure_url;
          
          // Limpiar archivo temporal
          cleanupTempFile(tempFilePath);
          
        } catch (uploadError) {
          console.error('Error procesando imagen:', uploadError);
          cleanupTempFile(tempFilePath);
          // Continuar sin imagen si falla
        }
      }
      
      // Actualizar producto
      const updated = await Product.update(id, req.body);
      res.json(updated);
      
    } catch (err) {
      // Limpiar archivo temporal en caso de error
      if (tempFilePath) {
        cleanupTempFile(tempFilePath);
      }
      res.status(500).json({ error: err.message });
    }
  },
  async remove(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Product.remove(id);
      if (!deleted) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { stock } = req.body;
      const updated = await Product.updateStock(id, stock);
      // persistir alerta si corresponde
      if (updated && updated.min_stock !== undefined && updated.stock <= updated.min_stock) {
        // insertar alerta
        await require('../config/db').query('INSERT INTO alerta (id_producto, tipo, stock_actual, min_stock, mensaje) VALUES ($1,$2,$3,$4,$5)', [id, 'stock_minimo', updated.stock, updated.min_stock, `Stock en o por debajo de minimo: ${updated.stock}`]);
      }
      // emitir evento de stock actualizado
      if (io) io.emit('stock.updated', { productId: id, stock: updated.stock });
      // emitir alerta si stock <= min_stock
      if (updated && updated.min_stock !== undefined && updated.stock <= updated.min_stock) {
        if (io) io.emit('stock.alert', { productId: id, stock: updated.stock, min_stock: updated.min_stock });
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  // compra: incrementar stock
  async purchase(req, res) {
    try {
      const { id } = req.params;
      const { cantidad } = req.body;
      if (!cantidad || cantidad <= 0) return res.status(400).json({ error: 'cantidad debe ser mayor a 0' });
      const updated = await Product.incrementStock(id, cantidad);
      // emitir evento
      if (io) io.emit('stock.updated', { productId: id, stock: updated.stock });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  // transferencia simplificada entre productos
  async transfer(req, res) {
    try {
      const { from, to, cantidad } = req.body;
      if (!from || !to || !cantidad) return res.status(400).json({ error: 'from, to y cantidad son requeridos' });
      const result = await Product.transferStock(from, to, cantidad);
      // emitir eventos
      if (io) {
        io.emit('stock.updated', { productId: result.from.id_producto, stock: result.from.stock });
        io.emit('stock.updated', { productId: result.to.id_producto, stock: result.to.stock });
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async alerts(req, res) {
    try {
      const critical = await Product.getCritical();
      // Formatear respuesta para que coincida con lo que espera el frontend
      res.json({ productos: critical });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  // estadísticas de productos - nuevo endpoint
  async stats(req, res) {
    try {
      const products = await Product.getAll();
      const totalStock = products.reduce((sum, product) => sum + (product.stock || 0), 0);
      const totalProducts = products.length;
      const lowStockCount = products.filter(p => p.stock <= p.min_stock).length;
      
      res.json({
        totalStock,
        totalProducts,
        lowStockCount
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = productController;
// exportar setIO como propiedad del módulo
module.exports.setIO = setIO;
