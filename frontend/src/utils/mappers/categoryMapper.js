const HEADER_IMAGE_FALLBACKS = {
  uniforms: '/assets/uniforms.png',
  uniform: '/assets/uniforms.png',
  books: '/assets/books.png',
  book: '/assets/books.png',
  stationery: '/assets/stationary.png',
  stationary: '/assets/stationary.png',
  sports: '/assets/toys_and_sports.png',
  technology: '/assets/technology.png',
  tech: '/assets/technology.png',
  science: '/assets/lab_and_science.png',
  furniture: '/assets/furniture.png',
  transport: '/assets/transport.png',
};

const CATEGORY_CARD_COLORS = [
  'from-blue-50/50 to-indigo-50/50',
  'from-orange-50/50 to-amber-50/50',
  'from-purple-50/50 to-fuchsia-50/50',
  'from-green-50/50 to-emerald-50/50',
  'from-cyan-50/50 to-sky-50/50',
  'from-indigo-50/50 to-blue-50/50',
  'from-amber-50/50 to-yellow-50/50',
  'from-rose-50/50 to-pink-50/50',
  'from-slate-50/50 to-gray-50/50',
];

const toId = (doc) => doc?._id?.toString?.() || doc?.id;

const normalizeKey = (value = '') =>
  String(value).trim().toLowerCase().replace(/\s+/g, '-');

export const resolveCategoryImage = (entity, fallbackKey) => {
  if (entity?.imageUrl) return entity.imageUrl;
  const key = normalizeKey(fallbackKey || entity?.slug || entity?.name);
  return HEADER_IMAGE_FALLBACKS[key] || '/assets/uniforms.png';
};

export const mapSubcategory = (subcategory) => ({
  id: toId(subcategory),
  name: subcategory?.name,
  slug: subcategory?.slug,
  image: resolveCategoryImage(subcategory, subcategory?.slug),
});

export const mapCategory = (category) => ({
  id: toId(category),
  name: category?.name,
  slug: category?.slug,
  headerId: toId(category?.headerId),
  image: resolveCategoryImage(category, category?.slug),
  subcategories: (category?.subcategories || []).map(mapSubcategory),
});

export const mapHeaderCategory = (header, index = 0) => ({
  id: toId(header),
  name: header?.name,
  slug: header?.slug,
  image: resolveCategoryImage(header, header?.slug),
  color: CATEGORY_CARD_COLORS[index % CATEGORY_CARD_COLORS.length],
  categories: (header?.categories || []).map(mapCategory),
});

export const mapCategoryTree = (tree = []) => tree.map(mapHeaderCategory);

export const findHeaderCategory = (tree, param) => {
  const key = normalizeKey(param);
  return tree.find(
    (header) =>
      header.id === param ||
      header.slug === key ||
      normalizeKey(header.name) === key
  );
};

export const findCategoryInTree = (tree, param) => {
  const key = normalizeKey(param);
  for (const header of tree) {
    for (const category of header.categories || []) {
      if (category.id === param || category.slug === key || normalizeKey(category.name) === key) {
        return { header, category };
      }
    }
  }
  return null;
};

export const resolveTaxonomyFromParam = (tree, param) => {
  const header = findHeaderCategory(tree, param);
  if (header) {
    return {
      type: 'header',
      header,
      category: header.categories?.[0] || null,
      title: header.name,
    };
  }

  const match = findCategoryInTree(tree, param);
  if (match) {
    return {
      type: 'category',
      header: match.header,
      category: match.category,
      title: match.category.name,
    };
  }

  return {
    type: 'unknown',
    header: null,
    category: null,
    title: String(param || 'Products').replace(/-/g, ' '),
  };
};

export const buildProductQueryForSubcategory = (taxonomy, activeSubName, subcategories) => {
  const base = { limit: 50 };
  const active = subcategories.find((sub) => sub.name === activeSubName);

  if (!active || active.id === 'all') {
    if (taxonomy?.type === 'header') return { ...base, headerId: taxonomy.header.id };
    if (taxonomy?.type === 'category') return { ...base, categoryId: taxonomy.category.id };
    return base;
  }

  if (taxonomy?.type === 'header') {
    return { ...base, categoryId: active.id };
  }

  if (taxonomy?.type === 'category') {
    return { ...base, subcategoryId: active.id };
  }

  return base;
};

export const findHeaderByCategoryName = (tree, categoryName) => {
  if (!categoryName || categoryName === 'All') return null;
  const key = normalizeKey(categoryName);
  return tree.find(
    (header) =>
      normalizeKey(header.name) === key ||
      header.slug === key ||
      normalizeKey(header.name).includes(key) ||
      key.includes(normalizeKey(header.name))
  );
};

export const getSubcategoryOptions = (taxonomy) => {
  if (!taxonomy) return [{ id: 'all', name: 'All', image: '/assets/uniforms.png' }];

  if (taxonomy.type === 'category') {
    return [
      { id: 'all', name: 'All', image: taxonomy.category?.image },
      ...(taxonomy.category?.subcategories || []),
    ];
  }

  if (taxonomy.type === 'header') {
    const categories = taxonomy.header?.categories || [];
    return [
      { id: 'all', name: 'All', image: taxonomy.header?.image },
      ...categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        image: cat.image,
      })),
    ];
  }

  return [{ id: 'all', name: 'All', image: '/assets/uniforms.png' }];
};
