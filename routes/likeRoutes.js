const express = require('express');
const likeController = require('../controllers/likeController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .post(likeController.setUserPostIds, likeController.likePost)
  .delete(likeController.setLikeId, likeController.unlikePost);

module.exports = router;
