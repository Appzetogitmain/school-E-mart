const { success, created, paginated } = require('../../../common/response');
const asyncHandler = require('../../../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');
const analyticsService = require('../services/analytics.service');
const userManagementService = require('../services/userManagement.service');
const vendorApprovalService = require('../services/vendorApproval.service');
const schoolApprovalService = require('../services/schoolApproval.service');
const reportsService = require('../services/reports.service');
const cmsService = require('../services/cms.service');
const settingsService = require('../services/settings.service');
const adminLmsService = require('../services/lms.service');
const attachmentService = require('../services/attachment.service');
const reelsService = require('../services/reels.service');
const walletService = require('../services/wallet.service');
const notificationCampaignService = require('../services/notificationCampaign.service');
const adminProfileService = require('../services/adminProfile.service');

const actorFrom = (req) => ({ userId: req.auth.userId, role: req.auth.role });

const adminController = {
  // Dashboard
  getDashboard: asyncHandler(async (req, res) => {
    const [overview, recentRegistrations, recentOrders, health] = await Promise.all([
      dashboardService.getOverview(),
      dashboardService.getRecentRegistrations(req.query.limit),
      dashboardService.getRecentOrders(req.query.limit),
      dashboardService.getSystemHealth(),
    ]);
    return success(
      res,
      { overview, recentRegistrations, recentOrders, systemHealth: health },
      'Dashboard fetched',
      undefined,
      req
    );
  }),

  getSystemHealth: asyncHandler(async (req, res) => {
    const health = await dashboardService.getSystemHealth();
    return success(res, { health }, 'System health fetched', undefined, req);
  }),

  // Analytics
  getUserAnalytics: asyncHandler(async (req, res) => {
    const data = await analyticsService.getUserAnalytics(req.query);
    return success(res, { analytics: data }, 'User analytics fetched', undefined, req);
  }),

  getMarketplaceAnalytics: asyncHandler(async (req, res) => {
    const data = await analyticsService.getMarketplaceAnalytics(req.query);
    return success(res, { analytics: data }, 'Marketplace analytics fetched', undefined, req);
  }),

  getOrderAnalytics: asyncHandler(async (req, res) => {
    const data = await analyticsService.getOrderAnalytics(req.query);
    return success(res, { analytics: data }, 'Order analytics fetched', undefined, req);
  }),

  getSchoolAnalytics: asyncHandler(async (req, res) => {
    const data = await analyticsService.getSchoolAnalytics(req.query);
    return success(res, { analytics: data }, 'School analytics fetched', undefined, req);
  }),

  getVendorAnalytics: asyncHandler(async (req, res) => {
    const data = await analyticsService.getVendorAnalytics(req.query);
    return success(res, { analytics: data }, 'Vendor analytics fetched', undefined, req);
  }),

  // User Management
  listUsers: asyncHandler(async (req, res) => {
    const { data, pagination } = await userManagementService.listUsers(req.query);
    return paginated(res, { users: data }, pagination, 'Users fetched', req);
  }),

  getUser: asyncHandler(async (req, res) => {
    const user = await userManagementService.getUser(req.params.userId);
    return success(res, { user }, 'User fetched', undefined, req);
  }),

  suspendUser: asyncHandler(async (req, res) => {
    const user = await userManagementService.suspendUser(
      req.params.userId,
      actorFrom(req),
      req.body.reason
    );
    return success(res, { user }, 'User suspended', undefined, req);
  }),

  activateUser: asyncHandler(async (req, res) => {
    const user = await userManagementService.activateUser(req.params.userId, actorFrom(req));
    return success(res, { user }, 'User activated', undefined, req);
  }),

  lockUser: asyncHandler(async (req, res) => {
    const user = await userManagementService.lockUser(
      req.params.userId,
      actorFrom(req),
      req.body.reason
    );
    return success(res, { user }, 'User locked', undefined, req);
  }),

  unlockUser: asyncHandler(async (req, res) => {
    const user = await userManagementService.unlockUser(req.params.userId, actorFrom(req));
    return success(res, { user }, 'User unlocked', undefined, req);
  }),

  assignRoles: asyncHandler(async (req, res) => {
    const user = await userManagementService.assignRoles(
      req.params.userId,
      req.body,
      actorFrom(req)
    );
    return success(res, { user }, 'Role assigned', undefined, req);
  }),

  updateRoles: asyncHandler(async (req, res) => {
    const user = await userManagementService.updateRoles(
      req.params.userId,
      req.body,
      actorFrom(req)
    );
    return success(res, { user }, 'Roles updated', undefined, req);
  }),

  getUserActivity: asyncHandler(async (req, res) => {
    const { user, activity, pagination } = await userManagementService.getUserActivity(
      req.params.userId,
      req.query
    );
    return paginated(res, { user, activity }, pagination, 'User activity fetched', req);
  }),

  deleteUser: asyncHandler(async (req, res) => {
    const user = await userManagementService.deleteUser(
      req.params.userId,
      actorFrom(req),
      req.body.reason
    );
    return success(res, { user }, 'User deleted', undefined, req);
  }),

  // Vendor Approval
  listPendingVendors: asyncHandler(async (req, res) => {
    const { data, pagination } = await vendorApprovalService.listPendingVendors(req.query);
    return paginated(res, { vendors: data }, pagination, 'Pending vendors fetched', req);
  }),

  listVendors: asyncHandler(async (req, res) => {
    const { data, pagination } = await vendorApprovalService.listVendors(req.query);
    return paginated(res, { vendors: data }, pagination, 'Vendors fetched', req);
  }),

  getVendor: asyncHandler(async (req, res) => {
    const vendor = await vendorApprovalService.getVendor(req.params.vendorId);
    return success(res, { vendor }, 'Vendor fetched', undefined, req);
  }),

  createVendor: asyncHandler(async (req, res) => {
    const vendor = await vendorApprovalService.createVendor(req.body, actorFrom(req), {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id,
    });
    return created(res, { vendor }, 'Vendor created', req);
  }),

  updateVendor: asyncHandler(async (req, res) => {
    const vendor = await vendorApprovalService.updateVendor(
      req.params.vendorId,
      req.body,
      actorFrom(req)
    );
    return success(res, { vendor }, 'Vendor updated', undefined, req);
  }),

  deleteVendor: asyncHandler(async (req, res) => {
    await vendorApprovalService.deleteVendor(req.params.vendorId, actorFrom(req));
    return success(res, null, 'Vendor deleted', undefined, req);
  }),

  approveVendor: asyncHandler(async (req, res) => {
    const vendor = await vendorApprovalService.approveVendor(
      req.params.vendorId,
      actorFrom(req),
      req.body.note
    );
    return success(res, { vendor }, 'Vendor approved', undefined, req);
  }),

  rejectVendor: asyncHandler(async (req, res) => {
    const vendor = await vendorApprovalService.rejectVendor(
      req.params.vendorId,
      actorFrom(req),
      req.body.reason
    );
    return success(res, { vendor }, 'Vendor rejected', undefined, req);
  }),

  suspendVendor: asyncHandler(async (req, res) => {
    const vendor = await vendorApprovalService.suspendVendor(
      req.params.vendorId,
      actorFrom(req),
      req.body.reason
    );
    return success(res, { vendor }, 'Vendor suspended', undefined, req);
  }),

  reactivateVendor: asyncHandler(async (req, res) => {
    const vendor = await vendorApprovalService.reactivateVendor(
      req.params.vendorId,
      actorFrom(req),
      req.body.note
    );
    return success(res, { vendor }, 'Vendor reactivated', undefined, req);
  }),

  getVendorApprovalHistory: asyncHandler(async (req, res) => {
    const { data, pagination } = await vendorApprovalService.getApprovalHistory(
      req.params.vendorId,
      req.query
    );
    return paginated(res, { history: data }, pagination, 'Vendor approval history fetched', req);
  }),

  // School Approval
  listPendingSchools: asyncHandler(async (req, res) => {
    const { data, pagination } = await schoolApprovalService.listPendingSchools(req.query);
    return paginated(res, { schools: data }, pagination, 'Pending schools fetched', req);
  }),

  listSchools: asyncHandler(async (req, res) => {
    const { data, pagination } = await schoolApprovalService.listSchools(req.query);
    return paginated(res, { schools: data }, pagination, 'Schools fetched', req);
  }),

  getSchool: asyncHandler(async (req, res) => {
    const school = await schoolApprovalService.getSchool(req.params.schoolId);
    return success(res, { school }, 'School fetched', undefined, req);
  }),

  createSchool: asyncHandler(async (req, res) => {
    const school = await schoolApprovalService.createSchool(req.body, actorFrom(req));
    return created(res, { school }, 'School created', req);
  }),

  approveSchool: asyncHandler(async (req, res) => {
    const school = await schoolApprovalService.approveSchool(
      req.params.schoolId,
      actorFrom(req),
      req.body.note
    );
    return success(res, { school }, 'School approved', undefined, req);
  }),

  rejectSchool: asyncHandler(async (req, res) => {
    const school = await schoolApprovalService.rejectSchool(
      req.params.schoolId,
      actorFrom(req),
      req.body.reason
    );
    return success(res, { school }, 'School rejected', undefined, req);
  }),

  suspendSchool: asyncHandler(async (req, res) => {
    const school = await schoolApprovalService.suspendSchool(
      req.params.schoolId,
      actorFrom(req),
      req.body.reason
    );
    return success(res, { school }, 'School suspended', undefined, req);
  }),

  reactivateSchool: asyncHandler(async (req, res) => {
    const school = await schoolApprovalService.reactivateSchool(
      req.params.schoolId,
      actorFrom(req),
      req.body.note
    );
    return success(res, { school }, 'School reactivated', undefined, req);
  }),

  getSchoolApprovalHistory: asyncHandler(async (req, res) => {
    const { data, pagination } = await schoolApprovalService.getApprovalHistory(
      req.params.schoolId,
      req.query
    );
    return paginated(res, { history: data }, pagination, 'School approval history fetched', req);
  }),

  getSchoolApprovalTimeline: asyncHandler(async (req, res) => {
    const timeline = await schoolApprovalService.getApprovalTimeline(req.params.schoolId);
    return success(res, timeline, 'School approval timeline fetched', undefined, req);
  }),

  // Reports
  getUserReport: asyncHandler(async (req, res) => {
    const { data, pagination, exportMeta } = await reportsService.getUserReport(req.query);
    return paginated(res, { report: data, exportMeta }, pagination, 'User report generated', req);
  }),

  getVendorReport: asyncHandler(async (req, res) => {
    const { data, pagination, exportMeta } = await reportsService.getVendorReport(req.query);
    return paginated(res, { report: data, exportMeta }, pagination, 'Vendor report generated', req);
  }),

  getSchoolReport: asyncHandler(async (req, res) => {
    const { data, pagination, exportMeta } = await reportsService.getSchoolReport(req.query);
    return paginated(res, { report: data, exportMeta }, pagination, 'School report generated', req);
  }),

  getOrderReport: asyncHandler(async (req, res) => {
    const { data, pagination, exportMeta } = await reportsService.getOrderReport(req.query);
    return paginated(res, { report: data, exportMeta }, pagination, 'Order report generated', req);
  }),

  getSalesReport: asyncHandler(async (req, res) => {
    const { data, pagination, exportMeta, summary } = await reportsService.getSalesReport(req.query);
    return paginated(
      res,
      { report: data, summary, exportMeta },
      pagination,
      'Sales report generated',
      req
    );
  }),

  getRefundReport: asyncHandler(async (req, res) => {
    const { data, pagination, exportMeta } = await reportsService.getRefundReport(req.query);
    return paginated(res, { report: data, exportMeta }, pagination, 'Refund report generated', req);
  }),

  getReturnReport: asyncHandler(async (req, res) => {
    const { data, pagination, exportMeta } = await reportsService.getReturnReport(req.query);
    return paginated(res, { report: data, exportMeta }, pagination, 'Return report generated', req);
  }),

  getInventoryReport: asyncHandler(async (req, res) => {
    const { data, pagination, exportMeta, summary } = await reportsService.getInventoryReport(
      req.query
    );
    return paginated(
      res,
      { report: data, summary, exportMeta },
      pagination,
      'Inventory report generated',
      req
    );
  }),

  // CMS - Pages
  listPages: asyncHandler(async (req, res) => {
    const { data, pagination } = await cmsService.listPages(req.query);
    return paginated(res, { pages: data }, pagination, 'CMS pages fetched', req);
  }),

  getPage: asyncHandler(async (req, res) => {
    const page = await cmsService.getPage(req.params.pageId);
    return success(res, { page }, 'CMS page fetched', undefined, req);
  }),

  createPage: asyncHandler(async (req, res) => {
    const page = await cmsService.createPage(req.body, actorFrom(req));
    return created(res, { page }, 'CMS page created', req);
  }),

  updatePage: asyncHandler(async (req, res) => {
    const page = await cmsService.updatePage(req.params.pageId, req.body, actorFrom(req));
    return success(res, { page }, 'CMS page updated', undefined, req);
  }),

  deletePage: asyncHandler(async (req, res) => {
    const page = await cmsService.deletePage(req.params.pageId, actorFrom(req));
    return success(res, { page }, 'CMS page deleted', undefined, req);
  }),

  publishPage: asyncHandler(async (req, res) => {
    const page = await cmsService.publishPage(req.params.pageId, actorFrom(req));
    return success(res, { page }, 'CMS page published', undefined, req);
  }),

  unpublishPage: asyncHandler(async (req, res) => {
    const page = await cmsService.unpublishPage(req.params.pageId, actorFrom(req));
    return success(res, { page }, 'CMS page unpublished', undefined, req);
  }),

  // CMS - FAQs
  listFaqs: asyncHandler(async (req, res) => {
    const { data, pagination } = await cmsService.listFaqs(req.query);
    return paginated(res, { faqs: data }, pagination, 'FAQs fetched', req);
  }),

  getFaq: asyncHandler(async (req, res) => {
    const faq = await cmsService.getFaq(req.params.faqId);
    return success(res, { faq }, 'FAQ fetched', undefined, req);
  }),

  createFaq: asyncHandler(async (req, res) => {
    const faq = await cmsService.createFaq(req.body, actorFrom(req));
    return created(res, { faq }, 'FAQ created', req);
  }),

  updateFaq: asyncHandler(async (req, res) => {
    const faq = await cmsService.updateFaq(req.params.faqId, req.body, actorFrom(req));
    return success(res, { faq }, 'FAQ updated', undefined, req);
  }),

  deleteFaq: asyncHandler(async (req, res) => {
    const faq = await cmsService.deleteFaq(req.params.faqId);
    return success(res, { faq }, 'FAQ deleted', undefined, req);
  }),

  // CMS - Banners
  listBanners: asyncHandler(async (req, res) => {
    const { data, pagination } = await cmsService.listBanners(req.query);
    return paginated(res, { banners: data }, pagination, 'Banners fetched', req);
  }),

  createBanner: asyncHandler(async (req, res) => {
    const banner = await cmsService.createBanner(req.body, actorFrom(req));
    return created(res, { banner }, 'Banner created', req);
  }),

  updateBanner: asyncHandler(async (req, res) => {
    const banner = await cmsService.updateBanner(req.params.bannerId, req.body);
    return success(res, { banner }, 'Banner updated', undefined, req);
  }),

  deleteBanner: asyncHandler(async (req, res) => {
    const banner = await cmsService.deleteBanner(req.params.bannerId);
    return success(res, { banner }, 'Banner deleted', undefined, req);
  }),

  // CMS - Sections
  listSections: asyncHandler(async (req, res) => {
    const { data, pagination } = await cmsService.listSections(req.query);
    return paginated(res, { sections: data }, pagination, 'Home sections fetched', req);
  }),

  createSection: asyncHandler(async (req, res) => {
    const section = await cmsService.createSection(req.body);
    return created(res, { section }, 'Home section created', req);
  }),

  updateSection: asyncHandler(async (req, res) => {
    const section = await cmsService.updateSection(req.params.sectionId, req.body);
    return success(res, { section }, 'Home section updated', undefined, req);
  }),

  deleteSection: asyncHandler(async (req, res) => {
    const section = await cmsService.deleteSection(req.params.sectionId);
    return success(res, { section }, 'Home section deleted', undefined, req);
  }),

  // CMS - Landing / static content
  getLandingBySlug: asyncHandler(async (req, res) => {
    const content = await cmsService.getLandingBySlug(req.params.slug);
    return success(res, { content }, 'Landing content fetched', undefined, req);
  }),

  upsertLanding: asyncHandler(async (req, res) => {
    const content = await cmsService.upsertLanding(req.params.slug, req.body, actorFrom(req));
    return success(res, { content }, 'Landing content saved', undefined, req);
  }),

  getTermsAndConditions: asyncHandler(async (req, res) => {
    const page = await cmsService.getTermsAndConditions();
    return success(res, { page }, 'Terms & conditions fetched', undefined, req);
  }),

  getPrivacyPolicy: asyncHandler(async (req, res) => {
    const page = await cmsService.getPrivacyPolicy();
    return success(res, { page }, 'Privacy policy fetched', undefined, req);
  }),

  getAboutUs: asyncHandler(async (req, res) => {
    const content = await cmsService.getAboutUs();
    return success(res, { content }, 'About us fetched', undefined, req);
  }),

  getContactInfo: asyncHandler(async (req, res) => {
    const content = await cmsService.getContactInfo();
    return success(res, { content }, 'Contact info fetched', undefined, req);
  }),

  // Settings
  getAllSettings: asyncHandler(async (req, res) => {
    const settings = await settingsService.getAllSettings();
    return success(res, { settings }, 'Settings fetched', undefined, req);
  }),

  getSettingsSection: asyncHandler(async (req, res) => {
    const section = await settingsService.getSection(req.params.section);
    return success(res, { section }, 'Settings section fetched', undefined, req);
  }),

  updateSettingsSection: asyncHandler(async (req, res) => {
    const section = await settingsService.updateSection(
      req.params.section,
      req.body,
      actorFrom(req)
    );
    return success(res, { section }, 'Settings updated', undefined, req);
  }),

  // Platform LMS (Super Admin)
  listPlatformCourses: asyncHandler(async (req, res) => {
    const { data, pagination } = await adminLmsService.listPlatformCourses(req.query);
    return paginated(res, { courses: data }, pagination, 'Platform courses fetched', req);
  }),

  createPlatformCourse: asyncHandler(async (req, res) => {
    const course = await adminLmsService.createPlatformCourse(req.body);
    return created(res, { course }, 'Platform course created', req);
  }),

  updatePlatformCourse: asyncHandler(async (req, res) => {
    const course = await adminLmsService.updatePlatformCourse(req.params.courseId, req.body);
    return success(res, { course }, 'Platform course updated', undefined, req);
  }),

  deletePlatformCourse: asyncHandler(async (req, res) => {
    await adminLmsService.deletePlatformCourse(req.params.courseId, req.auth.userId);
    return success(res, null, 'Platform course deleted', undefined, req);
  }),

  setPlatformCourseStatus: asyncHandler(async (req, res) => {
    const course = await adminLmsService.setPlatformCourseStatus(req.params.courseId, req.body.status);
    return success(res, { course }, 'Platform course status updated', undefined, req);
  }),

  uploadAttachment: asyncHandler(async (req, res) => {
    const purpose = req.body?.purpose || 'banner_image';
    const attachment = await attachmentService.createFromUpload({
      ownerUserId: req.auth.userId,
      purpose,
      file: req.file,
    });
    return created(res, { attachment }, 'File uploaded', req);
  }),

  // Reels
  listReels: asyncHandler(async (req, res) => {
    const { data, pagination } = await reelsService.listReels(req.query);
    return paginated(res, { reels: data }, pagination, 'Reels fetched', req);
  }),

  createReel: asyncHandler(async (req, res) => {
    const reel = await reelsService.createReel(req.body);
    return created(res, { reel }, 'Reel created', req);
  }),

  updateReel: asyncHandler(async (req, res) => {
    const reel = await reelsService.updateReel(req.params.reelId, req.body);
    return success(res, { reel }, 'Reel updated', undefined, req);
  }),

  deleteReel: asyncHandler(async (req, res) => {
    await reelsService.deleteReel(req.params.reelId, req.auth.userId);
    return success(res, null, 'Reel deleted', undefined, req);
  }),

  // Wallet & payouts
  getWalletOverview: asyncHandler(async (req, res) => {
    const overview = await walletService.getOverview();
    return success(res, { overview }, 'Wallet overview fetched', undefined, req);
  }),

  listVendorTransactions: asyncHandler(async (req, res) => {
    const { data, pagination } = await walletService.listVendorTransactions(req.query);
    return paginated(res, { transactions: data }, pagination, 'Transactions fetched', req);
  }),

  createVendorAdjustment: asyncHandler(async (req, res) => {
    const transaction = await walletService.createAdjustment(req.body, req.auth.userId);
    return created(res, { transaction }, 'Adjustment recorded', req);
  }),

  adjustUserWallet: asyncHandler(async (req, res) => {
    const userWalletService = require('../../wallet/services/wallet.service');
    const transaction = await userWalletService.postTransaction(req.params.userId, {
      type: req.body.direction === 'debit' ? 'debit' : 'credit',
      category: 'adjustment',
      amountPaise: req.body.amountPaise,
      reference: { kind: 'AdminAdjustment', id: req.auth.userId },
      description: req.body.remarks || 'Administrative wallet adjustment',
    });
    return created(res, { transaction }, 'Wallet adjusted', req);
  }),

  listPayoutRequests: asyncHandler(async (req, res) => {
    const { data, pagination } = await walletService.listPayoutRequests(req.query);
    return paginated(res, { payouts: data }, pagination, 'Payout requests fetched', req);
  }),

  approvePayout: asyncHandler(async (req, res) => {
    const payout = await walletService.approvePayout(req.params.payoutId, req.auth.userId, req.body);
    return success(res, { payout }, 'Payout approved', undefined, req);
  }),

  rejectPayout: asyncHandler(async (req, res) => {
    const payout = await walletService.rejectPayout(req.params.payoutId, req.auth.userId, req.body);
    return success(res, { payout }, 'Payout rejected', undefined, req);
  }),

  // Notification campaigns
  listNotificationCampaigns: asyncHandler(async (req, res) => {
    const { data, pagination } = await notificationCampaignService.listCampaigns(req.query);
    return paginated(res, { campaigns: data }, pagination, 'Campaigns fetched', req);
  }),

  createNotificationCampaign: asyncHandler(async (req, res) => {
    const campaign = await notificationCampaignService.createCampaign(req.body, req.auth.userId);
    return created(res, { campaign }, 'Campaign created', req);
  }),

  // Admin profile
  getAdminProfile: asyncHandler(async (req, res) => {
    const profile = await adminProfileService.getProfile(req.auth.userId);
    return success(res, { profile }, 'Profile fetched', undefined, req);
  }),

  updateAdminProfile: asyncHandler(async (req, res) => {
    const profile = await adminProfileService.updateProfile(req.auth.userId, req.body);
    return success(res, { profile }, 'Profile updated', undefined, req);
  }),
};

module.exports = adminController;
