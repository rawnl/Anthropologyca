const Comment = require('../models/commentModel');
const Post = require('../models/postModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const { notify } = require('../utils/socket-io');

exports.setUserPostIds = (req, res, next) => {
  console.log(req.params);
  if (!req.body.post) req.body.post = req.params.postId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.deleteRelatedComments = async (req, res, next) => {
  await Comment.deleteMany({ post: { $eq: req.params.id } });
  next();
};

exports.isAuthorized = catchAsync(async (req, re, next) => {
  const comment = await Comment.findById(req.params.id);

  if (comment.user.id !== req.user.id && req.user.role !== 'admin')
    return next(
      new AppError('You are not authorized to perform this action', 403)
    );

  next();
});

exports.getAllComments = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.postId) {
    filter = { post: { $eq: req.params.postId } };
  } else {
    if (req.user.role !== 'admin') {
      return next(
        new AppError('You are not authorized to perform this action', 403)
      );
    }
  }

  const docs = await Comment.aggregate([
    {
      $match: filter,
    },
    {
      $lookup: {
        from: 'posts',
        localField: 'post',
        foreignField: '_id',
        as: 'post',
      },
    },
    {
      $unwind: '$post',
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        'post._id': 1,
        'post.title': 1,
        'user._id': 1,
        'user.name': 1,
        'user.photo': 1,
        comment: 1,
        createdAt: 1,
        restricted: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    requestedAt: new Date(),
    results: docs.length,
    data: {
      docs,
    },
  });
});

exports.createComment = catchAsync(async (req, res, next) => {
  // 01. Creating & saving the comment
  const doc = await Comment.create(req.body);

  // 02. Fetching the corresponding post's author
  const ObjectId = require('mongodb').ObjectId;
  const relatedPost = await Post.findOne(
    { _id: { $eq: new ObjectId(req.body.post) } },
    'author'
  );

  // 03. Creating & saving the notification
  const notification = await Notification.create({
    sender: req.user._id,
    receivers: [relatedPost.author._id],
    content: {
      commentId: doc._id,
    },
    type: 'comment',
  });

  // 04. Notifying the post author of the new comment
  notify(notification.type, notification);

  res.status(200).json({
    status: 'success',
    data: { data: doc },
  });
});

// exports.createComment = factory.createOne(Comment);
exports.getComment = factory.getOne(Comment);
exports.updateComment = factory.updateOne(Comment);
exports.deleteComment = factory.deleteOne(Comment);
// exports.getAllComments = factory.getAll(Comment);
