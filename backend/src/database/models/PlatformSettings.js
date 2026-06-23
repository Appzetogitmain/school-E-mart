const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'default' },
    general: {
      platformName: { type: String, default: 'School E-Mart' },
      logoMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
      contact: {
        email: { type: String },
        phone: { type: String },
        address: { type: String },
      },
      timezone: { type: String, default: 'Asia/Kolkata' },
      currency: { type: String, default: 'INR' },
      language: { type: String, default: 'en-IN' },
    },
    marketplace: {
      commissionPercent: { type: Number, default: 10 },
      vendorAutoApproval: { type: Boolean, default: false },
      productApprovalRequired: { type: Boolean, default: true },
    },
    orders: {
      returnWindowDays: { type: Number, default: 7 },
      cancellationWindowHours: { type: Number, default: 24 },
      tax: {
        enabled: { type: Boolean, default: true },
        defaultRatePercent: { type: Number, default: 18 },
      },
      invoice: {
        prefix: { type: String, default: 'INV' },
        showTaxBreakdown: { type: Boolean, default: true },
      },
    },
    school: {
      schoolApprovalRequired: { type: Boolean, default: true },
      teacherApprovalRequired: { type: Boolean, default: true },
    },
    security: {
      passwordPolicy: {
        minLength: { type: Number, default: 8 },
        requireNumber: { type: Boolean, default: true },
        requireSpecialChar: { type: Boolean, default: true },
      },
      loginPolicy: {
        maxAttempts: { type: Number, default: 5 },
        lockoutMinutes: { type: Number, default: 15 },
      },
      session: {
        accessTokenExpiry: { type: String, default: '15m' },
        refreshTokenExpiry: { type: String, default: '7d' },
      },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'platformSettings', timestamps: false }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
