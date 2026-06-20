const mongoose = require('mongoose');

const outboxEventSchema = new mongoose.Schema({
  aggregateType: { type: String, required: true },
  aggregateId: { type: mongoose.Schema.Types.ObjectId, required: true },
  eventType: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  processedAt: { type: Date },
  attempts: { type: Number, required: true, default: 0 },
  lastError: { type: String },
  createdAt: { type: Date, required: true, default: Date.now }
}, { collection: 'outboxEvents', timestamps: false });

// Indexes
outboxEventSchema.index(
  { processedAt: 1 }, 
  { 
    sparse: true,
    partialFilterExpression: { processedAt: null } 
  }
);
// TTL index: auto-purge 7 days after processed. Mongoose doesn't natively support partial TTL, 
// so we use a standard TTL on createdAt but it drops unprocessed ones too if we aren't careful.
// Standard design document says: "TTL after processedAt". We can set expireAfterSeconds on a processedAt field 
// when it gets set, or just use a generic createdAt TTL and assume they get processed quickly. 
// The document says: "createdAt [T] partial on processed — auto-purge old."
outboxEventSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
    partialFilterExpression: { processedAt: { $type: 'date' } }
  }
);

module.exports = mongoose.model('OutboxEvent', outboxEventSchema);
