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

const connection = mongoose.connection;

const { sendNotification } = require('../utils/socket-io');

// Create GridFS Stream
let gfs, gridfsBucket;
connection.once('open', () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(connection.db, {
    bucketName: 'usersPhotos',
  });
  gfs = Grid(connection.db, mongoose.mongo);
  gfs.collection('usersPhotos');
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
          bucketName: 'usersPhotos',
        });

        uploadStream.end(file.buffer);
        uploadStream.once('finish', () => {
          req.body.photo = uploadStream.filename.filename;

          resolve({ filename: filename, bucketName: 'usersPhotos' });
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

exports.uploadUserPhoto = upload.single('photo');

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
  const doc = await gfs.files.findOne({
    filename: req.params.filename,
  });

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

exports.deleteUserPhoto = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // There is no old photo to be deleted
  if (user.photo === 'default.jpg') {
    return next();
  }

  const image = await gfs.files.findOne({ filename: user.photo });

  if (!image) {
    return next(new AppError('No document found.', 404));
  }

  gridfsBucket.delete(image._id, function (err) {
    return next(new AppError("Couldn't remove the photo", 500));
  });

  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates.', 400));
  }

  const filteredBody = filterObj(req.body, 'name', 'email', 'bio', 'photo');
  if (req.file) filteredBody.photo = req.file.filename;

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

exports.createUser = factory.createOne(User);
exports.getUser = factory.getOne(User);
// exports.updateUser = factory.updateOne(User);
// exports.deleteUser = factory.deleteOne(User);
exports.getAllUsers = factory.getAll(User);
