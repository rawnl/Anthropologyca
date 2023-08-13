const express = require('express');
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const commentController = require('../controllers/commentController');
const commentRouter = require('../routes/commentRoutes');

const router = express.Router();

// Need to be tested
router.use('/:id/comments', commentRouter);

router
  .route('/')
  .get(postController.getAllPosts)
  .post(
    authController.protect,
    authController.restrictTo('moderator', 'admin'),
    postController.setAuthor,
    postController.createPost
  );

router.route('/:slug').get(postController.getPostBySlug);

router.use(authController.protect);
router.use(authController.restrictTo('admin', 'moderator'));

router
  .route('/post/:id')
  .get(postController.getPost)
  .patch(postController.setPostSlug, postController.updatePost)
  .delete(commentController.deleteRelatedComments, postController.deletePost);

module.exports = router;
