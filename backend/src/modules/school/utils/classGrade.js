// Class grades reach the database in two shapes — bare ("4") and prefixed
// ("Class 4") — depending on which screen wrote them. Everything that filters or
// compares a class grade has to tolerate both, so the handling lives here rather
// than being re-derived at each call site.

const normalizeClassGrade = (value) => {
  if (value === undefined || value === null) return '';
  const trimmed = String(value).trim();
  const match = trimmed.match(/^class\s+(.+)$/i);
  return (match ? match[1] : trimmed).trim();
};

/** Mongo filter matching a class grade in either stored shape. */
const classGradeQuery = (value) => {
  if (!value) return undefined;
  const bare = normalizeClassGrade(value);
  return { $in: [bare, `Class ${bare}`] };
};

/** Compare two class grades ignoring the optional "Class " prefix and casing. */
const classGradeMatches = (a, b) =>
  normalizeClassGrade(a).toLowerCase() === normalizeClassGrade(b).toLowerCase();

module.exports = { normalizeClassGrade, classGradeQuery, classGradeMatches };
