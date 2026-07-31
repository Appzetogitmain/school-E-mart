import {
  formatOrderDateShort,
  formatOrderStatus,
  paiseToRupees,
} from './orderMapper';
import { formatRupee } from './productMapper';

export const getVendorOrderStatusStyle = (status = '') => {
  const normalized = String(status).toLowerCase();
  if (normalized === 'delivered') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (['shipped', 'out_for_delivery'].includes(normalized)) {
    return 'bg-sky-50 text-sky-700 border-sky-100';
  }
  if (['placed', 'accepted', 'processed', 'packed'].includes(normalized)) {
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }
  if (normalized === 'cancelled') return 'bg-red-50 text-red-600 border-red-100';
  return 'bg-gray-50 text-gray-500 border-gray-150';
};

const sumVendorItemsPaise = (order) => {
  const items = order?.vendorItems || order?.items || [];
  return items.reduce((sum, item) => sum + (item.lineTotalPaise || 0), 0);
};

const mapVendorOrderItems = (items = []) =>
  items.map((item, index) => ({
    itemIndex: index,
    srNo: item.sku?.slice(-4) || String(index + 1).padStart(4, '0'),
    name: item.name,
    unit: item.size || 'unit',
    price: paiseToRupees(item.pricePaise),
    tax: `${paiseToRupees(item.taxPaise || 0).toFixed(2)} (${item.taxRatePercent || 0}%)`,
    qty: item.quantity,
    isKit: Boolean(item.kitId),
    kitItems: (item.kitItems || []).map((kitItem, kitItemIndex) => ({
      kitItemIndex,
      name: kitItem.name,
      category: kitItem.category,
      subcategory: kitItem.subcategory,
      qty: kitItem.qty,
      packed: Boolean(kitItem.packed),
    })),
  }));

export const mapVendorOrderForList = (order) => {
  const amountPaise = sumVendorItemsPaise(order) || order?.totalPaise || 0;

  return {
    id: order?.orderNumber,
    mongoId: order?._id?.toString?.() || order?.id,
    deliveryDate: formatOrderDateShort(order?.deliveredAt || order?.placedAt),
    orderDate: formatOrderDateShort(order?.placedAt || order?.audit?.createdAt),
    status: formatOrderStatus(order?.orderStatus),
    statusRaw: order?.orderStatus,
    statusColor: getVendorOrderStatusStyle(order?.orderStatus),
    amount: paiseToRupees(amountPaise),
    school: order?.address?.name || order?.address?.city || 'Customer',
    phone: order?.address?.phone || '—',
    email: order?.address?.email || '—',
    website: '',
    timeSlot: order?.deliveryType === 'school' ? 'School Pickup' : 'Home Delivery',
    items: mapVendorOrderItems(order?.items || []).slice(0, 5),
    raw: order,
  };
};

export const mapVendorOrderForDetail = (order) => {
  const items = order?.vendorItems || order?.items || [];
  const amountPaise = sumVendorItemsPaise({ ...order, vendorItems: items });

  return {
    ...mapVendorOrderForList(order),
    items: mapVendorOrderItems(items),
    amount: paiseToRupees(amountPaise),
    address: [order?.address?.line1, order?.address?.city, order?.address?.pinCode]
      .filter(Boolean)
      .join(', '),
    paymentMethod: order?.paymentMethod === 'online' ? 'ONLINE PAYMENT' : 'CASH ON DELIVERY',
    raw: order,
  };
};

export const getVendorOrderActions = (status = '') => {
  const normalized = String(status).toLowerCase();
  if (normalized === 'placed') {
    return [
      { key: 'accept', label: 'Accept Order', variant: 'primary' },
      { key: 'reject', label: 'Reject Order', variant: 'danger' },
    ];
  }
  if (normalized === 'accepted') {
    return [{ key: 'process', label: 'Start Processing', variant: 'primary' }];
  }
  if (normalized === 'processed') {
    return [{ key: 'dispatch', label: 'Mark Ready for Dispatch', variant: 'primary' }];
  }
  if (normalized === 'packed') {
    return [{ key: 'shipped', label: 'Mark Shipped', variant: 'primary' }];
  }
  if (normalized === 'shipped') {
    return [{ key: 'out_for_delivery', label: 'Out for Delivery', variant: 'primary' }];
  }
  if (normalized === 'out_for_delivery') {
    return [{ key: 'delivered', label: 'Mark Delivered', variant: 'primary' }];
  }
  return [];
};

export const formatVendorAmount = (rupees) => formatRupee(Number(rupees || 0) * 100);

export const VENDOR_STATUS_FILTER_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Placed', value: 'placed' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Processing', value: 'processed' },
  { label: 'Packed', value: 'packed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];
