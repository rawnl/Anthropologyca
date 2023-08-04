const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
  postId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  content: {
    type: String,
    required: [true, ''],
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
