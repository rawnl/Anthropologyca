const ObjectId = require('mongodb').ObjectId;
const Mail = require('../models/mailModel');
const Email = require('../utils/email');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getEmails = catchAsync(async (req, res, next) => {
  const filters = {
    $and: [
      { type: 'inbox' },
      {
        $or: [
          { isResolved: false },
          {
            $and: [
              { isResolved: true },
              { resolved_by: new ObjectId(req.user.id) },
            ],
          },
        ],
      },
    ],
  };

  const docs = await Mail.find(filters).populate({
    path: 'replyId',
    select: ['subject', 'body', 'type', 'sent_at'],
  });

  res.status(200).json({
    status: 'success',
    data: {
      docs,
    },
  });
});

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
    type: 'inbox',
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
      new AppError(`You can not reply to an email that does not exist`, 400)
    );

  if (originalEmail.isResolved)
    return next(new AppError(`This e-mail has already got replied to`, 400));

  if (originalEmail.type === 'outbox')
    return next(new AppError(`You can not reply to this e-mail`, 400));

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
