const Comment = require('../models/CommentModel');
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

  if (comment.user.id !== req.user.id)
    return next(
      new AppError('You are not authorized to perform this action', 403)
    );
  next();
});

exports.createComment = factory.createOne(Comment);
exports.getComment = factory.getOne(Comment);
exports.updateComment = factory.updateOne(Comment);
exports.deleteComment = factory.deleteOne(Comment);
exports.getAllComments = factory.getAll(Comment);
