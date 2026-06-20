const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const userSchema = new mongoose.Schema({
  refId: { 
    type: String, 
    required: true,
    match: /^SEM-(P|ADM|TCH|VEN|SADM)-[A-Z0-9]{4,8}$/
  },
  role: {
    type: String,
    enum: ['parent', 'school', 'teacher', 'vendor', 'admin'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'pending_approval', 'suspended', 'inactive'],
    required: true,
    default: 'active'
  },
  name: { type: String, required: true, maxlength: 80 },
  email: { 
    type: String,
    match: /^\S+@\S+\.\S+$/
  },
  phone: { 
    type: String, 
    required: true,
    match: /^[6-9]\d{9}$/
  },
  passwordHash: { type: String },
  passwordAlgo: { 
    type: String,
    enum: ['argon2id', 'bcrypt'],
    default: 'argon2id'
  },
  emailVerifiedAt: { type: Date },
  phoneVerifiedAt: { type: Date },
  lastLoginAt: { type: Date },
  loginCount: { type: Number, required: true, default: 0 },
  mfaEnabled: { type: Boolean, required: true, default: false },
  roleScopes: [{ type: String }],
  tenantSchoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  defaultLocale: { type: String, required: true, default: 'en-IN' }
}, { collection: 'users' });

// Plugins
userSchema.plugin(auditPlugin);
userSchema.plugin(softDeletePlugin);

// Indexes
userSchema.index({ refId: 1 }, { unique: true });
userSchema.index(
  { email: 1 }, 
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { email: { $type: 'string' } }
  }
);
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, status: 1, 'audit.createdAt': -1 });
userSchema.index({ tenantSchoolId: 1, role: 1 });
userSchema.index({ name: 'text', email: 'text', phone: 'text' });
// Soft delete compound index
userSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('User', userSchema);
