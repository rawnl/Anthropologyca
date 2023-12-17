const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const postController = require('../controllers/postController');
const notificationRouter = require('../routes/notificationRoutes');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

router.use('/:userId/notifications', notificationRouter);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.get('/user-photo/:filename', userController.getUserPhoto);

// Protected routes
router.use(authController.protect);

router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMyPassword', authController.updatePassword);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.deleteUserPhoto,
  userController.updateMe
);
router.delete(
  '/deleteMe',
  // userController.deleteUserPhoto, // the delete function deactivates the account only
  userController.deleteMe
);

router.get('/my-favorite-posts', postController.getUserFavoritePosts);

router.get(
  '/my-posts',
  authController.restrictTo('admin', 'moderator'),
  postController.getUserPosts
);

// Restricted Routes - Admins
router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.upgradeUserAccount);
// .patch(userController.updateUser)
// .delete(userController.deleteUser);

module.exports = router;
