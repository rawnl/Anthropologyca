const express = require('express');
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(commentController.setUserPostIds, commentController.getAllComments)
  .post(commentController.setUserPostIds, commentController.createComment);

// Add some restrictions to delete comment by admin and the same user
router
  .route('/:id')
  .get(commentController.getComment)
  .patch(commentController.isAuthorized, commentController.updateComment)
  .delete(commentController.isAuthorized, commentController.deleteComment);

module.exports = router;
