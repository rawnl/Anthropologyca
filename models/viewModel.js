const mongoose = require('mongoose');
const Post = require('./postModel');

const viewSchema = mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  isViewed: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

viewSchema.index({ user: 1, post: 1 }, { unique: true });

viewSchema.pre('save', async function (next) {
  await Post.increaseCounter(this.post, 'viewsCounter');
  next();
});

const View = mongoose.model('View', viewSchema);

module.exports = View;
