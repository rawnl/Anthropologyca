const Like = require('../models/likeModel');
const { createOne, deleteOne } = require('./handlerFactory');

exports.setUserPostIds = (req, res, next) => {
  if (!req.body.post) req.body.post = req.params.postId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.likePost = createOne(Like);
exports.unlikePost = deleteOne(Like);
// exports.getLikes = factory.getAll(Like);
