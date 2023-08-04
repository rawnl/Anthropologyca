const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, ' الرجاء إدخال الإسم واللقب'],
  },
  email: {
    type: String,
    required: [true, 'الرجاء إدخال بريدك الإلكتروني'],
    unique: true,
    validate: [validator.isEmail, 'الرجاء إدخال عنوان بريد إلكتروني صحيح'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'الرجاء إدخال كلمة المرور'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'الرجاء تأكيد كلمة المرور'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'كلمات المرور غير متطابقة',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  bio: {
    type: String,
    maxLength: [150, 'هذا الحقل لا يجب أن يتعدى 150 حرفا'],
  },
  verified: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//  1. Document middlewares

//  1.1. Hashing the password before saving it
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

// 1.2. Setting up the passwordChangedAt field if password has changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// 2. Query Middleware

// 2.1. Retrieving only active accounts
userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
