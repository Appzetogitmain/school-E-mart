const express = require('express');
const academicsController = require('../controllers/academics.controller');
const validators = require('../validators/academics.validator');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validation');
const { protectedRoute } = require('../../../middlewares/auth/guards');
const { PERMISSIONS } = require('../../../constants/permissions');
const { ROLES } = require('../../../constants/roles');
const { resolveSchool } = require('../../school/middlewares/resolveSchool');

const router = express.Router({ mergeParams: true });

// Parents/teachers/school read; school admin writes. Mirrors the notices guards.
const schoolRead = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.USER, ROLES.VENDOR],
});
const schoolManage = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN],
  permissions: [PERMISSIONS.NOTICES_SEND],
  tenant: { requireTenantId: false },
});

// Events
router.post(
  '/:schoolId/events',
  ...schoolManage,
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
  ...schoolManage,
  resolveSchool(),
  validateParams(validators.eventIdParam),
  validateBody(validators.updateEventSchema),
  academicsController.updateEvent
);
router.delete(
  '/:schoolId/events/:eventId',
  ...schoolManage,
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
  ...schoolManage,
  resolveSchool(),
  validateParams(validators.schoolIdParam),
  validateBody(validators.phonebookEntrySchema),
  academicsController.createPhonebookEntry
);
router.patch(
  '/:schoolId/phonebook/:entryId',
  ...schoolManage,
  resolveSchool(),
  validateParams(validators.entryIdParam),
  validateBody(validators.updatePhonebookSchema),
  academicsController.updatePhonebookEntry
);
router.delete(
  '/:schoolId/phonebook/:entryId',
  ...schoolManage,
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
  ...schoolManage,
  resolveSchool(),
  validateParams(validators.schoolIdParam),
  academicsController.createKitCategory
);
router.delete(
  '/:schoolId/kit-categories/:categoryId',
  ...schoolManage,
  resolveSchool(),
  academicsController.deleteKitCategory
);

router.post(
  '/:schoolId/kits',
  ...schoolManage,
  resolveSchool(),
  validateParams(validators.schoolIdParam),
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
  ...schoolManage,
  resolveSchool(),
  validateParams(validators.kitIdParam),
  validateBody(validators.updateKitSchema),
  academicsController.updateKit
);
router.delete(
  '/:schoolId/kits/:kitId',
  ...schoolManage,
  resolveSchool(),
  validateParams(validators.kitIdParam),
  academicsController.deleteKit
);

module.exports = router;
