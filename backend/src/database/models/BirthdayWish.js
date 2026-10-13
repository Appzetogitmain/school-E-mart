const mongoose = require('mongoose');

const birthdayWishSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  recipientType: { type: String, enum: ['student', 'teacher'], required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  dateKey: { type: String, required: true },
  senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['sending', 'partial', 'sent'], default: 'sending' },
  deliveredUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'birthdayWishes' });

birthdayWishSchema.index(
  { schoolId: 1, recipientType: 1, recipientId: 1, dateKey: 1 },
  { unique: true }
);

module.exports = mongoose.model('BirthdayWish', birthdayWishSchema);
