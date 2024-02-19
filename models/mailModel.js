const mongoose = require('mongoose');
const validator = require('validator');

const mailSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'The name field is required'],
  },

  from: {
    type: String,
    required: [true, 'The e-mail field is required'],
    validate: [validator.isEmail, 'Please provide a valid e-mail address'],
  },

  to: {
    type: String,
    // required: [true, 'The e-mail field is required'],
    validate: [validator.isEmail, 'Please provide a valid e-mail address'],
  },

  subject: {
    type: String,
    required: [true, 'The e-mail subject field is required'],
    maxLength: [150, 'Subject field should contain less than 150 caracters'],
  },

  body: {
    type: String,
    trim: true,
    required: [true, 'The body field is required'],
    maxLength: [1500, 'The body must contain less than 1500 caracters'],
  },

  sent_at: { type: Date, default: Date.now },

  type: {
    type: String,
    enum: ['inbox', 'outbox'],
  },

  seen_by: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],

  isResolved: {
    type: Boolean,
    default: false,
  },

  resolved_at: {
    type: Date,
  },

  resolved_by: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],

  replyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Mail',
  },
});

const Mail = mongoose.model('Mail', mailSchema);

module.exports = Mail;
