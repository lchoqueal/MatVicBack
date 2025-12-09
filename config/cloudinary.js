const cloudinary = require('cloudinary').v2;

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('=== CLOUDINARY CONFIG ===');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Configurado ✓' : 'NO CONFIGURADO ✗');

// Funcion para subir imagen
const uploadImage = async (filePath, folder = 'productos') => {
  try {
    console.log('Subiendo archivo:', filePath, 'a carpeta:', folder);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 600, crop: 'limit', quality: 'auto' }
      ]
    });
    console.log('Upload exitoso. URL:', result.secure_url);
    return result;
  } catch (error) {
    console.error('Error en uploadImage:', error);
    throw new Error(`Error uploading to Cloudinary: ${error.message}`);
  }
};

// Funcion para eliminar imagen
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Error deleting from Cloudinary: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage
};