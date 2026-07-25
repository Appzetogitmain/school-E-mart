import { formatRupee } from './productMapper';
import { paiseToRupees } from './orderMapper';

const APPROVAL_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const resolveImageUrl = (img) => {
  if (!img) return null;
  if (typeof img === 'string') {
    if (img.startsWith('http') || img.startsWith('blob:')) return img;
    return `http://localhost:5000${img.startsWith('/') ? '' : '/'}${img}`;
  }
  const key = img.attachmentId?.storageKey || img.storageKey || img.url || img.path;
  if (!key) return null;
  if (key.startsWith('http') || key.startsWith('blob:')) return key;
  return `http://localhost:5000${key.startsWith('/') ? '' : '/'}${key}`;
};

export const mapVendorProductForList = (product) => {
  const stock = Number(product?.stock ?? product?.inventory?.stock ?? 0);
  const lowStockThreshold = Number(product?.lowStockThreshold ?? 5);

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
    salesCount: product?.salesCount || 0,
    imageUrl: resolveImageUrl(product?.images?.[0]),
    imgBg: 'bg-purple-100 text-purple-700',
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
    // Raw ids: the edit form has to send ObjectIds back, not display names.
    headerId: product?.headerId || '',
    categoryId: product?.categoryId || '',
    subcategoryId: product?.subcategoryId || '',
    vendorId: product?.vendorId || '',
    publishStatus: product?.publishStatus || 'draft',
    stockStatus: mapped.stockStatus === 'low' ? 'Low Stock' : mapped.stockStatus === 'out' ? 'Out of Stock' : 'In Stock',
    approvalStatus: approvalLabels[mapped.approvalRaw] || 'Pending Approval',
    approvalRaw: mapped.approvalRaw,
    image: product?.images?.[0]?.url || product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=180&auto=format&fit=crop&q=60',
    vendor: product?.vendorName || product?.vendor?.storeName || '—',
    raw: product,
  };
};

export const formatVendorProductPrice = (rupees) => formatRupee(Number(rupees || 0) * 100);
