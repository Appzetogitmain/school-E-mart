const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';

const uniqueSlug = async (model, base, extraFilter = {}) => {
  const root = slugify(base);
  let candidate = root;
  let counter = 1;

  while (await model.exists({ slug: candidate, ...extraFilter })) {
    candidate = `${root}-${counter}`;
    counter += 1;
  }

  return candidate;
};

module.exports = {
  slugify,
  uniqueSlug,
};
