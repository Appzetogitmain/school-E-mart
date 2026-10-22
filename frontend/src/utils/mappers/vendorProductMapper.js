import { formatRupee, resolveProductImage } from './productMapper';
import { paiseToRupees } from './orderMapper';
import { toAbsoluteUrl } from '../url';

const APPROVAL_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const resolveImageUrl = (img) => {
  if (!img) return null;
  if (typeof img === 'string') {
    return toAbsoluteUrl(img) || null;
  }
  const key = img.attachmentId?.storageKey || img.storageKey || img.url || img.path;
  return toAbsoluteUrl(key) || null;
};

export const mapVendorProductForList = (product) => {
  const stock = Number(product?.stock ?? product?.inventory?.stock ?? 0);
  const lowStockThreshold = Number(product?.lowStockThreshold ?? 5);
  const images = (product?.images || [])
    .map((img) => ({
      attachmentId:
        img?.attachmentId?._id?.toString?.() ||
        (typeof img?.attachmentId === 'string' ? img.attachmentId : img?._id?.toString?.() || ''),
      url: resolveImageUrl(img) || '',
      alt: img?.alt || '',
    }))
    .filter((img) => img.attachmentId || img.url);

  return {
    id: product?._id?.toString?.() || product?.id,
    name: product?.name,
    code: product?.sku,
    header: product?.headerId?.name || product?.headerName || 'Catalog',
    category: product?.categoryId?.name || product?.categoryName || 'General',
    subcategory: product?.subcategoryId?.name || product?.subcategoryName || '—',
    variant: product?.sizes?.[0] || 'Standard',
    approval: APPROVAL_LABELS[product?.approvalStatus] || 'Approved',
    approvalRaw: product?.approvalStatus,
    publishStatus: product?.publishStatus,
    stock,
    lowStockThreshold,
    stockStatus: stock === 0 ? 'out' : stock <= lowStockThreshold ? 'low' : 'ok',
    price: paiseToRupees(product?.pricePaise),
    originalPrice: product?.originalPricePaise ? paiseToRupees(product.originalPricePaise) : null,
    originalPricePaise: product?.originalPricePaise,
    salesCount: product?.salesCount || 0,
    imageUrl: resolveImageUrl(product?.images?.[0]),
    images,
    imgBg: 'bg-purple-100 text-purple-700',
    audience: product?.audience || 'users',
    gradeTags: Array.isArray(product?.gradeTags) ? product.gradeTags : [],
    raw: product,
  };
};

export const mapVendorProductForStock = (product) => mapVendorProductForList(product);

export const mapProductForAdminList = (product) => {
  const mapped = mapVendorProductForList(product);
  const approvalLabels = { pending: 'Pending Approval', approved: 'Approved', rejected: 'Rejected' };

  return {
    id: mapped.id,
    mongoId: mapped.id,
    name: mapped.name,
    description: product?.description || '',
    brand: product?.brand || '',
    sku: mapped.code,
    price: mapped.price,
    pricePaise: product?.pricePaise ?? 0,
    stock: mapped.stock,
    variant: mapped.variant,
    headerGroup: mapped.header,
    category: mapped.category,
    subcategory: mapped.subcategory,
    // Raw ids: normalized as clean string IDs so edit forms and filters match properly
    headerId: product?.headerId?._id ? String(product.headerId._id) : (product?.headerId ? String(product.headerId) : ''),
    categoryId: product?.categoryId?._id ? String(product.categoryId._id) : (product?.categoryId ? String(product.categoryId) : ''),
    subcategoryId: product?.subcategoryId?._id ? String(product.subcategoryId._id) : (product?.subcategoryId ? String(product.subcategoryId) : ''),
    vendorId: product?.vendorId?._id ? String(product.vendorId._id) : (product?.vendorId ? String(product.vendorId) : ''),
    publishStatus: product?.publishStatus || 'draft',
    stockStatus: mapped.stockStatus === 'low' ? 'Low Stock' : mapped.stockStatus === 'out' ? 'Out of Stock' : 'In Stock',
    approvalStatus: approvalLabels[mapped.approvalRaw] || 'Pending Approval',
    approvalRaw: mapped.approvalRaw,
    image: resolveProductImage(product),
    vendor: product?.vendorName || product?.vendor?.storeName || '—',
    audience: product?.audience || 'users',
    gradeTags: mapped.gradeTags,
    raw: product,
  };
};

export const formatVendorProductPrice = (rupees) => formatRupee(Number(rupees || 0) * 100);
