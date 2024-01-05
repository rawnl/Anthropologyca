const Comment = require('../models/commentModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
    console.log('all users');
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
      $unwind: {
        path: '$post',
        preserveNullAndEmptyArrays: true,
      },
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
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
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

exports.createComment = factory.createOne(Comment);
exports.getComment = factory.getOne(Comment);
exports.updateComment = factory.updateOne(Comment);
exports.deleteComment = factory.deleteOne(Comment);
// exports.getAllComments = factory.getAll(Comment);
