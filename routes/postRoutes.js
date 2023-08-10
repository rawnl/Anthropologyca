const express = require('express');
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(postController.getAllPosts)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    postController.setAuthor,
    postController.createPost
  );

router
  .route('/:id')
  .get(postController.getPost)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'moderator'),
    postController.setPostSlug,
    postController.updatePost
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'moderator'),
    postController.deletePost
  );

module.exports = router;
