const mongoose = require('mongoose');

const likeSchema = mongoose.Schema({
  postId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  isLiked: {
    type: Boolean,
    default: false,
  },
});

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
