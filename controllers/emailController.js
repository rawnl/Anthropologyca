const catchAsync = require('../utils/catchAsync');
const Mail = require('../models/mailModel');
const Email = require('../utils/email');

const { deleteOne, getAll } = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getEmails = getAll(Mail);

exports.sendEmail = catchAsync(async (req, res, next) => {
  if (
    !req.body.name ||
    !req.body.email ||
    !req.body.subject ||
    !req.body.message
  ) {
    return next(new AppError('Empty field(s)', 400));
  }

  const email = {
    name: req.body.name,
    from: req.body.email,
    subject: req.body.subject,
    body: req.body.message,
  };

  const doc = await Mail.create(email);

  // Send Thank You Email
  const url = `${req.protocol}://${req.get('host')}/`;

  const user = {
    name: email.name,
    email: email.from,
  };

  await new Email(user, url).sendThankYouEmail();

  res.status(200).json({
    status: 'success',
  });
});

exports.replyEmail = catchAsync(async (req, res, next) => {
  if (!req.body.subject || !req.body.message) {
    return next(new AppError('BAD REQUEST', 400));
  }

  // Check if the e-mail exists
  const originalEmail = await Mail.findById(req.params.id).populate(
    '_id name from isResolved'
  );

  if (!originalEmail)
    return next(
      new AppError(`You can not reply to an email that does not exist`, 404)
    );

  if (originalEmail.isResolved)
    return next(new AppError(`This e-mail has already got replied to`, 404));

  // 01. Save reply e-mail to db
  const replyEmail = {
    name: req.user.name,
    from: process.env.EMAIL_FROM,
    subject: req.body.subject,
    body: req.body.message,
    type: 'outbox',
    repliedTo: originalEmail._id,
  };

  const replyDoc = await Mail.create(replyEmail);

  // 02. Send the reply e-mail
  const url = `${req.protocol}://${req.get('host')}/`;
  const user = {
    name: originalEmail.name,
    email: originalEmail.from,
  };

  await new Email(user, url).sendReplyEmail(replyDoc.subject, replyDoc.body);

  // 03.Update the original e-mail to be resolved
  const updatedEmail = await Mail.findByIdAndUpdate(
    originalEmail._id,
    {
      resolved_by: req.user._id,
      replyId: replyDoc._id,
    },
    {
      new: true,
      runValidator: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      email: replyDoc,
    },
  });
});

// exports.deleteEmail = deleteOne(Email);
