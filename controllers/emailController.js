const nodemailer = require('nodemailer');
// const { check, validationResult } = require('express-validator');

const catchAsync = require('../utils/catchAsync');
const Mail = require('../models/mailModel');
const Email = require('../utils/email');

const { deleteOne, getAll } = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getEmails = getAll(Email);

exports.deleteEmail = deleteOne(Email);

exports.handleSendEmail = catchAsync(async (req, res, next) => {
  // check('name').notEmpty().withMessage('Name is required');
  // check('email').isEmail().withMessage('Invalid email address');
  // check('subject').notEmpty().withMessage('Subject is required');
  // check('message').notEmpty().withMessage('Body is required');

  // const errors = validationResult(req.body);

  // console.log('errors : ' + errors);

  // if (!errors.isEmpty()) {
  //   return next(new AppError(errors.mapped(), 400));
  // }

  if (
    !req.body.name ||
    !req.body.email ||
    !req.body.subject ||
    !req.body.message
  ) {
    console.log('errorroorororo');
    return next(new AppError('Empty field(s)', 400));
  }

  const email = {
    name: req.body.name,
    from: req.body.email,
    subject: req.body.subject,
    body: req.body.message,
  };

  console.log(req.body.email);
  console.log(req.body.name);
  console.log(req.body.subject);
  console.log(req.body.message);

  console.log('email:' + email);

  const doc = await Mail.create(email);
  console.log('email saved');
  console.log(doc);

  // Send the welcome email
  const url = `${req.protocol}://${req.get('host')}/`;

  const user = {
    name: email.name,
    email: email.from,
  };

  await new Email(user, url).sendThankYouEmail();

  console.log('email sent');

  res.status(200).json({
    status: 'success',
  });
});
