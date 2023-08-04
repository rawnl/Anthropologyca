const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Email = require('../utils/email');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.Node_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // 1. Adding user to database
  const user = await User.create(req.body);

  console.log('Successfully signed up');
  console.log(user);

  // 2. Redirecting to user dashboard
  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(user, url).sendWelcomeEmail();

  createAndSendToken(user, 200, res);
});
