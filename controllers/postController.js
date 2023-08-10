const Post = require('../models/postModel');
const factory = require('../controllers/handlerFactory');
const catchAsync = require('../utils/catchAsync');
const slugify = require('slugify');

exports.setAuthor = (req, res, next) => {
  req.body.author = req.user.id;
  next();
};

exports.setPostSlug = (req, res, next) => {
  if (req.body.title) req.body.slug = slugify(req.body.title, { trim: true });
  next();
};

exports.createPost = factory.createOne(Post);
exports.getPost = factory.getOne(Post);
exports.updatePost = factory.updateOne(Post);
exports.deletePost = factory.deleteOne(Post);
exports.getAllPosts = factory.getAll(Post, true);
