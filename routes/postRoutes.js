const express = require('express');
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const commentController = require('../controllers/commentController');
const commentRouter = require('./commentRoutes');
const likeController = require('../controllers/likeController');
const likeRouter = require('./likeRoutes');

const router = express.Router();

// Need to be tested
router.use('/:PostId/comments', commentRouter);
router.use('/:PostId/likes', likeRouter);

router
  .route('/')
  .get(authController.protect, postController.getAllPosts)
  .post(
    authController.protect,
    authController.restrictTo('moderator', 'admin'),
    postController.setAuthor,
    postController.createPost
  );

router
  .route('/:slug')
  .get(authController.protect, postController.getPostBySlug);

router.use(authController.protect);
router.use(authController.restrictTo('admin', 'moderator'));

router
  .route('/post/:id')
  .get(postController.getPost)
  .patch(
    postController.isAuthorized,
    postController.setPostSlug,
    postController.updatePost
  )
  .delete(
    postController.isAuthorized,
    commentController.deleteRelatedComments,
    likeController.deleteRelatedLikes,
    postController.deletePost
  );

module.exports = router;
