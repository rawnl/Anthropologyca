const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

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

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.postId) filter = { post: req.params.postId };

    const features = new APIFeatures(Model.find(filter), req.query).filter();

    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      requestedAt: Date.now(),
      results: docs.length,
      data: {
        docs,
      },
    });
  });
