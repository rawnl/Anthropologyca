const express = require('express');
const authController = require('../controllers/authController');
const notificationController = require('../controllers/notificationController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.route('/').get(notificationController.getUsersNotifications);
router.route('/:id').patch(notificationController.markNotificationAsRead);
// .post(likeController.setUserPostIds, likeController.likePost)
// .delete(likeController.setLikeId, likeController.unlikePost);

module.exports = router;
