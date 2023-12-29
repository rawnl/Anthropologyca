const mongoose = require('mongoose');
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const factory = require('./handlerFactory');

const { sendNotification } = require('../utils/socket-io');

const { GridFSBucket } = require('mongodb');

let gridfsBucket;
mongoose.connection.once('open', () => {
  // Create a GridFSBucket instance
  gridfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'usersPhotos',
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
const uploadUserPhoto = (req, res, next) => {
  upload.single('photo')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // Multer error (e.g., file size exceeded)
      return next(new AppError(err.message, 400));
    } else if (err) {
      // Other errors
      return next(new AppError(err.message, 400));
    }

    // !req.file
    if (req.file) {
      // return next(new AppError('No file provided', 400));
      await uploadFileToBucket(req, res, next);
    }

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
        req.body.photo = filename;
        // resolve({ filename: filename, bucketName: 'usersPhotos' });
        next();
      });

      uploadStream.on('error', (err) => {
        // reject(new Error(err.message));
        next(new AppError(err.message, err.code));
      });
    });
  });
};

exports.uploadUserPhoto = uploadUserPhoto;

const filterObj = (obj, ...allowedFields) => {
  const filteredObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      filteredObj[el] = obj[el];
    }
  });
  return filteredObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUserPhoto = catchAsync(async (req, res, next) => {
  console.log(req.params.filename);
  const doc = await gridfsBucket
    .find({
      filename: req.params.filename,
    })
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

exports.deleteUserPhoto = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!req.body.photo || user.photo === 'default.jpg') {
    return next();
  }

  let images = await gridfsBucket.find({ filename: user.photo }).toArray();
  const image = images[0];

  //!image
  if (image) {
    gridfsBucket.delete(image._id, function (err) {
      return next(new AppError("Couldn't remove the photo", 500));
    });
    // return next(new AppError('No document found. --deleteUserPhoto', 404));
  }

  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates.', 400));
  }

  const filteredBody = filterObj(req.body, 'name', 'email', 'bio', 'photo');

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // Testing realtime notifications => to be deleted
  sendNotification(`${updatedUser._id}`, 'success-update', 'Successful update');

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.upgradeUserAccount = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, 'role');

  const updatedUser = await User.findByIdAndUpdate(
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
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  let docs = await User.aggregate([
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'author',
        as: 'posts',
      },
    },
  ])
    .exec()
    .then((usersWithPosts) => {
      // console.log(usersWithPosts);
      return usersWithPosts;
    })
    .catch((err) => {
      // console.error(err);
      return next(new AppError(err.message, err.code));
    });

  res.status(200).json({
    status: 'success',
    requestedAt: new Date(),
    results: docs.length,
    data: {
      docs,
    },
  });
});

exports.createUser = factory.createOne(User);
exports.getUser = factory.getOne(User);
// exports.updateUser = factory.updateOne(User);
// exports.deleteUser = factory.deleteOne(User);
// exports.getAllUsers = factory.getAll(User); // modified
