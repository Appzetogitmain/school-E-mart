const { createLmsTaxonomyService } = require('./lmsTaxonomy.service');

// Reuses the shared Lookup collection (already used for school-scoped
// subjects) with its own group so these platform-wide LMS course subjects
// never collide with any school's own subject list.
const taxonomy = createLmsTaxonomyService({
  lookupType: 'subject',
  group: 'lms',
  codePrefix: 'LMS_',
  itemNoun: 'Subject',
  courseField: 'subject',
});

const lmsSubjectsService = {
  listSubjects: () => taxonomy.list(),
  createSubject: (payload) => taxonomy.create(payload),
  deleteSubject: (id) => taxonomy.remove(id),
};

module.exports = lmsSubjectsService;
