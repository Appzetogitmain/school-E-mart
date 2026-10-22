import { formatRupee, resolveProductImage, PRODUCT_PLACEHOLDER } from './productMapper';
import { toAbsoluteUrl } from '../url';

const resolveCartItemImage = (item, product) => {
  if (item?.image && typeof item.image === 'string' && item.image.trim().length > 0) {
    if (item.image !== PRODUCT_PLACEHOLDER) {
      return toAbsoluteUrl(item.image);
    }
  }
  if (product) {
    const img = resolveProductImage(product);
    if (img && img !== PRODUCT_PLACEHOLDER) return img;
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
