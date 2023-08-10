const mongoose = require('mongoose');

const likeSchema = mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  user: {
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
