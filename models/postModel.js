const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = mongoose.Schema(
  {
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
      //required: [true, 'Please upload a post image'],
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

// Document middleware => save slug
postSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { trim: true });
  next();
});

// postSchema.pre(/^find/, function (next) {
//   this.find({ state: { $eq: 'approved' } });
//   next();
// });

postSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'author',
    select: '-__v -passwordChangetAt',
  });
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
    console.log(post.commentsCounter);
    await Post.findByIdAndUpdate(postId, {
      commentsCounter: post.commentsCounter * 1 + 1,
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
