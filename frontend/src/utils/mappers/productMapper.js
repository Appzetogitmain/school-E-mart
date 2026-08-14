import { toAbsoluteUrl } from '../url';

const PRODUCT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400&h=400&fit=crop';

export const formatRupee = (paise) => {
  const amount = Number(paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatRupeeNumber = (paise) => Number(paise || 0) / 100;

export const resolveProductImage = (product, index = 0) => {
  const images = product?.images || [];
  const entry = images[index] || images[0];

  if (!entry) return PRODUCT_PLACEHOLDER;
  // Product.images entries are { attachmentId: <Attachment ref>, alt }; when
  // populated, attachmentId is the Attachment doc holding the real storageKey.
  const key =
    (typeof entry === 'string' && entry) ||
    entry.attachmentId?.storageKey ||
    entry.storageKey ||
    entry.url ||
    entry.imageUrl ||
    (typeof entry.attachmentId === 'string' ? entry.attachmentId : null);

  return toAbsoluteUrl(key) || PRODUCT_PLACEHOLDER;
};

export const resolveProductImages = (product) => {
  const images = product?.images || [];
  if (!images.length) return [PRODUCT_PLACEHOLDER];
  const resolved = images.map((_, index) => resolveProductImage(product, index));
  return resolved.length ? resolved : [PRODUCT_PLACEHOLDER];
};

export const mapProductForCard = (product, meta = {}) => {
  const id = product?._id?.toString?.() || product?.id;
  const pricePaise = product?.pricePaise ?? 0;
  const originalPricePaise = product?.originalPricePaise;

  return {
    id,
    productId: id,
    name: product?.name || 'Product',
    price: formatRupee(pricePaise),
    originalPrice: originalPricePaise ? formatRupee(originalPricePaise) : null,
    pricePaise,
    originalPricePaise,
    image: resolveProductImage(product),
    images: resolveProductImages(product),
    category: meta.categoryName || product?.brand || meta.type || 'Essential',
    type: meta.categoryName || product?.brand,
    rating: product?.ratingAvg ? Number(product.ratingAvg).toFixed(1) : '4.5',
    reviews: product?.ratingCount || 0,
    slug: product?.slug,
    brand: product?.brand || 'School E-Mart Essentials',
    description: product?.description || '',
    sizes: product?.sizes || [],
    specs: (product?.specs || []).map((spec) =>
      spec.label ? spec : { label: spec.key, value: spec.value }
    ),
    sku: product?.sku,
    stock: product?.stock,
  };
};

export const mapProductForDetailView = (payload, meta = {}) => {
  const mapped = mapProductForDetail(payload, meta);
  return {
    ...mapped,
    price: formatRupeeNumber(mapped.pricePaise),
    originalPrice: mapped.originalPricePaise
      ? formatRupeeNumber(mapped.originalPricePaise)
      : formatRupeeNumber(mapped.pricePaise),
    rating: Number(mapped.rating) || 4.5,
  };
};

export const mapProductForDetail = (payload, meta = {}) => {
  const product = payload?.product || payload;
  const mapped = mapProductForCard(product, meta);
  const specs = mapped.specs?.length
    ? mapped.specs
    : [
        { label: 'SKU', value: product?.sku || '—' },
        { label: 'Brand', value: product?.brand || 'School E-Mart' },
      ];

  return {
    ...mapped,
    specs,
    offer: payload?.offer,
    inventory: payload?.inventory,
  };
};

export const mapProductForMarketingCard = (product, meta = {}) => {
  const mapped = mapProductForCard(product, meta);
  const currentPrice = formatRupeeNumber(mapped.pricePaise);
  const originalPrice = mapped.originalPricePaise
    ? formatRupeeNumber(mapped.originalPricePaise)
    : null;
  const discount =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

  return {
    id: mapped.id,
    image: mapped.image,
    category: mapped.category,
    title: mapped.name,
    currentPrice,
    originalPrice,
    discount,
    hasBulkQuote: false,
    moq: meta.moq,
    slug: meta.slug || product?.slug,
  };
};

export const mapProductForGradeCard = (product) => {
  const mapped = mapProductForCard(product);
  const currentPrice = formatRupeeNumber(mapped.pricePaise);
  const originalPrice = mapped.originalPricePaise
    ? formatRupeeNumber(mapped.originalPricePaise)
    : currentPrice;
  const discount =
    mapped.originalPricePaise && mapped.originalPricePaise > mapped.pricePaise
      ? Math.round(((mapped.originalPricePaise - mapped.pricePaise) / mapped.originalPricePaise) * 100)
      : 0;

  return {
    id: mapped.id,
    image: mapped.image,
    category: mapped.category,
    title: mapped.name,
    currentPrice,
    originalPrice,
    discount,
    hasBulkQuote: false,
    rating: Number(mapped.rating) || 4.5,
    reviews: mapped.reviews,
    tag: mapped.originalPricePaise ? 'Offer' : 'Essential',
  };
};

export const mapProductForSubcategoryList = (product) => {
  const mapped = mapProductForCard(product);
  return {
    id: mapped.id,
    name: mapped.name,
    price: mapped.price,
    image: mapped.image,
  };
};

export const sortKeyFromLabel = (label) => {
  const map = {
    Recommended: 'popular',
    featured: 'popular',
    newest: 'newest',
    'Price: Low to High': 'price_asc',
    'low-high': 'price_asc',
    'Price: High to Low': 'price_desc',
    'high-low': 'price_desc',
    Rating: 'rating',
    'Best Discounts': 'price_asc',
  };
  return map[label] || 'popular';
};

export const gradeLabelToQuery = (gradeLabel) => {
  if (!gradeLabel || gradeLabel === 'All Grades' || gradeLabel === 'Bulk Orders' || gradeLabel === 'All') return undefined;
  return gradeLabel;
};

export const classIdToGradeQuery = (classId) => {
  const map = {
    playgroup: 'Play Group',
    'play-group': 'Play Group',
    nursery: 'Nursery',
    lkg: 'LKG',
    ukg: 'UKG',
    '1': 'Class 1',
    '2': 'Class 2',
    '3': 'Class 3',
    '4': 'Class 4',
    '5': 'Class 5',
    '6': 'Class 6',
    '7': 'Class 7',
    '8': 'Class 8',
    '9': 'Class 9',
    '10': 'Class 10',
    '11': 'Class 11',
    '12': 'Class 12',
  };
  return map[classId?.toLowerCase?.()] || (classId ? (classId.startsWith('Class ') ? classId : `Class ${classId}`) : undefined);
};
