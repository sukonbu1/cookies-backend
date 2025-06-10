const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../../../common/src/config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatars', 
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => `${req.params.userId}_${Date.now()}`
  }
});

const upload = multer({ storage });

module.exports = upload;