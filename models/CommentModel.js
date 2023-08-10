const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
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
