const mongoose = require('mongoose');

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

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
