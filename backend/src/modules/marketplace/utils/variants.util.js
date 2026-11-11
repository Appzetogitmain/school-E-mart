// Pure helpers for product variants (e.g. "100ml", "500ml", "1L" of the same product, each
// with its own price, MRP and stock). No database access here so they can be unit tested.
const { BadRequestError } = require('../../../common/errors');

const MAX_VARIANTS = 30;
const MAX_LABEL_LENGTH = 60;

const invalid = (message) => new BadRequestError(message, null, 'VARIANT_INVALID');

const toInt = (value) => (value === '' || value === null || value === undefined ? NaN : Number(value));

/**
 * Validates what the vendor typed and returns clean variants:
 *   [{ id?, label, pricePaise, originalPricePaise|null, stock, sku? }]
 * Throws VARIANT_INVALID with a message naming the offending variant.
 */
const normalizeVariantInputs = (inputs) => {
  if (!Array.isArray(inputs)) throw invalid('Variants must be a list');
  if (inputs.length > MAX_VARIANTS) throw invalid(`A product can have at most ${MAX_VARIANTS} variants`);

  const seen = new Set();
  return inputs.map((raw, index) => {
    const label = String(raw?.label ?? '').trim();
    const name = label || `#${index + 1}`;
    if (!label) throw invalid(`Variant ${name}: enter a name (for example "500ml" or "Pack of 3")`);
    if (label.length > MAX_LABEL_LENGTH) throw invalid(`Variant "${label}": name is too long`);
    const key = label.toLowerCase();
    if (seen.has(key)) throw invalid(`Variant "${label}" is added twice. Each variant needs a different name`);
    seen.add(key);

    const pricePaise = toInt(raw.pricePaise);
    if (!Number.isInteger(pricePaise) || pricePaise <= 0) throw invalid(`Variant "${label}": enter a selling price greater than 0`);

    let originalPricePaise = null;
    if (raw.originalPricePaise !== undefined && raw.originalPricePaise !== null && raw.originalPricePaise !== '') {
      originalPricePaise = toInt(raw.originalPricePaise);
      if (!Number.isInteger(originalPricePaise) || originalPricePaise < 0) throw invalid(`Variant "${label}": MRP is not valid`);
      if (originalPricePaise === 0) originalPricePaise = null;
      else if (originalPricePaise < pricePaise) throw invalid(`Variant "${label}": MRP cannot be less than the selling price`);
    }

    const stock = toInt(raw.stock);
    if (!Number.isInteger(stock) || stock < 0) throw invalid(`Variant "${label}": stock must be 0 or more`);

    return {
      ...(raw.id ? { id: String(raw.id) } : {}),
      label,
      pricePaise,
      originalPricePaise,
      stock,
      ...(raw.sku ? { sku: String(raw.sku).trim() } : {}),
    };
  });
};

/**
 * The product-level fields that are DERIVED from its variants, so listings, "in stock" filters
 * and sorting keep working: the price shown is the lowest variant price ("from Rs X"), the
 * stock is the total across variants.
 */
const summarizeVariants = (variants) => {
  if (!variants.length) return null;
  const cheapest = variants.reduce((best, v) => (v.pricePaise < best.pricePaise ? v : best), variants[0]);
  return {
    pricePaise: cheapest.pricePaise,
    originalPricePaise:
      cheapest.originalPricePaise && cheapest.originalPricePaise > cheapest.pricePaise ? cheapest.originalPricePaise : null,
    stock: variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
    sizes: variants.map((v) => v.label),
  };
};

/** The label of a stored variant (attributes.size holds it so cart, orders and invoices show it as the size). */
const variantLabel = (variant) => {
  const attributes = variant?.attributes;
  if (!attributes) return '';
  if (typeof attributes.get === 'function') return attributes.get('size') || '';
  return attributes.size || '';
};

/** Plain shape sent to the apps. */
const serializeVariant = (variant) => ({
  id: String(variant._id || variant.id),
  label: variantLabel(variant),
  sku: variant.sku,
  pricePaise: variant.pricePaise,
  originalPricePaise: variant.originalPricePaise || null,
  stock: variant.stock,
});

const serializeVariants = (variants) =>
  (Array.isArray(variants) ? variants : [])
    .filter((v) => v && typeof v === 'object' && (v._id || v.id) && v.pricePaise !== undefined)
    .map(serializeVariant);

module.exports = {
  MAX_VARIANTS,
  normalizeVariantInputs,
  summarizeVariants,
  variantLabel,
  serializeVariant,
  serializeVariants,
};
