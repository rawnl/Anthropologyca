const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const Notification = require('../models/notificationModel');
const { getOne } = require('./handlerFactory');

exports.getUsersNotifications = catchAsync(async (req, res, next) => {
  // let filter = { receivers: req.user.id, read: false };
  let filter = { receivers: { $in: [req.user.id] } };

  const features = new APIFeatures(
    Notification.find(filter).select('-sender -receivers -read_by'),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  let docs = await features.query;

  res.status(200).json({
    status: 'success',
    requestedAt: new Date(),
    results: docs.length,
    docs,
  });
});

exports.markNotificationAsRead = catchAsync(async (req, res, next) => {
  console.log(req.user.id);
  const updatedNotification = await Notification.findByIdAndUpdate(
    req.params.id,
    { $push: { read_by: { readerId: req.user.id } } }
  ).select('-sender -receivers -read_by');

  res.status(200).json({
    status: 'success',
    data: {
      notification: updatedNotification,
    },
  });
});

exports.getNotification = getOne(Notification);
