const express = require('express');
const adminController = require('../controllers/admin.controller');
const validators = require('../validators/admin.validator');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validation');
const { validate } = require('../../../common/validation');
const { protectedRoute } = require('../../../middlewares/auth/guards');
const { PERMISSIONS } = require('../../../constants/permissions');
const { ROLES } = require('../../../constants/roles');
const lmsValidators = require('../../lms/validators/lms.validator');
const { uploadImage, uploadMedia } = require('../middlewares/upload.middleware');

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
router.patch(
  '/users/:userId',
  ...adminUsersWrite,
  validateParams(validators.userIdParam),
  validateBody(validators.updateUserSchema),
  adminController.updateUser
);

// Teacher Management
router.get(
  '/teachers',
  ...adminOnly,
  validateQuery(validators.teacherQuery),
  adminController.listTeachers
);
router.get(
  '/teachers/:teacherId',
  ...adminOnly,
  validateParams(validators.teacherIdParam),
  adminController.getTeacher
);
router.patch(
  '/teachers/:teacherId',
  ...adminOnly,
  validateParams(validators.teacherIdParam),
  validateBody(validators.updateTeacherSchema),
  adminController.updateTeacher
);
router.delete(
  '/teachers/:teacherId',
  ...adminOnly,
  validateParams(validators.teacherIdParam),
  adminController.deleteTeacher
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
router.post(
  '/vendors',
  ...adminOnly,
  validateBody(validators.createVendorSchema),
  adminController.createVendor
);
router.get(
  '/vendors/:vendorId',
  ...adminOnly,
  validateParams(validators.vendorIdParam),
  adminController.getVendor
);
router.patch(
  '/vendors/:vendorId',
  ...adminOnly,
  validateParams(validators.vendorIdParam),
  validateBody(validators.updateVendorSchema),
  adminController.updateVendor
);
router.delete(
  '/vendors/:vendorId',
  ...adminOnly,
  validateParams(validators.vendorIdParam),
  adminController.deleteVendor
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
router.post(
  '/schools',
  ...adminOnly,
  validateBody(validators.createSchoolSchema),
  adminController.createSchool
);
router.get(
  '/schools/:schoolId',
  ...adminOnly,
  validateParams(validators.schoolIdParam),
  adminController.getSchool
);
// Master-admin-only: set a school's commission rates.
router.patch(
  '/schools/:schoolId/commission',
  ...adminOnly,
  validateParams(validators.schoolIdParam),
  validateBody(validators.schoolCommissionSchema),
  adminController.setSchoolCommission
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

// File uploads (superadmin)
router.post('/uploads', ...adminOnly, uploadImage, adminController.uploadAttachment);
router.post('/uploads/media', ...adminOnly, uploadMedia, adminController.uploadAttachment);

const kitProductsRead = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.VENDOR],
  tenant: { requireTenantId: false },
});

// Master Kit Products (SuperAdmin Master Catalogue)
router.get('/kit-products', ...kitProductsRead, adminController.listMasterKitProducts);
router.post('/kit-products', ...adminOnly, adminController.createMasterKitProduct);
router.patch('/kit-products/:productId', ...adminOnly, adminController.updateMasterKitProduct);
router.delete('/kit-products/:productId', ...adminOnly, adminController.deleteMasterKitProduct);

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
router.get('/cms/contact', adminController.getContactInfo);

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

// Platform LMS
router.get(
  '/lms/courses',
  ...adminOnly,
  validateQuery(lmsValidators.paginationQuery),
  adminController.listPlatformCourses
);
router.post(
  '/lms/courses',
  ...adminOnly,
  validateBody(lmsValidators.createCourseSchema),
  adminController.createPlatformCourse
);
router.patch(
  '/lms/courses/:courseId',
  ...adminOnly,
  validateParams(validators.courseIdParam),
  validateBody(lmsValidators.updateCourseSchema),
  adminController.updatePlatformCourse
);
router.delete(
  '/lms/courses/:courseId',
  ...adminOnly,
  validateParams(validators.courseIdParam),
  adminController.deletePlatformCourse
);
router.patch(
  '/lms/courses/:courseId/status',
  ...adminOnly,
  validateParams(validators.courseIdParam),
  validateBody(lmsValidators.courseStatusSchema),
  adminController.setPlatformCourseStatus
);
router.get(
  '/lms/courses/:courseId/lessons',
  ...adminOnly,
  validateParams(validators.courseIdParam),
  validateQuery(lmsValidators.paginationQuery),
  adminController.listPlatformLessons
);
router.post(
  '/lms/courses/:courseId/lessons',
  ...adminOnly,
  validateParams(validators.courseIdParam),
  validateBody(lmsValidators.createLessonSchema),
  adminController.createPlatformLesson
);
router.patch(
  '/lms/courses/:courseId/lessons/:lessonId',
  ...adminOnly,
  validateParams(lmsValidators.lessonIdParam),
  validateBody(lmsValidators.updateLessonSchema),
  adminController.updatePlatformLesson
);
router.delete(
  '/lms/courses/:courseId/lessons/:lessonId',
  ...adminOnly,
  validateParams(lmsValidators.lessonIdParam),
  adminController.deletePlatformLesson
);

