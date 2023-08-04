const express = require('express');
const bodyParser = require('body-parser');
const userRouter = require('./routes/userRoutes');

const app = express();

// Body parser
app.use(
  express.json({
    limit: '10kb',
  })
);

// 1. Middlewares
app.use((req, res, next) => {
  console.log('This is a middleware');
  next();
});

// 2. Routes
app.use('/users', userRouter);

module.exports = app;
