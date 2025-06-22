const cloudinary = require('../config/cloudinary.config');
const { v4: uuidv4 } = require('uuid');

const uploadToCloudinary = async (file, folder = 'products') => {
  try {
    // With CloudinaryStorage, the file is already uploaded and URL is in file.path
    const url = file.path;
    const thumbnail_url = url.replace('/upload/', '/upload/c_thumb,w_200,g_face/');
    
    // Extract public_id from the URL if needed
    const urlParts = url.split('/');
    const public_id = urlParts[urlParts.length - 1].split('.')[0];

    return {
      url,
      thumbnail_url,
      public_id
    };
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

const deleteFromCloudinary = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    throw new Error(`Image deletion failed: ${error.message}`);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
}; 