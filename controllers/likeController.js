const Like = require('../models/likeModel');
const { createOne, deleteOne } = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.setUserPostIds = (req, res, next) => {
  if (!req.body.post) req.body.post = req.params.postId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.deleteRelatedLikes = async (req, res, next) => {
  await Like.deleteMany({ post: { $eq: req.params.id } });
  next();
};

exports.setLikeId = catchAsync(async (req, res, next) => {
  const like = await Like.findOne({
    user: req.user.id,
    post: req.params.postId,
  });
  if (!like) return next(new AppError('No document found!', 403));
  req.params.id = like.id;
  next();
});

exports.likePost = createOne(Like);
exports.unlikePost = deleteOne(Like);
// exports.getLikes = factory.getAll(Like);
