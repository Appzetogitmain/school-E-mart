const express = require('express');
const academicsController = require('../controllers/academics.controller');
const validators = require('../validators/academics.validator');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validation');
const { protectedRoute } = require('../../../middlewares/auth/guards');
const { PERMISSIONS } = require('../../../constants/permissions');
const { ROLES } = require('../../../constants/roles');
const { resolveSchool } = require('../../school/middlewares/resolveSchool');

const router = express.Router({ mergeParams: true });

// Parents/teachers/school read; school admin writes.
const schoolRead = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.VENDOR],
});
const eventsManage = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN],
  permissions: [PERMISSIONS.EVENTS_MANAGE],
  tenant: { requireTenantId: false },
});
const phonebookManage = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN],
  permissions: [PERMISSIONS.PHONEBOOK_MANAGE],
  tenant: { requireTenantId: false },
});
const kitsManage = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN],
  permissions: [PERMISSIONS.KITS_MANAGE],
  tenant: { requireTenantId: false },
});

// Events
router.post(
  '/:schoolId/events',
  ...eventsManage,
  resolveSchool(),
  validateParams(validators.schoolIdParam),
  validateBody(validators.createEventSchema),
  academicsController.createEvent
);
router.get(
  '/:schoolId/events',
  ...schoolRead,
  resolveSchool(),
  validateParams(validators.schoolIdParam),
  validateQuery(validators.paginationQuery),
  academicsController.listEvents
);
router.get(
  '/:schoolId/events/:eventId',
  ...schoolRead,
  resolveSchool(),
  validateParams(validators.eventIdParam),
  academicsController.getEvent
);
router.patch(
  '/:schoolId/events/:eventId',
  ...eventsManage,
  resolveSchool(),
  validateParams(validators.eventIdParam),
  validateBody(validators.updateEventSchema),
  academicsController.updateEvent
);
router.delete(
  '/:schoolId/events/:eventId',
  ...eventsManage,
  resolveSchool(),
  validateParams(validators.eventIdParam),
  academicsController.deleteEvent
);

// Phonebook
// Parent-facing directory (relevant teachers + emergency numbers). Declared
// before the generic list route so "contacts" is not treated as an entryId.
router.get(
  '/:schoolId/phonebook/contacts',
  ...schoolRead,
  resolveSchool(),
  validateParams(validators.schoolIdParam),
  validateQuery(validators.parentContactsQuery),
  academicsController.getPhonebookContacts
);
router.get(
  '/:schoolId/phonebook',
  ...schoolRead,
  resolveSchool(),
  validateParams(validators.schoolIdParam),
  validateQuery(validators.paginationQuery),
  academicsController.listPhonebook
);
router.post(
  '/:schoolId/phonebook',
  ...phonebookManage,
  resolveSchool(),
  validateParams(validators.schoolIdParam),
  validateBody(validators.phonebookEntrySchema),
  academicsController.createPhonebookEntry
);
router.patch(
  '/:schoolId/phonebook/:entryId',
  ...phonebookManage,
  resolveSchool(),
  validateParams(validators.entryIdParam),
  validateBody(validators.updatePhonebookSchema),
  academicsController.updatePhonebookEntry
);
router.delete(
  '/:schoolId/phonebook/:entryId',
  ...phonebookManage,
  resolveSchool(),
  validateParams(validators.entryIdParam),
  academicsController.deletePhonebookEntry
);

// Kits
router.get(
  '/:schoolId/kit-categories',
  ...schoolRead,
  resolveSchool(),
  validateParams(validators.schoolIdParam),
  academicsController.listKitCategories
);
router.post(
  '/:schoolId/kit-categories',
  ...kitsManage,
  resolveSchool(),
  validateParams(validators.schoolIdParam),
  academicsController.createKitCategory
);
router.delete(
  '/:schoolId/kit-categories/:categoryId',
  ...kitsManage,
  resolveSchool(),
  academicsController.deleteKitCategory
);

router.post(
  '/:schoolId/kits',
  ...kitsManage,
  resolveSchool(),
  validateParams(validators.schoolIdParam),
  validateBody(validators.createKitSchema),
  academicsController.createKit
);
router.get(
  '/:schoolId/kits',
  ...schoolRead,
  resolveSchool(),
  validateParams(validators.schoolIdParam),
  validateQuery(validators.paginationQuery),
  academicsController.listKits
);
router.get(
  '/:schoolId/kits/:kitId',
  ...schoolRead,
  resolveSchool(),
  validateParams(validators.kitIdParam),
  academicsController.getKit
);
router.patch(
  '/:schoolId/kits/:kitId',
  ...kitsManage,
  resolveSchool(),
  validateParams(validators.kitIdParam),
  validateBody(validators.updateKitSchema),
  academicsController.updateKit
);
router.delete(
  '/:schoolId/kits/:kitId',
  ...kitsManage,
  resolveSchool(),
  validateParams(validators.kitIdParam),
  academicsController.deleteKit
);

module.exports = router;
