const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A post should have a title'],
    unique: true,
    trim: true,
    maxLength: [70, 'Title must be less than 70 caracters'],
    minLength: [20, 'Title must be more than 20 caracters'],
  },
  slug: String,
  coverImage: {
    type: String,
    required: [true, 'Please upload a post image'],
  },
  body: {
    type: String,
    trim: true,
    required: [true, 'A post must have a body'],
    minLength: [1500, 'A post must contain at least of 1500 caracters'],
  },
  tags: [mongoose.Schema.Types.ObjectId],
  summary: {
    type: String,
    required: [true, 'A post must have a summary'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  state: {
    type: String,
    enum: ['approved', 'rejected', 'under-review'],
    select: false,
  },
  publishedAt: Date,
  updatedAt: Date,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  likesCounter: {
    type: Number,
    default: 0,
  },
  commentsCounter: {
    type: Number,
    default: 0,
  },
  viewsCounter: {
    type: Number,
    default: 0,
  },
  downloadCounter: {
    type: Number,
    default: 0,
  },
});

// Document middleware => save slug
postSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { trim: true });
  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
