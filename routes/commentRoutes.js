const express = require('express');
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(commentController.getAllComments)
  .post(commentController.setUserPostIds, commentController.createComment);

router
  .route('/:id')
  .get(commentController.getComment)
  .patch(commentController.isAuthorized, commentController.updateComment)
  .delete(commentController.isAuthorized, commentController.deleteComment);

module.exports = router;
