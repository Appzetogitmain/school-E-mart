const { Joi, schemas } = require('../../../common/validation');
const { ALL_ROLES } = require('../../../constants/roles');

const objectId = schemas.objectId;

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().trim().optional(),
  fields: Joi.string().trim().optional(),
  search: Joi.string().trim().max(120).optional(),
  q: Joi.string().trim().max(120).optional(),
  status: Joi.string().trim().optional(),
  role: Joi.string().valid(...ALL_ROLES).optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  approvalStatus: Joi.string().valid('pending', 'approved', 'suspended').optional(),
  partnerStatus: Joi.string().valid('prospect', 'active', 'suspended').optional(),
  orderStatus: Joi.string().trim().optional(),
  paymentStatus: Joi.string().trim().optional(),
  audience: Joi.string().valid('all', 'parent', 'school', 'vendor').optional(),
  category: Joi.string().trim().optional(),
  position: Joi.string().valid('home_top', 'home_middle', 'category_top', 'cart').optional(),
});

const analyticsQuery = paginationQuery.keys({
  limit: Joi.number().integer().min(1).max(50).default(10),
});

const userIdParam = Joi.object({ userId: objectId.required() });
const vendorIdParam = Joi.object({ vendorId: objectId.required() });
const schoolIdParam = Joi.object({ schoolId: objectId.required() });
const pageIdParam = Joi.object({ pageId: objectId.required() });
const faqIdParam = Joi.object({ faqId: objectId.required() });
const bannerIdParam = Joi.object({ bannerId: objectId.required() });
const sectionIdParam = Joi.object({ sectionId: objectId.required() });
const courseIdParam = Joi.object({ courseId: objectId.required() });
const settingsSectionParam = Joi.object({
  section: Joi.string()
    .valid('general', 'marketplace', 'orders', 'school', 'security', 'billing')
    .required(),
});
const landingSlugParam = Joi.object({
  slug: Joi.string().trim().min(1).max(80).required(),
});
const recentQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10),
});

const actionNoteSchema = Joi.object({
  note: Joi.string().trim().max(500).optional(),
  reason: Joi.string().trim().max(500).optional(),
});

const assignRoleSchema = Joi.object({
  role: schemas.role.required(),
  roleScopes: Joi.array().items(Joi.string().trim()).default([]),
});

const updateRolesSchema = Joi.object({
  roleScopes: Joi.array().items(Joi.string().trim()).required(),
});

const deleteUserSchema = Joi.object({
  reason: Joi.string().trim().max(500).optional(),
});

const cmsPageSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  slug: Joi.string().trim().min(1).max(80).required(),
  content: Joi.string().required(),
  seo: Joi.object({
    metaTitle: Joi.string().trim().max(200).optional(),
    metaDescription: Joi.string().trim().max(500).optional(),
    keywords: Joi.array().items(Joi.string().trim()).optional(),
  }).optional(),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
});

const updateCmsPageSchema = cmsPageSchema.fork(['title', 'slug', 'content'], (s) => s.optional());

const faqSchema = Joi.object({
  question: Joi.string().trim().min(1).max(500).required(),
  answer: Joi.string().trim().min(1).required(),
  category: Joi.string().trim().min(1).max(80).required(),
  audience: Joi.string().valid('all', 'parent', 'school', 'vendor').default('all'),
  displayOrder: Joi.number().integer().min(0).default(0),
  status: Joi.string().valid('active', 'inactive').default('active'),
});

const updateFaqSchema = faqSchema.fork(['question', 'answer', 'category'], (s) => s.optional());

const bannerSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  imageId: objectId.required(),
  linkUrl: Joi.string().trim().uri().optional(),
  targetAudience: Joi.string().valid('all', 'parent', 'school').default('all'),
  position: Joi.string().valid('home_top', 'home_middle', 'category_top', 'cart').required(),
  displayOrder: Joi.number().integer().min(0).default(0),
  validFrom: Joi.date().iso().required(),
  validUntil: Joi.date().iso().required(),
  status: Joi.string().valid('active', 'inactive').default('active'),
});

const updateBannerSchema = bannerSchema.fork(['title', 'imageId', 'position', 'validFrom', 'validUntil'], (s) =>
  s.optional()
);

const reelIdParam = Joi.object({ reelId: objectId.required() });

const linkedProductSchema = Joi.object({
  title: Joi.string().trim().max(200).optional(),
  price: Joi.number().min(0).optional(),
  mrp: Joi.number().min(0).optional(),
  url: Joi.string().trim().max(500).optional(),
  imageId: objectId.optional(),
  imageUrl: Joi.string().trim().max(500).optional(),
  badge: Joi.string().trim().max(40).optional(),
});

const reelSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(2000).optional(),
  videoId: objectId.required(),
  thumbnailId: objectId.optional(),
  storeName: Joi.string().trim().max(160).optional(),
  category: Joi.string().trim().max(80).optional(),
  musicLabel: Joi.string().trim().max(200).optional(),
  linkedProduct: linkedProductSchema.optional(),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
});

const updateReelSchema = reelSchema.fork(['title', 'videoId'], (s) => s.optional());

const sectionSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  type: Joi.string()
    .valid('product_carousel', 'category_grid', 'vendor_list', 'custom_banner')
    .required(),
  queryConfig: Joi.object().optional(),
  manualItemIds: Joi.array().items(objectId).optional(),
  targetAudience: Joi.string().valid('all', 'parent', 'school').default('all'),
  displayOrder: Joi.number().integer().min(0).default(0),
  status: Joi.string().valid('active', 'inactive').default('active'),
});

const updateSectionSchema = sectionSchema.fork(['title', 'type'], (s) => s.optional());

const landingContentSchema = Joi.object({
  heroSection: Joi.object({
    title: Joi.string().trim().optional(),
    subtitle: Joi.string().trim().optional(),
    backgroundImageUrl: Joi.string().trim().optional(),
    ctaText: Joi.string().trim().optional(),
    ctaLink: Joi.string().trim().optional(),
  }).optional(),
  features: Joi.array()
    .items(
      Joi.object({
        icon: Joi.string().trim().optional(),
        title: Joi.string().trim().optional(),
        description: Joi.string().trim().optional(),
      })
    )
    .optional(),
  testimonials: Joi.array()
    .items(
      Joi.object({
        author: Joi.string().trim().optional(),
        role: Joi.string().trim().optional(),
        content: Joi.string().trim().optional(),
        avatarUrl: Joi.string().trim().optional(),
      })
    )
    .optional(),
  status: Joi.string().valid('draft', 'published').default('draft'),
});

const generalSettingsSchema = Joi.object({
  platformName: Joi.string().trim().min(1).max(120).optional(),
  logoMetadata: Joi.object().optional(),
  contact: Joi.object({
    email: schemas.email.optional(),
    phone: schemas.indianMobile.optional(),
    address: Joi.string().trim().max(500).optional(),
  }).optional(),
  timezone: Joi.string().trim().optional(),
  currency: Joi.string().trim().length(3).optional(),
  language: Joi.string().trim().optional(),
});

const marketplaceSettingsSchema = Joi.object({
  commissionPercent: Joi.number().min(0).max(100).optional(),
  vendorAutoApproval: Joi.boolean().optional(),
  productApprovalRequired: Joi.boolean().optional(),
});

const ordersSettingsSchema = Joi.object({
  returnWindowDays: Joi.number().integer().min(0).max(90).optional(),
  cancellationWindowHours: Joi.number().integer().min(0).max(168).optional(),
  tax: Joi.object({
    enabled: Joi.boolean().optional(),
    defaultRatePercent: Joi.number().min(0).max(100).optional(),
  }).optional(),
  invoice: Joi.object({
    prefix: Joi.string().trim().max(20).optional(),
    showTaxBreakdown: Joi.boolean().optional(),
  }).optional(),
});

const schoolSettingsSchema = Joi.object({
  schoolApprovalRequired: Joi.boolean().optional(),
  teacherApprovalRequired: Joi.boolean().optional(),
});

const securitySettingsSchema = Joi.object({
  passwordPolicy: Joi.object({
    minLength: Joi.number().integer().min(6).max(128).optional(),
    requireNumber: Joi.boolean().optional(),
    requireSpecialChar: Joi.boolean().optional(),
  }).optional(),
  loginPolicy: Joi.object({
    maxAttempts: Joi.number().integer().min(1).max(20).optional(),
    lockoutMinutes: Joi.number().integer().min(1).max(1440).optional(),
  }).optional(),
  session: Joi.object({
    accessTokenExpiry: Joi.string().trim().optional(),
    refreshTokenExpiry: Joi.string().trim().optional(),
  }).optional(),
});

const billingSettingsSchema = Joi.object({
  platformFeePaise: Joi.number().integer().min(0).optional(),
  freeDeliveryThresholdPaise: Joi.number().integer().min(0).optional(),
  pricingMode: Joi.string().valid('fixed', 'distance').optional(),
  fixedDeliveryChargePaise: Joi.number().integer().min(0).optional(),
  baseChargePaise: Joi.number().integer().min(0).optional(),
  baseDistanceKm: Joi.number().min(0).optional(),
  extraKmChargePaise: Joi.number().integer().min(0).optional(),
  riderCommissionPercent: Joi.number().min(0).max(100).optional(),
});

const settingsBodyBySection = {
  general: generalSettingsSchema,
  marketplace: marketplaceSettingsSchema,
  orders: ordersSettingsSchema,
  school: schoolSettingsSchema,
  security: securitySettingsSchema,
  billing: billingSettingsSchema,
};

module.exports = {
  paginationQuery,
  analyticsQuery,
  userIdParam,
  vendorIdParam,
  schoolIdParam,
  pageIdParam,
  faqIdParam,
  bannerIdParam,
  reelIdParam,
  sectionIdParam,
  courseIdParam,
  settingsSectionParam,
  landingSlugParam,
  recentQuery,
  actionNoteSchema,
  assignRoleSchema,
  updateRolesSchema,
  deleteUserSchema,
  cmsPageSchema,
  updateCmsPageSchema,
  faqSchema,
  updateFaqSchema,
  bannerSchema,
  updateBannerSchema,
  reelSchema,
  updateReelSchema,
  sectionSchema,
  updateSectionSchema,
  landingContentSchema,
  settingsBodyBySection,
};
