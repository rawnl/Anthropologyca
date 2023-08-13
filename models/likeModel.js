const mongoose = require('mongoose');
const Post = require('./postModel');

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
    default: true,
  },
});

likeSchema.index({ user: 1, post: 1 }, { unique: true });

likeSchema.pre('save', async function (next) {
  await Post.increaseCounter(this.post, 'likesCounter');
  next();
});

likeSchema.pre('findOneAndDelete', async function (next) {
  const like = await Like.findById(this.getQuery()._id);
  await Post.decreaseCounter(like.post, 'likesCounter');
  next();
});

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
