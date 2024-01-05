const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  sender: { type: mongoose.Schema.ObjectId, ref: 'User' },
  receivers: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  content: String,
  type: {
    type: String,
    enum: [
      'comment',
      'like',
      'new-post',
      'approved-post',
      'rejected-post',
      'upgrade-request',
      'upgrade-request-approved',
      'upgrade-request-rejected',
      'standard',
      // new-follower, new-message, 'account-upgraded', 'connection', 'disconnection',
    ],
    default: 'standard',
  },
  read_by: [
    {
      readerId: { type: mongoose.Schema.ObjectId, ref: 'User' },
      read_at: { type: Date, default: Date.now },
    },
  ],
  created_at: { type: Date, default: Date.now },
});

// postSchema.index({ created_at: 1 });

// postSchema.pre('findOneAndUpdate', function (next) {
//   this.set({ updatedAt: Date.now() });
//   if (this._update.state && this._update.state === 'approved')
//     this.set({ publishedAt: Date.now() });
//   next();
// });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
