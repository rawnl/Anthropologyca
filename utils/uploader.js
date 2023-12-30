const mongoose = require('mongoose');
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const AppError = require('../utils/appError');

const connection = mongoose.connection;

// Create GridFS Stream
let gfs, gridfsBucket;
connection.once('open', () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(connection.db);
  gfs = Grid(connection.db, mongoose.mongo);
});

exports.createMulterMiddleware = (bucketName) => {
  if (!gfs) {
    console.log('gfs not initialized !');
    gfs.collection(bucketName);
    console.log(gfs);
  }
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
            bucketName: bucketName,
          });

          uploadStream.end(file.buffer);
          uploadStream.once('finish', () => {
            req.body.filename = uploadStream.filename.filename;
            resolve({ filename: filename, bucketName: bucketName });
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

  return multer({
    storage: storage,
    fileFilter: multerFilter,
  });
};
