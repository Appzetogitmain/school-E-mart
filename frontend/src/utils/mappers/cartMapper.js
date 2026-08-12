import { formatRupee, resolveProductImage } from './productMapper';

const PRODUCT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400&h=400&fit=crop';

const isUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

const resolveCartItemImage = (item, product) => {
  if (item?.image && typeof item.image === 'string' && item.image.trim().length > 0) {
    if (!item.image.includes('photo-1523275335684-37898b6baf30')) {
      return item.image;
    }
  }
  if (product) {
    const img = resolveProductImage(product);
    if (img && !img.includes('photo-1523275335684-37898b6baf30')) return img;
  }
  return null;
};

export const mapCartItemFromApi = (item, product = null) => {
  const id = item?.productId?.toString?.() || item?.productId;
  const variantId = item?.variantId?.toString?.() || item?.variantId;

  return {
    id,
    productId: id,
    variantId,
    name: item?.name || product?.name || 'Product',
    price: formatRupee(item?.pricePaise ?? product?.pricePaise ?? 0),
    pricePaise: item?.pricePaise ?? product?.pricePaise ?? 0,
    originalPrice: item?.mrpPaise ? formatRupee(item.mrpPaise) : null,
    originalPricePaise: item?.mrpPaise,
    image: resolveCartItemImage(item, product),
    quantity: item?.quantity ?? 1,
    size: item?.size,
    sku: item?.sku,
  };
};

export const mapCartItemsFromApi = (items = [], products = []) => {
  const productMap = new Map(
    products.map((product) => [product?._id?.toString?.() || product?.id, product])
  );

  return items.map((item) => {
    const productId = item?.productId?.toString?.() || item?.productId;
    return mapCartItemFromApi(item, productMap.get(productId));
  });
};

export const productToCartPayload = (product, quantity = 1) => ({
  productId: product?.productId || product?.id,
  quantity: quantity ?? 1,
  ...(product?.variantId ? { variantId: product.variantId } : {}),
  ...(product?.selectedSize || product?.size
    ? { size: product.selectedSize || product.size }
    : {}),
  // Kit-only: the parent's per-item size/color picks, see KitDetailsPage.
  ...(product?.kitSelections?.length ? { kitSelections: product.kitSelections } : {}),
});

export const findCartLine = (items, productId, variantId) =>
  items.find(
    (item) =>
      String(item.id) === String(productId) &&
      String(item.variantId || '') === String(variantId || '')
  );
