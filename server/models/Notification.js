const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['pending', 'approved', 'rejected', 'info'], default: 'info' },
  read: { type: Boolean, default: false },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
