const express = require('express');
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/post/:slug').get(postController.getPostBySlug);

router
  .route('/')
  .get(postController.getAllPosts)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    postController.setAuthor,
    postController.createPost
  );

router.use(authController.protect);
router.use(authController.restrictTo('admin', 'moderator'));

router
  .route('/:id')
  .get(postController.getPost)
  .patch(postController.setPostSlug, postController.updatePost)
  .delete(postController.deletePost);

module.exports = router;
