const capitalize = (value = '') =>
  String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();

const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const truncate = (value = '', maxLength = 100, suffix = '...') => {
  const text = String(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - suffix.length)}${suffix}`;
};

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim().length === 0;

/**
 * Escape a user-supplied string so it matches literally inside a regular
 * expression.
 *
 * Search terms were being interpolated straight into `$regex` filters all over
 * the codebase. Two consequences: a term containing regex syntax matched the
 * wrong rows (searching "." returned everything rather than nothing), and a
 * pathological pattern such as `(a+)+$` could pin the database on catastrophic
 * backtracking — a denial of service reachable from any public search box.
 *
 * Returns an empty string for blank input, so callers can skip the filter.
 */
const escapeRegex = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = {
  capitalize,
  slugify,
  truncate,
  isBlank,
  escapeRegex,
};
