const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const lmsBookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsLesson' },
  lastPositionSec: { type: Number, default: 0, min: 0 },
}, { collection: 'lmsBookmarks', timestamps: false });

lmsBookmarkSchema.plugin(auditPlugin);

lmsBookmarkSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });
lmsBookmarkSchema.index({ userId: 1, schoolId: 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('LmsBookmark', lmsBookmarkSchema);
