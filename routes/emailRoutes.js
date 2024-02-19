const express = require('express');
const authController = require('../controllers/authController');
const emailController = require('../controllers/emailController');

const router = express.Router();

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    emailController.getEmails
  )
  .post(emailController.handleSendEmail);
router
  .route('/:id')
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    emailController.deleteEmail
  );

module.exports = router;
