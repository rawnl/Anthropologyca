const mongoose = require('mongoose');
const arslugify = require('arslugify');

const postSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A post should have a title'],
      unique: true,
      trim: true,
      maxLength: [120, 'Title must be less than 70 caracters'],
    },
    slug: {
      type: String,
      unique: true,
    },
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
      default: 'under-review',
    },
    publishedAt: Date,
    updatedAt: Date,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A post must have an author'],
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.index({ title: 'text', summary: 'text', body: 'text' });
postSchema.index({ publishedAt: 1, downloadCounter: 1 });
postSchema.index({ slug: 1 });

postSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'post',
  localField: '_id',
});

postSchema.virtual('likes', {
  ref: 'Like',
  foreignField: 'post',
  localField: '_id',
});

postSchema.pre('save', function (next) {
  this.slug = `${Date.now()}-${arslugify(this.title)}`;
  next();
});

postSchema.post('save', function (doc, next) {
  if (this.state === 'approved') {
    this.publishedAt = this.createdAt;
  }
  next();
});

postSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'author',
    select: '-__v -passwordChangetAt',
  }).populate({
    path: 'tags',
    select: '-__v -slug',
  });
  next();
});

postSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  // if (this._update.state && this._update.state === 'approved')
  //   this.set({ publishedAt: Date.now() });
  next();
});

postSchema.pre('aggregate', function (next) {
  this.pipeline().push({
    $match: { state: { $eq: 'approved' } },
  });
  next();
});

postSchema.statics.increaseCounter = async function (postId, counter) {
  const post = await Post.findById(postId);

  if (counter === 'likesCounter')
    await Post.findByIdAndUpdate(postId, {
      likesCounter: post.likesCounter + 1,
    });

  if (counter === 'commentsCounter') {
    await Post.findByIdAndUpdate(postId, {
      commentsCounter: post.commentsCounter * 1 + 1,
    });
  }

  if (counter === 'viewsCounter') {
    await Post.findByIdAndUpdate(postId, {
      viewsCounter: post.viewsCounter * 1 + 1,
    });
  }
};
postSchema.statics.decreaseCounter = async function (postId, counter) {
  const post = await Post.findOne({ _id: postId });

  if (counter === 'likesCounter')
    await Post.findByIdAndUpdate(postId, {
      likesCounter: post.likesCounter - 1,
    });

  if (counter === 'commentsCounter')
    await Post.findByIdAndUpdate(postId, {
      commentsCounter: post.commentsCounter - 1,
    });
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
