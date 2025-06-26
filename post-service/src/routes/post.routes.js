const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Validation middleware
const postValidation = [
  body('title').notEmpty().trim().escape(),
  body('description').notEmpty().trim().escape(),
];

// Routes
router.get('/', postController.getAllPosts);
router.get('/user/:userId', postController.getUserPosts);
router.get('/:id', postController.getPostById);
router.post('/', 
  authMiddleware.verifyToken,
  uploadMiddleware.single('image'),
  postValidation,
  postController.createPost
);
router.put('/:id',
  authMiddleware.verifyToken,
  uploadMiddleware.single('image'),
  postValidation,
  postController.updatePost
);
router.delete('/:id',
  authMiddleware.verifyToken,
  postController.deletePost
);

// Like/Unlike routes
router.post('/:id/like', authMiddleware.verifyToken, postController.likePost);
router.delete('/:id/like', authMiddleware.verifyToken, postController.unlikePost);

// Comment routes
router.post('/:id/comments',
  authMiddleware.verifyToken,
  body('content').notEmpty().trim().escape(),
  postController.addComment
);
router.delete('/:id/comments/:commentId',
  authMiddleware.verifyToken,
  postController.deleteComment
);

// Media routes
router.post(
  '/:id/media',
  authMiddleware.verifyToken,
  uploadMiddleware.array('media', 10), // up to 10 files
  postController.uploadMedia
);

// Share routes
router.post('/:id/share', authMiddleware.verifyToken, postController.sharePost);
router.get('/:id/shares', authMiddleware.verifyToken, postController.getPostShares);

// Hashtag feed endpoint
router.get('/hashtags/:name/posts', postController.getPostsByHashtag);

module.exports = router; 