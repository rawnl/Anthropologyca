const Post = require('../models/postModel');
const factory = require('../controllers/handlerFactory');
const catchAsync = require('../utils/catchAsync');
const slugify = require('slugify');
const Comment = require('../models/CommentModel');
const AppError = require('../utils/appError');

exports.setAuthor = (req, res, next) => {
  req.body.author = req.user.id;
  next();
};

exports.setPostSlug = (req, res, next) => {
  if (req.body.title)
    req.body.slug = slugify(req.body.title, {
      replacement: '-',
      remove: undefined,
      lower: true,
      strict: true,
      locale: 'ar',
      trim: true,
    });
  next();
};

exports.getPostBySlug = catchAsync(async (req, res, next) => {
  let query = Post.find({ slug: { $eq: req.params.slug } }).populate({
    path: 'comments',
    select: ['user', 'comment', 'createdAt'],
  });

  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});

exports.getUserPosts = catchAsync(async (req, res, next) => {
  let query = Post.find({ author: req.user.id });

  const posts = await query;

  res.status(200).json({
    status: 'success',
    data: posts,
  });
});

exports.getUserFavoritePosts = catchAsync(async (req, res, next) => {
  const posts = await Post.find({ user: req.user.id });

  res.status(200).json({
    status: 'success',
    data: posts,
  });
});

exports.createPost = factory.createOne(Post);
exports.getPost = factory.getOne(Post);
exports.updatePost = factory.updateOne(Post);
exports.deletePost = factory.deleteOne(Post);
exports.getAllPosts = factory.getAll(Post, false);
