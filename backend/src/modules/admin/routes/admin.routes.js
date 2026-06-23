const express = require('express');
const adminController = require('../controllers/admin.controller');
const validators = require('../validators/admin.validator');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validation');
const { validate } = require('../../../common/validation');
const { protectedRoute } = require('../../../middlewares/auth/guards');
const { PERMISSIONS } = require('../../../constants/permissions');
const { ROLES } = require('../../../constants/roles');

const router = express.Router();

const adminOnly = protectedRoute({
  roles: [ROLES.SUPER_ADMIN],
  scopes: ['*'],
});

const adminUsersRead = protectedRoute({
  roles: [ROLES.SUPER_ADMIN],
  permissions: [PERMISSIONS.USERS_READ],
  scopes: ['*'],
});

const adminUsersWrite = protectedRoute({
  roles: [ROLES.SUPER_ADMIN],
  permissions: [PERMISSIONS.USERS_WRITE],
  scopes: ['*'],
});

const validateSettingsBody = (req, res, next) => {
  const schema = validators.settingsBodyBySection[req.params.section];
  if (!schema) {
    return next();
  }
  return validate(schema)(req, res, next);
};

// Dashboard
router.get('/dashboard', ...adminOnly, validateQuery(validators.recentQuery), adminController.getDashboard);
router.get('/dashboard/health', ...adminOnly, adminController.getSystemHealth);

// Analytics
router.get(
  '/analytics/users',
  ...adminOnly,
  validateQuery(validators.analyticsQuery),
  adminController.getUserAnalytics
);
router.get(
  '/analytics/marketplace',
  ...adminOnly,
  validateQuery(validators.analyticsQuery),
  adminController.getMarketplaceAnalytics
);
router.get(
  '/analytics/orders',
  ...adminOnly,
  validateQuery(validators.analyticsQuery),
  adminController.getOrderAnalytics
);
router.get(
  '/analytics/schools',
  ...adminOnly,
  validateQuery(validators.analyticsQuery),
  adminController.getSchoolAnalytics
);
router.get(
  '/analytics/vendors',
  ...adminOnly,
  validateQuery(validators.analyticsQuery),
  adminController.getVendorAnalytics
);

// User Management
router.get('/users', ...adminUsersRead, validateQuery(validators.paginationQuery), adminController.listUsers);
router.get(
  '/users/:userId',
  ...adminUsersRead,
  validateParams(validators.userIdParam),
  adminController.getUser
);
router.patch(
  '/users/:userId/suspend',
  ...adminUsersWrite,
  validateParams(validators.userIdParam),
  validateBody(validators.actionNoteSchema),
  adminController.suspendUser
);
router.patch(
  '/users/:userId/activate',
  ...adminUsersWrite,
  validateParams(validators.userIdParam),
  adminController.activateUser
);
router.patch(
  '/users/:userId/lock',
  ...adminUsersWrite,
  validateParams(validators.userIdParam),
  validateBody(validators.actionNoteSchema),
  adminController.lockUser
);
router.patch(
  '/users/:userId/unlock',
  ...adminUsersWrite,
  validateParams(validators.userIdParam),
  adminController.unlockUser
);
router.patch(
  '/users/:userId/roles',
  ...adminUsersWrite,
  validateParams(validators.userIdParam),
  validateBody(validators.assignRoleSchema),
  adminController.assignRoles
);
router.put(
  '/users/:userId/roles',
  ...adminUsersWrite,
  validateParams(validators.userIdParam),
  validateBody(validators.updateRolesSchema),
  adminController.updateRoles
);
router.get(
  '/users/:userId/activity',
  ...adminUsersRead,
  validateParams(validators.userIdParam),
  validateQuery(validators.paginationQuery),
  adminController.getUserActivity
);
router.delete(
  '/users/:userId',
  ...adminUsersWrite,
  validateParams(validators.userIdParam),
  validateBody(validators.deleteUserSchema),
  adminController.deleteUser
);

// Vendor Approval
router.get(
  '/vendors/pending',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.listPendingVendors
);
router.get(
  '/vendors',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.listVendors
);
router.get(
  '/vendors/:vendorId',
  ...adminOnly,
  validateParams(validators.vendorIdParam),
  adminController.getVendor
);
router.post(
  '/vendors/:vendorId/approve',
  ...adminOnly,
  validateParams(validators.vendorIdParam),
  validateBody(validators.actionNoteSchema),
  adminController.approveVendor
);
router.post(
  '/vendors/:vendorId/reject',
  ...adminOnly,
  validateParams(validators.vendorIdParam),
  validateBody(validators.actionNoteSchema),
  adminController.rejectVendor
);
router.post(
  '/vendors/:vendorId/suspend',
  ...adminOnly,
  validateParams(validators.vendorIdParam),
  validateBody(validators.actionNoteSchema),
  adminController.suspendVendor
);
router.post(
  '/vendors/:vendorId/reactivate',
  ...adminOnly,
  validateParams(validators.vendorIdParam),
  validateBody(validators.actionNoteSchema),
  adminController.reactivateVendor
);
router.get(
  '/vendors/:vendorId/approval-history',
  ...adminOnly,
  validateParams(validators.vendorIdParam),
  validateQuery(validators.paginationQuery),
  adminController.getVendorApprovalHistory
);

