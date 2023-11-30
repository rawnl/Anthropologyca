const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const Post = require('../models/postModel');
const {
  createOne,
  getOne,
  updateOne,
  deleteOne,
  getAll,
} = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const arslugify = require('arslugify');
const AppError = require('../utils/appError');
const Like = require('../models/likeModel');
const APIFeatures = require('../utils/apiFeatures');
const multer = require('multer');

const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const stream = require('stream');

const connection = mongoose.connection;

// Create GridFS Stream
let gfs, gridfsBucket;
connection.once('open', () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(connection.db, {
    bucketName: 'uploads',
  });
  gfs = Grid(connection.db, mongoose.mongo);
  gfs.collection('uploads');
});
// WORKS FINE - UPLOAD & DELETE (NB: 2 COPIES [0|....])
const storage = new GridFsStorage({
  url: connection.client.s.url,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buff) => {
        if (err) {
          return reject(new AppError(err.message, 500));
        }
        const filename =
          buff.toString('hex') + Date.now() + path.extname(file.originalname);

        const uploadStream = gridfsBucket.openUploadStream({
          filename: filename,
          bucketName: 'uploads',
        });

        uploadStream.end(file.buffer);
        uploadStream.once('finish', () => {
          req.body.coverImage = uploadStream.filename.filename;
          // For other images :
          // req.body.filename = uploadStream.filename.filename;

          resolve({ filename: filename, bucketName: 'uploads' });
        });

        // Handle errors
        uploadStream.on('error', (err) => {
          return reject(new AppError(err.message, 500));
        });
      });
    });
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload only images', 404), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: multerFilter,
});

exports.setImgURL = (req, res, next) => {
  if (!req.body.coverImage) {
    return new AppError('Internal Server Error', 500);
  }

  res.status(200).json({
    status: 'success',
    data: {
      filename: req.body.coverImage,
    },
  });
};

exports.uploadPostImage = upload.fields([{ name: 'image', maxCount: 1 }]);

exports.getPostImage = catchAsync(async (req, res, next) => {
  const doc = await gfs.files.findOne({ filename: req.params.filename });

  if (!doc) {
    return next(new AppError('No document found.', 404));
  }

  const readstream = gridfsBucket.openDownloadStream(doc._id);
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  readstream.pipe(res);

  readstream.on('error', (err) => {
    return next(new AppError('Internal Server Error', 500));
  });
});

exports.deletePostImage = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  const image = await gfs.files.findOne({ filename: post.coverImage });

  if (!image) {
    return next(new AppError('No document found.', 404));
  }

  gridfsBucket.delete(image._id, function (err) {
    console.log(err);
    return next(new AppError("Couldn't remove the file", 500));
  });

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

exports.getPosts = catchAsync(async (req, res, next) => {
  // let filter = {};
  // if (req.user.role !== 'admin') {
  //   filter = { state: { $eq: 'approved' } };
  // }
  let filter = { state: { $eq: 'approved' } };
  const features = new APIFeatures(Post.find(filter), req.query)
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

const filterObj = (obj, ...allowedFields) => {
  const filteredObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      filteredObj[el] = obj[el];
    }
  });
  return filteredObj;
};

exports.updatePostState = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const filteredBody = filterObj(req.body, 'state');
  console.log(filteredBody);
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      post: updatedPost,
    },
  });
});

exports.createPost = createOne(Post);
exports.getPost = getOne(Post);
exports.updatePost = updateOne(Post);
exports.deletePost = deleteOne(Post);
exports.getAllPosts = getAll(Post);
