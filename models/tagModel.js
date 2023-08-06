const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');

const tagSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tag must have a name'],
    unique: true,
    validate: [
      validator.isAlpha(str[(locale = 'ar')]),
      'Tag name should be in arabic',
    ],
  },
  slug: String,
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});

// Document middleware => saving slug
tagSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { trim: true });
  next();
});

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
