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
  .post(emailController.sendEmail);

router
  .route('/:id')
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    emailController.replyEmail
  );

module.exports = router;
