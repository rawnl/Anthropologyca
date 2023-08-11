const mongoose = require('mongoose');
const Post = require('../models/postModel');

const commentSchema = mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
    required: [true, 'A comment should belong to a post'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A comment should belong to created by a user'],
  },
  comment: {
    type: String,
    required: [true, `Comment should not be empty`],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  restricted: {
    type: Boolean,
    default: false,
    select: false,
  },
});

commentSchema.pre('save', async function (next) {
  await Post.increaseCounter(this.post, 'commentsCounter');
  next();
});

commentSchema.pre('findOneAndDelete', async function (next) {
  const comment = await Comment.findById(this.getQuery()._id);
  await Post.decreaseCounter(comment.post, 'commentsCounter');
  next();
});

commentSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