// LMS course subjects — dynamic picker options, not hardcoded on the client
router.get('/lms/subjects', ...adminOnly, adminController.listLmsSubjects);
router.post('/lms/subjects', ...adminOnly, validateBody(validators.lmsSubjectSchema), adminController.createLmsSubject);
router.delete(
  '/lms/subjects/:subjectId',
  ...adminOnly,
  validateParams(validators.lmsSubjectIdParam),
  adminController.deleteLmsSubject
);

// LMS course target grades — dynamic picker options, not hardcoded on the
// client; schools each define their own grade/class names, so the admin
// picks from real ones in use (see the suggestions endpoint) or adds new.
router.get('/lms/grades', ...adminOnly, adminController.listLmsGrades);
router.get('/lms/grades/suggestions', ...adminOnly, adminController.listLmsGradeSuggestions);
router.post('/lms/grades', ...adminOnly, validateBody(validators.lmsGradeSchema), adminController.createLmsGrade);
router.delete(
  '/lms/grades/:gradeId',
  ...adminOnly,
  validateParams(validators.lmsGradeIdParam),
  adminController.deleteLmsGrade
);

// Platform Reels
router.get('/reels', ...adminOnly, validateQuery(validators.paginationQuery), adminController.listReels);
router.post('/reels', ...adminOnly, validateBody(validators.reelSchema), adminController.createReel);
router.patch(
  '/reels/:reelId',
  ...adminOnly,
  validateParams(validators.reelIdParam),
  validateBody(validators.updateReelSchema),
  adminController.updateReel
);
router.delete(
  '/reels/:reelId',
  ...adminOnly,
  validateParams(validators.reelIdParam),
  adminController.deleteReel
);

// Platform Tutorials ("Learn more about platform")
router.get('/tutorials', ...adminOnly, validateQuery(validators.paginationQuery), adminController.listTutorials);
router.post('/tutorials', ...adminOnly, validateBody(validators.tutorialSchema), adminController.createTutorial);
router.patch(
  '/tutorials/:tutorialId',
  ...adminOnly,
  validateParams(validators.tutorialIdParam),
  validateBody(validators.updateTutorialSchema),
  adminController.updateTutorial
);
router.delete(
  '/tutorials/:tutorialId',
  ...adminOnly,
  validateParams(validators.tutorialIdParam),
  adminController.deleteTutorial
);

// Wallet & Payouts
router.get('/wallet/overview', ...adminOnly, adminController.getWalletOverview);
router.get(
  '/wallet/transactions',
  ...adminOnly,
  validateQuery(validators.walletQuery),
  adminController.listVendorTransactions
);
router.post(
  '/wallet/transactions',
  ...adminOnly,
  validateBody(validators.walletAdjustmentSchema),
  adminController.createVendorAdjustment
);
router.post(
  '/users/:userId/wallet',
  ...adminOnly,
  validateParams(validators.userIdParam),
  validateBody(validators.userWalletAdjustmentSchema),
  adminController.adjustUserWallet
);
router.get(
  '/wallet/payouts',
  ...adminOnly,
  validateQuery(validators.walletQuery),
  adminController.listPayoutRequests
);
router.post(
  '/wallet/payouts/:payoutId/approve',
  ...adminOnly,
  validateParams(validators.payoutIdParam),
  validateBody(validators.approvePayoutSchema),
  adminController.approvePayout
);
router.post(
  '/wallet/payouts/:payoutId/reject',
  ...adminOnly,
  validateParams(validators.payoutIdParam),
  validateBody(validators.rejectPayoutSchema),
  adminController.rejectPayout
);

// Notification campaigns
router.get(
  '/notifications/campaigns',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  adminController.listNotificationCampaigns
);
router.post(
  '/notifications/campaigns',
  ...adminOnly,
  validateBody(validators.notificationCampaignSchema),
  adminController.createNotificationCampaign
);

// Admin profile
router.get('/profile', ...adminOnly, adminController.getAdminProfile);
router.put(
  '/profile',
  ...adminOnly,
  validateBody(validators.adminProfileSchema),
  adminController.updateAdminProfile
);

module.exports = router;
