const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const postController = require('../controllers/postController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protected routes
router.use(authController.protect);

router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMyPassword', authController.updatePassword);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

router.get('/my-favorite-posts', postController.getUserFavoritePosts);

// Restricted Routes - Admins & Moderators
router.use(authController.restrictTo('moderator', 'admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router.get('/my-posts', postController.getUserPosts);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
