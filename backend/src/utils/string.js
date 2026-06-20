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

module.exports = {
  capitalize,
  slugify,
  truncate,
  isBlank,
};
