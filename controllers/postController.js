const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const arslugify = require('arslugify');

const Post = require('../models/postModel');
const Like = require('../models/likeModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const { getOne, updateOne, deleteOne, getAll } = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

const { notify } = require('../utils/socket-io');

let gridfsBucket;

mongoose.connection.once('open', () => {
  // Create a GridFSBucket instance
  gridfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'posts.covers',
  });
});

const storage = multer.memoryStorage();

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

exports.uploadPostImage = (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // Multer error (e.g., file size exceeded)
      return next(new AppError(err.message, 400));
    } else if (err) {
      // Other errors
      return next(new AppError(err.message, 400));
    }

    if (!req.file) {
      return next(new AppError('No file provided', 400));
    }

    await uploadFileToBucket(req, res, next);
    next();
  });
};

const uploadFileToBucket = async (req, res, next) => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, buff) => {
      if (err) {
        reject(new Error(err.message));
      }

      const filename =
        buff.toString('hex') + Date.now() + path.extname(req.file.originalname);

      const uploadStream = gridfsBucket.openUploadStream(filename);

      uploadStream.end(req.file.buffer);
      uploadStream.on('finish', () => {
        req.body.coverImage = filename;
        // For other images :
        // req.body.filename = uploadStream.filename.filename;
        // resolve({ filename: filename, bucketName: 'usersPhotos' });
        next();
      });

      uploadStream.on('error', (err) => {
        next(new AppError(err.message, err.code));
      });
    });
  });
};

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

exports.getPostImage = catchAsync(async (req, res, next) => {
  const doc = await gridfsBucket
    .find({ filename: req.params.filename })
    .toArray();

  if (doc.length < 1) {
    return next(new AppError('No document found.', 404));
  }

  const readstream = gridfsBucket.openDownloadStream(doc[0]._id);
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  readstream.pipe(res);

  readstream.on('error', (err) => {
    return next(new AppError('Internal Server Error', 500));
  });
});

exports.deletePostImage = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  const images = await gridfsBucket
    .find({ filename: post.coverImage })
    .toArray();

  if (images.length < 1) {
    return next(new AppError('No document found.', 404));
  }

  gridfsBucket.delete(images[0]._id, function (err) {
    console.log(err);
    return next(new AppError("Couldn't remove the file", 500));
  });

  next();
});

exports.setAuthor = (req, res, next) => {
  req.body.author = req.user.id;
  next();
};

exports.setPostState = (req, res, next) => {
  if (req.user.role === 'admin') req.body.state = 'approved';
  next();
};

exports.setPostSlug = (req, res, next) => {
  if (req.body.title) req.body.slug = arslugify(req.body.title);
  next();
};

exports.isAuthorized = catchAsync(async (req, re, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new AppError('No document found', 404));
  }
  if (post.author.id !== req.user.id && req.user.role !== 'admin')
    return next(
      new AppError('You are not authorized to perform this action', 403)
    );
  next();
});

exports.getPostBySlug = catchAsync(async (req, res, next) => {
  const query = Post.findOne({ slug: { $eq: req.params.slug } }).populate({
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

exports.createPost = catchAsync(async (req, res, next) => {
  const doc = await Post.create(req.body);

  const ObjectId = require('mongodb').ObjectId;

  let filter = { _id: { $ne: new ObjectId(req.body.author) } };
  if (doc.state === 'under-review') {
    filter = { _id: { $ne: new ObjectId(req.body.author) }, role: 'admin' };
  }

  receivers = await User.find(filter, '_id');

  req.body.notification = {
    sender: req.body.author,
    receivers: receivers,
    content: `${doc.title} لقد تمت إضافة مقال جديد تحت عنوان `,
    type: 'new-post',
  };

  const notification = await Notification.create(req.body.notification);

  if (notification) {
    notify(notification.type, notification);
  }

  res.status(200).json({
    status: 'success',
    data: { data: doc },
  });
});

// To review - restrict when a post is published for example
exports.updatePostState = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, 'state');

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

// exports.createPost = createOne(Post);
exports.getPost = getOne(Post);
exports.updatePost = updateOne(Post);
exports.deletePost = deleteOne(Post);
exports.getAllPosts = getAll(Post);
