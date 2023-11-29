const express = require('express');
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const commentController = require('../controllers/commentController');
const commentRouter = require('./commentRoutes');
const likeController = require('../controllers/likeController');
const likeRouter = require('./likeRoutes');

const router = express.Router();

// Need to be tested
router.use('/:postId/comments', commentRouter);
router.use('/:postId/likes', likeRouter);

router.route('/post-image/:filename').get(postController.getPostImage);

router
  .route('/post-image')
  .post(postController.uploadPostImage, postController.setImgURL);

router
  .route('/')
  .get(postController.getAllPosts) //authController.protect,
  .post(
    authController.protect,
    authController.restrictTo('moderator', 'admin'),
    postController.uploadPostImage,
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
    postController.uploadPostImage,
    postController.deletePostImage,
    postController.setPostSlug,
    postController.updatePost
  )
  .delete(
    postController.isAuthorized,
    commentController.deleteRelatedComments,
    likeController.deleteRelatedLikes,
    postController.deletePostImage,
    postController.deletePost
  );

module.exports = router;
