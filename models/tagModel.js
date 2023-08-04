const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');

const tagSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الوسام يجب أن يتضمن إسم'],
    unique: true,
    validate: [
      validator.isAlpha(str[(locale = 'ar')]),
      'إسم الوسام يجب أن يكون باللغة العربية',
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
