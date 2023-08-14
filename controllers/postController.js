const Post = require('../models/postModel');
const {
  createOne,
  getOne,
  updateOne,
  deleteOne,
} = require('../controllers/handlerFactory');
const catchAsync = require('../utils/catchAsync');
const arslugify = require('arslugify');
const AppError = require('../utils/appError');
const Like = require('../models/likeModel');
const APIFeatures = require('../utils/apiFeatures');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload only images', 404), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadPostImage = upload.fields([{ name: 'coverImage', maxCount: 1 }]);

exports.resizePostImage = catchAsync(async (req, res, next) => {
  if (!req.files.coverImage) return next();

  req.body.coverImage = `post-cover-${
    req.params.id ? req.params.id : ''
  }-${Date.now()}.jpeg`;

  await sharp(req.files.coverImage[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/posts/${req.body.coverImage}`);

  next();
});

exports.setAuthor = (req, res, next) => {
  req.body.author = req.user.id;
  next();
};

exports.setPostSlug = (req, res, next) => {
  if (req.body.title) req.body.slug = arslugify(req.body.title);
  next();
};

exports.isAuthorized = catchAsync(async (req, re, next) => {
  const post = await Post.findById(req.params.id);
  if (post.author !== req.user.id && req.user.role !== 'admin')
    return next(
      new AppError('You are not authorized to perform this action', 403)
    );
  next();
});

exports.getPostBySlug = catchAsync(async (req, res, next) => {
  let query = Post.findOne({ slug: { $eq: req.params.slug } }).populate({
    path: 'comments',
    select: ['user', 'comment', 'createdAt'],
  });

  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found.', 404));
  }

  if (doc.author !== req.user.id) {
    await Post.increaseCounter(doc.id, 'viewsCounter');
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
  let likedPosts = await Like.find({ user: req.user.id }).select('post');
  likedPosts = likedPosts.map((el) => el.post);

  const posts = await Post.find({ _id: { $in: likedPosts } });

  res.status(200).json({
    status: 'success',
    data: posts,
  });
});

exports.getAllPosts = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.user.role !== 'admin') {
    filter = { state: { $eq: 'approved' } };
  }
  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  let docs = await features.query;

  res.status(200).json({
    status: 'success',
    requestedAt: new Date(),
    results: docs.length,
    data: {
      docs,
    },
  });
});

exports.createPost = createOne(Post);
exports.getPost = getOne(Post);
exports.updatePost = updateOne(Post);
exports.deletePost = deleteOne(Post);
