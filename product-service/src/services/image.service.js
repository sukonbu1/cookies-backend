const ProductImage = require('../models/productImage.model');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary.utils');

const ImageService = {
  uploadImage: (file, folder) => uploadToCloudinary(file, folder),
  createImage: (product_id, image_url, thumbnail_url, alt_text, position, is_primary, public_id) =>
    ProductImage.create({ product_id, image_url, thumbnail_url, alt_text, position, is_primary, public_id }),
  updateManyImages: (product_id, updateData) =>
    ProductImage.updateMany({ product_id, _id: { $ne: null } }, updateData),
  findImageById: (id) => ProductImage.findById(id),
  deleteImage: (idOrPublicId) => {
    if (typeof idOrPublicId === 'string' && idOrPublicId.startsWith('products/')) {
      return deleteFromCloudinary(idOrPublicId);
    } else {
      return ProductImage.delete(idOrPublicId);
    }
  },
  findImagesByProductId: (product_id) => ProductImage.findByProductId(product_id),
  updateImagePosition: (id, data) => ProductImage.update(id, data),
  updateImage: (id, data) => ProductImage.update(id, data)
};

module.exports = ImageService; 