const School = require('../../../database/models/School');
const { createLmsTaxonomyService } = require('./lmsTaxonomy.service');

// Reuses the shared Lookup collection with its own group so these
// platform-wide LMS target-grade options never collide with a school's own
// grade/class Lookup entries.
const taxonomy = createLmsTaxonomyService({
  lookupType: 'grade',
  group: 'lms',
  codePrefix: 'LMS_',
  itemNoun: 'Grade',
  courseField: 'gradeClass',
});

const lmsGradesService = {
  listGrades: () => taxonomy.list(),
  createGrade: (payload) => taxonomy.create(payload),
  deleteGrade: (id) => taxonomy.remove(id),

  /**
   * Every school defines its own grades/classes free-text (School.gradesOffered
   * — "Nursery", "Class 1", "Grade 5", "Year 7", whatever that school calls
   * it), there's no platform-wide canonical list. Rather than have the admin
   * guess names that may not match what any real school uses, surface the
   * actual distinct grade names in use across all schools so they can be
   * added to the picker in one click. Excludes ones already added.
   */
  async listSchoolGradeSuggestions() {
    const [distinctGrades, existing] = await Promise.all([
      School.distinct('gradesOffered', { 'softDelete.isDeleted': { $ne: true } }),
      taxonomy.list(),
    ]);

    const existingLabels = new Set(existing.map((g) => g.label.trim().toLowerCase()));
    return distinctGrades
      .map((g) => (g || '').trim())
      .filter((g) => g && !existingLabels.has(g.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  },
};

module.exports = lmsGradesService;