// School Approval
router.get(
  '/schools/pending',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.listPendingSchools
);
router.get(
  '/schools',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.listSchools
);
router.get(
  '/schools/:schoolId',
  ...adminOnly,
  validateParams(validators.schoolIdParam),
  adminController.getSchool
);
router.post(
  '/schools/:schoolId/approve',
  ...adminOnly,
  validateParams(validators.schoolIdParam),
  validateBody(validators.actionNoteSchema),
  adminController.approveSchool
);
router.post(
  '/schools/:schoolId/reject',
  ...adminOnly,
  validateParams(validators.schoolIdParam),
  validateBody(validators.actionNoteSchema),
  adminController.rejectSchool
);
router.post(
  '/schools/:schoolId/suspend',
  ...adminOnly,
  validateParams(validators.schoolIdParam),
  validateBody(validators.actionNoteSchema),
  adminController.suspendSchool
);
router.post(
  '/schools/:schoolId/reactivate',
  ...adminOnly,
  validateParams(validators.schoolIdParam),
  validateBody(validators.actionNoteSchema),
  adminController.reactivateSchool
);
router.get(
  '/schools/:schoolId/approval-history',
  ...adminOnly,
  validateParams(validators.schoolIdParam),
  validateQuery(validators.paginationQuery),
  adminController.getSchoolApprovalHistory
);
router.get(
  '/schools/:schoolId/approval-timeline',
  ...adminOnly,
  validateParams(validators.schoolIdParam),
  adminController.getSchoolApprovalTimeline
);

// Reports
router.get(
  '/reports/users',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.getUserReport
);
router.get(
  '/reports/vendors',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.getVendorReport
);
router.get(
  '/reports/schools',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.getSchoolReport
);
router.get(
  '/reports/orders',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.getOrderReport
);
router.get(
  '/reports/sales',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.getSalesReport
);
router.get(
  '/reports/refunds',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.getRefundReport
);
router.get(
  '/reports/returns',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.getReturnReport
);
router.get(
  '/reports/inventory',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.getInventoryReport
);

// CMS - Pages
router.get('/cms/pages', ...adminOnly, validateQuery(validators.paginationQuery), adminController.listPages);
router.post('/cms/pages', ...adminOnly, validateBody(validators.cmsPageSchema), adminController.createPage);
router.get(
  '/cms/pages/:pageId',
  ...adminOnly,
  validateParams(validators.pageIdParam),
  adminController.getPage
);
router.patch(
  '/cms/pages/:pageId',
  ...adminOnly,
  validateParams(validators.pageIdParam),
  validateBody(validators.updateCmsPageSchema),
  adminController.updatePage
);
router.delete(
  '/cms/pages/:pageId',
  ...adminOnly,
  validateParams(validators.pageIdParam),
  adminController.deletePage
);
router.post(
  '/cms/pages/:pageId/publish',
  ...adminOnly,
  validateParams(validators.pageIdParam),
  adminController.publishPage
);
router.post(
  '/cms/pages/:pageId/unpublish',
  ...adminOnly,
  validateParams(validators.pageIdParam),
  adminController.unpublishPage
);

// CMS - FAQs
router.get('/cms/faqs', ...adminOnly, validateQuery(validators.paginationQuery), adminController.listFaqs);
router.post('/cms/faqs', ...adminOnly, validateBody(validators.faqSchema), adminController.createFaq);
router.get(
  '/cms/faqs/:faqId',
  ...adminOnly,
  validateParams(validators.faqIdParam),
  adminController.getFaq
);
router.patch(
  '/cms/faqs/:faqId',
  ...adminOnly,
  validateParams(validators.faqIdParam),
  validateBody(validators.updateFaqSchema),
  adminController.updateFaq
);
router.delete(
  '/cms/faqs/:faqId',
  ...adminOnly,
  validateParams(validators.faqIdParam),
  adminController.deleteFaq
);

// CMS - Banners
router.get('/cms/banners', ...adminOnly, validateQuery(validators.paginationQuery), adminController.listBanners);
router.post('/cms/banners', ...adminOnly, validateBody(validators.bannerSchema), adminController.createBanner);
router.patch(
  '/cms/banners/:bannerId',
  ...adminOnly,
  validateParams(validators.bannerIdParam),
  validateBody(validators.updateBannerSchema),
  adminController.updateBanner
);
router.delete(
  '/cms/banners/:bannerId',
  ...adminOnly,
  validateParams(validators.bannerIdParam),
  adminController.deleteBanner
);

// CMS - Homepage Sections
router.get(
  '/cms/sections',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.listSections
);
router.post('/cms/sections', ...adminOnly, validateBody(validators.sectionSchema), adminController.createSection);
router.patch(
  '/cms/sections/:sectionId',
  ...adminOnly,
  validateParams(validators.sectionIdParam),
  validateBody(validators.updateSectionSchema),
  adminController.updateSection
);
router.delete(
  '/cms/sections/:sectionId',
  ...adminOnly,
  validateParams(validators.sectionIdParam),
  adminController.deleteSection
);

// CMS - Static content shortcuts
router.get(
  '/cms/landing/:slug',
  ...adminOnly,
  validateParams(validators.landingSlugParam),
  adminController.getLandingBySlug
);
router.put(
  '/cms/landing/:slug',
  ...adminOnly,
  validateParams(validators.landingSlugParam),
  validateBody(validators.landingContentSchema),
  adminController.upsertLanding
);
router.get('/cms/terms', ...adminOnly, adminController.getTermsAndConditions);
router.get('/cms/privacy', ...adminOnly, adminController.getPrivacyPolicy);
router.get('/cms/about', ...adminOnly, adminController.getAboutUs);
router.get('/cms/contact', ...adminOnly, adminController.getContactInfo);

// Settings
router.get('/settings', ...adminOnly, adminController.getAllSettings);
router.get(
  '/settings/:section',
  ...adminOnly,
  validateParams(validators.settingsSectionParam),
  adminController.getSettingsSection
);
router.put(
  '/settings/:section',
  ...adminOnly,
  validateParams(validators.settingsSectionParam),
  validateSettingsBody,
  adminController.updateSettingsSection
);

module.exports = router;
