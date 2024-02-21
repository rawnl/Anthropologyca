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

  sent_at: { type: Date, default: Date.now() },

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

  resolved_by: { type: mongoose.Schema.ObjectId, ref: 'User' },

  replyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Mail',
  },

  repliedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'Mail',
  },
});

mailSchema.pre('save', function (next) {
  // Common attributes
  const commonAttributes = {
    name: this.name,
    from: this.from,
    subject: this.subject,
    body: this.body,
    // sent_at: this.sent_at,
    type: this.type,
  };

  // Attributes specific to inbox type
  const inboxAttributes = {
    seen_by: this.type === 'inbox' ? this.seen_by : undefined,
    isResolved: this.type === 'inbox' ? this.isResolved : undefined,
    resolved_at: this.type === 'inbox' ? this.resolved_at : undefined,
    resolved_by: this.type === 'inbox' ? this.resolved_by : undefined,
    replyId: this.type === 'inbox' ? this.replyId : undefined,
  };

  // Attributes specific to outbox type
  const outboxAttributes = {
    repliedTo: this.type === 'outbox' ? this.to : undefined,
  };

  // Merge all attributes
  const allAttributes = Object.assign(
    {},
    commonAttributes,
    inboxAttributes,
    outboxAttributes
  );

  // Set the merged attributes to the document
  this.set(allAttributes);

  next();
});

mailSchema.pre('findOneAndUpdate', function (next) {
  if (this._update.resolved_by) {
    this.set({ isResolved: true });
    this.set({ resolved_at: Date.now() });
  }
  next();
});

const Mail = mongoose.model('Mail', mailSchema);

module.exports = Mail;
