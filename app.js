const express = require('express');
const bodyParser = require('body-parser');
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const commentRouter = require('./routes/commentRoutes');

const app = express();

// Body parser
app.use(
  express.json({
    limit: '10kb',
  })
);

// Routes
app.use('/users', userRouter);
app.use('/posts', postRouter);
app.use('/comments', commentRouter);

module.exports = app;
