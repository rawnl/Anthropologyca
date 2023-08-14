const Comment = require('../models/CommentModel');
const factory = require('./handlerFactory');

exports.setUserPostIds = (req, res, next) => {
  if (!req.body.post) req.body.post = req.params.postId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.deleteRelatedComments = async (req, res, next) => {
  await Comment.deleteMany({ post: { $eq: req.params.id } });
  next();
};

exports.createComment = factory.createOne(Comment);
exports.getComment = factory.getOne(Comment);
exports.updateComment = factory.updateOne(Comment);
exports.deleteComment = factory.deleteOne(Comment);
exports.getAllComments = factory.getAll(Comment);
