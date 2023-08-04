const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, 'المقال يجب أن يحتوي على عنوان'],
    unique: true,
    trim: true,
    maxLength: [70, 'عنوان المقال لا يجب أن يتعدى 70 حرفا'],
    minLength: [20, 'عنوان المقال يجب أن لا يقل عن 20 حروف'],
  },
  slug: String,
  coverImage: {
    type: String,
    required: [true, 'الرجاء تحميل صورة للمقال'],
  },
  body: {
    type: String,
    trim: true,
    required: [true, 'الرجاء إضافة نص المقال'],
    minLength: [1500, 'نص المقال يجب أن لا يقل عن 1500 حرف'],
  },
  tags: [mongoose.Schema.Types.ObjectId],
  summary: {
    type: String,
    required: [true, 'المقال يجب أن يحتوي على ملخص'],
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

const Post = mongoose.Model('Post', postSchema);

module.exports = Post;
