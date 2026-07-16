const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

/**
 * One row per (notice, parent) — a notice is broadcast to many parents, so
 * acknowledgement cannot live as a flag on the notice itself the way
 * DiaryEntry.isReadByParent does (that field is shared, so one parent reading a
 * class-wide entry marks it read for everybody).
 *
 * The unique index makes acknowledging twice a no-op rather than a duplicate,
 * which lets the endpoint stay idempotent.
 */
const noticeAcknowledgementSchema = new mongoose.Schema(
  {
    noticeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notice', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    acknowledgedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'noticeAcknowledgements' }
);

noticeAcknowledgementSchema.plugin(auditPlugin);

noticeAcknowledgementSchema.index({ noticeId: 1, userId: 1 }, { unique: true });
// Drives the "which of these notices have I acknowledged?" lookup on the list screen
noticeAcknowledgementSchema.index({ userId: 1, schoolId: 1 });

module.exports = mongoose.model('NoticeAcknowledgement', noticeAcknowledgementSchema);
