// Variant rows of the vendor's product form (e.g. "100ml" / 29 / 39 / 3 stock) <-> the API payload.
// Prices are typed in rupees and sent in paise.
//
// A product with ONE row whose name is empty is a plain product (price and stock as before). Any
// other combination is a product with variants, and then every row needs a name.

export const emptyVariantRow = (overrides = {}) => ({
  id: undefined, // set for a variant that already exists (kept when editing)
  label: '',
  price: '',
  mrp: '',
  stock: '',
  ...overrides,
});

const toPaise = (rupees) => Math.round(Number(rupees) * 100);
const blank = (value) => value === '' || value === null || value === undefined;

/**
 * @returns {{ variants: object[]|null, simple: {pricePaise, originalPricePaise, stock}|null, error: string|null }}
 *  - simple !== null: a plain product, use these values and send no variants
 *  - variants !== null: a product with variants (send `variants`)
 */
export const buildVariantsPayload = (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) return { variants: null, simple: null, error: 'Add at least one price' };

  const single = list.length === 1 && !String(list[0].label || '').trim();
  const check = (row, name) => {
    if (blank(row.price) || !(Number(row.price) > 0)) return `${name}: enter a selling price greater than 0`;
    if (!blank(row.mrp) && Number(row.mrp) > 0 && Number(row.mrp) < Number(row.price)) return `${name}: MRP cannot be less than the selling price`;
    if (blank(row.stock) || !(Number(row.stock) >= 0) || !Number.isInteger(Number(row.stock))) return `${name}: enter the stock (0 or more, whole number)`;
    return null;
  };

  if (single) {
    const row = list[0];
    const error = check(row, 'Price');
    if (error) return { variants: null, simple: null, error };
    return {
      variants: null,
      simple: {
        pricePaise: toPaise(row.price),
        originalPricePaise: !blank(row.mrp) && Number(row.mrp) > 0 ? toPaise(row.mrp) : null,
        stock: Number(row.stock),
      },
      error: null,
    };
  }

  const seen = new Set();
  for (let index = 0; index < list.length; index += 1) {
    const row = list[index];
    const label = String(row.label || '').trim();
    if (!label) return { variants: null, simple: null, error: `Variant ${index + 1}: enter a name (for example "500ml" or "Pack of 3")` };
    if (seen.has(label.toLowerCase())) return { variants: null, simple: null, error: `Variant "${label}" is added twice. Each variant needs a different name` };
    seen.add(label.toLowerCase());
    const error = check(row, `Variant "${label}"`);
    if (error) return { variants: null, simple: null, error };
  }

  return {
    variants: list.map((row) => ({
      ...(row.id ? { id: row.id } : {}),
      label: String(row.label).trim(),
      pricePaise: toPaise(row.price),
      originalPricePaise: !blank(row.mrp) && Number(row.mrp) > 0 ? toPaise(row.mrp) : null,
      stock: Number(row.stock),
    })),
    simple: null,
    error: null,
  };
};

const fromPaise = (paise) => (paise ? String(Math.round(Number(paise)) / 100) : '');

/** Rows for the edit form: the product's variants, or one plain row from its price / MRP / stock. */
export const rowsFromProduct = (product) => {
  const variants = product?.raw?.variants || product?.variants || [];
  if (Array.isArray(variants) && variants.length) {
    return variants.map((v) =>
      emptyVariantRow({
        id: v.id || v._id,
        label: v.label || '',
        price: fromPaise(v.pricePaise),
        mrp: fromPaise(v.originalPricePaise),
        stock: String(v.stock ?? 0),
      })
    );
  }
  const pricePaise = product?.raw?.pricePaise ?? (product?.price ? Number(product.price) * 100 : 0);
  const originalPaise = product?.raw?.originalPricePaise ?? (product?.originalPrice ? Number(product.originalPrice) * 100 : 0);
  return [
    emptyVariantRow({
      price: fromPaise(pricePaise),
      mrp: fromPaise(originalPaise),
      stock: String(product?.raw?.stock ?? product?.stock ?? 0),
    }),
  ];
};
