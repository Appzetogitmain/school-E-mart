import { formatRupee } from './productMapper';
import { paiseToRupees } from './orderMapper';

const APPROVAL_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const mapVendorProductForList = (product) => {
  const stock = Number(product?.stock ?? product?.inventory?.stock ?? 0);
  const lowStockThreshold = Number(product?.lowStockThreshold ?? 5);

  return {
    id: product?._id?.toString?.() || product?.id,
    name: product?.name,
    code: product?.sku,
    header: product?.headerName || 'Catalog',
    category: product?.categoryName || 'General',
    subcategory: product?.subcategoryName || '—',
    variant: product?.sizes?.[0] || 'Standard',
    approval: APPROVAL_LABELS[product?.approvalStatus] || 'Pending',
    approvalRaw: product?.approvalStatus,
    publishStatus: product?.publishStatus,
    stock,
    lowStockThreshold,
    stockStatus: stock === 0 ? 'out' : stock <= lowStockThreshold ? 'low' : 'ok',
    price: paiseToRupees(product?.pricePaise),
    salesCount: product?.salesCount || 0,
    imgBg: 'bg-purple-100 text-purple-700',
    raw: product,
  };
};

export const mapVendorProductForStock = (product) => mapVendorProductForList(product);

export const formatVendorProductPrice = (rupees) => formatRupee(Number(rupees || 0) * 100);
