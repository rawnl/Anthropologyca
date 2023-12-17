const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const { notify } = require('../utils/socket-io');

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    // Testing realtime notification -> to be refactored
    notify(
      'new-content',
      `Added New Post By ${doc.author} Entitled :  ${doc.title} `
    );

    res.status(200).json({
      status: 'success',
      data: { data: doc },
    });
  });

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

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidator: true,
    });

    if (!doc) {
      return next(new AppError('No document found to be updated', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found to be deleted', 404));
    }

    res.status(200).json({
      status: 'success',
      data: null,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};

    // For comments
    if (req.params.postId) filter = { post: req.params.postId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    let docs = await features.query;

    // Rendering only users if the logged in user is moderator
    if (
      req.originalUrl === '/users/' &&
      req.user &&
      req.user.role === 'moderator'
    ) {
      docs = docs.filter((el) => el.role === 'user');
    }

    res.status(200).json({
      status: 'success',
      requestedAt: new Date(),
      results: docs.length,
      data: {
        docs,
      },
    });
  });
