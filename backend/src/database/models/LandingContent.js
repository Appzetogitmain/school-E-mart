const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const landingContentSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true }, // e.g. 'home', 'about', 'contact'
  heroSection: {
    title: { type: String },
    subtitle: { type: String },
    backgroundImageUrl: { type: String },
    ctaText: { type: String },
    ctaLink: { type: String }
  },
  features: [{
    icon: { type: String },
    title: { type: String },
    description: { type: String }
  }],
  testimonials: [{
    author: { type: String },
    role: { type: String },
    content: { type: String },
    avatarUrl: { type: String }
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    required: true,
    default: 'draft'
  }
}, { collection: 'landingContents' });

// Plugins
landingContentSchema.plugin(auditPlugin);

// Indexes
// slug is unique

module.exports = mongoose.model('LandingContent', landingContentSchema);
