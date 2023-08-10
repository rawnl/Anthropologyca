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

exports.getPostBySlug = catchAsync(async (req, res, next) => {
  let query = Post.find({ slug: { $eq: req.params.slug } });
  // .populate({
  //   path: 'comments',
  //   select: ['user', 'comment', 'createdAt'],
  // });

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

exports.createPost = factory.createOne(Post);
exports.getPost = factory.getOne(Post);
exports.updatePost = factory.updateOne(Post);
exports.deletePost = factory.deleteOne(Post);
exports.getAllPosts = factory.getAll(Post, true);
