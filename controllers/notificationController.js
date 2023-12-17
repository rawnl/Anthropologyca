const mongoose = require('mongoose');
const Notification = require('../models/NotificationModel');
const { createOne, getOne } = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.getUsersNotifications = catchAsync(async (req, res, next) => {
  console.log(req.user.id);
  console.log(req.params.userId);

  let filter = { receiver: req.user.id, read: false };

  const features = new APIFeatures(Notification.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  let notifications = await features.query;

  res.status(200).json({
    status: 'success',
    requestedAt: new Date(),
    results: docs.length,
    notifications,
  });
});

exports.markNotificationAsRead = catchAsync(async (req, res, next) => {
  const updatedNotification = await Notification.findByIdAndUpdate(
    req.params.id,
    { status: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      notification: updatedNotification,
    },
  });
});

exports.createNotification = createOne(Notification);
exports.getNotifications = getOne(Notification);
