const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  company: { type: String },
  role: { type: String, enum: ['Valuer', 'Admin'], default: 'Valuer' },
  accountStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },
  subscriptionStatus: { type: String, enum: ['Free', 'Professional'], default: 'Free' },
  savedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  lastActive: { type: Date, default: null },
  totalSessionTime: { type: Number, default: 0 } // Accumulated session time in minutes
});

// User model without pre-save hook
module.exports = mongoose.model('User', UserSchema);
