import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Download, ChevronRight,
  ChevronLeft, FileSpreadsheet, FileText, Truck,
  Eye, Loader2,
} from 'lucide-react';
import {
  listVendorOrders,
  getVendorOrder,
  acceptVendorOrder,
  rejectVendorOrder,
  processVendorOrder,
  markVendorOrderReadyForDispatch,
  updateVendorOrderStatus,
} from '../../services/vendorApi';
import { getErrorMessage } from '../../utils/apiHelpers';
import {
  getVendorOrderActions,
  mapVendorOrderForDetail,
  mapVendorOrderForList,
  VENDOR_STATUS_FILTER_OPTIONS,
} from '../../utils/mappers/vendorOrderMapper';

const VendorOrders = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        limit: 100,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(fromDate ? { from: new Date(fromDate).toISOString() } : {}),
        ...(toDate ? { to: new Date(`${toDate}T23:59:59`).toISOString() } : {}),
      };
      const { data } = await listVendorOrders(params);
      setOrders((data || []).map(mapVendorOrderForList));
    } catch (err) {
      setOrders([]);
      setError(getErrorMessage(err, 'Unable to load orders'));
    } finally {
      setLoading(false);
    }
  }, [fromDate, searchQuery, statusFilter, toDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openOrderDetail = async (order) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    try {
      const fullOrder = await getVendorOrder(order.mongoId);
      setSelectedOrder(mapVendorOrderForDetail(fullOrder));
    } catch {
      setSelectedOrder(order);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshSelectedOrder = async (mongoId) => {
    const fullOrder = await getVendorOrder(mongoId);
    const mapped = mapVendorOrderForDetail(fullOrder);
    setSelectedOrder(mapped);
    setOrders((prev) =>
      prev.map((order) => (order.mongoId === mongoId ? mapVendorOrderForList(fullOrder) : order))
    );
  };

  const handleOrderAction = async (actionKey) => {
    if (!selectedOrder?.mongoId) return;
    setActionLoading(true);
    setError('');

    try {
      const orderId = selectedOrder.mongoId;
      switch (actionKey) {
        case 'accept':
          await acceptVendorOrder(orderId);
          break;
        case 'reject': {
          const reason = window.prompt('Reason for rejection (optional)') || 'Rejected by vendor';
          if (reason === null) return;
          await rejectVendorOrder(orderId, reason);
          break;
        }
        case 'process':
          await processVendorOrder(orderId);
          break;
        case 'dispatch':
          await markVendorOrderReadyForDispatch(orderId);
          break;
        case 'shipped':
          await updateVendorOrderStatus(orderId, { status: 'shipped' });
          break;
        case 'out_for_delivery':
          await updateVendorOrderStatus(orderId, { status: 'out_for_delivery' });
          break;
        case 'delivered':
          await updateVendorOrderStatus(orderId, { status: 'delivered' });
          break;
        default:
          break;
      }
      await refreshSelectedOrder(orderId);
      await loadOrders();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update order'));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = useMemo(() => orders, [orders]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    return filteredOrders.slice(startIndex, startIndex + limit);
  }, [filteredOrders, currentPage, limit]);

  const totalPages = Math.ceil(filteredOrders.length / limit) || 1;
  const orderActions = selectedOrder
    ? getVendorOrderActions(selectedOrder.statusRaw || selectedOrder.raw?.orderStatus)
    : [];

  if (selectedOrder) {
    return (
      <div className="space-y-6 pb-12 relative animate-fade-in font-sans text-gray-900 selection:bg-purple-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedOrder(null)}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-purple-200 rounded-xl text-xs font-bold text-gray-600 hover:text-[#5B3FD6] transition-all flex items-center gap-1.5 shadow-sm"
            >
              ← Back to Orders list
            </button>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">View Order Details</h1>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 w-full xl:flex-1">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading order...
              </div>
            ) : (
              orderActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleOrderAction(action.key)}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-60 ${
                    action.variant === 'danger'
                      ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                      : 'bg-[#5B3FD6] text-white hover:bg-[#472fc2]'
                  }`}
                >
                  {actionLoading ? 'Updating...' : action.label}
                </button>
              ))
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full xl:w-auto justify-start xl:justify-end">
            <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${selectedOrder.statusColor}`}>
              {selectedOrder.status}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[1.5rem] shadow-sm p-6 md:p-8 space-y-8 relative overflow-hidden">
          <div className="bg-blue-50/60 border border-blue-100/50 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Truck size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest block">
                {selectedOrder.status?.toUpperCase()} ORDER
              </span>
              <span className="text-xs font-extrabold text-blue-800 mt-1 block">
                {selectedOrder.timeSlot} • {selectedOrder.address || selectedOrder.school}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-6 pt-2">
            <div className="space-y-3.5">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedOrder.school}</h2>
              <div className="text-xs text-gray-500 font-medium space-y-1.5 leading-relaxed">
                <p><span className="text-gray-400 font-bold">Phone:</span> {selectedOrder.phone}</p>
                <p><span className="text-gray-400 font-bold">Payment:</span> {selectedOrder.paymentMethod}</p>
              </div>
            </div>

            <div className="text-left md:text-right space-y-2 text-xs">
              <p className="text-gray-400 font-bold">Date: {selectedOrder.orderDate}</p>
              <h3 className="text-lg font-black text-gray-900 tracking-tight pt-1">
                Invoice #{selectedOrder.id}
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <th className="px-6 py-4">SR. NO.</th>
                  <th className="px-6 py-4">PRODUCT</th>
                  <th className="px-6 py-4">UNIT</th>
                  <th className="px-6 py-4">PRICE</th>
                  <th className="px-6 py-4 text-center">QTY</th>
                  <th className="px-6 py-4 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700 font-semibold">
                {selectedOrder.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-mono">{item.srNo}</td>
                    <td className="px-6 py-4 font-black text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-500">{item.unit}</td>
                    <td className="px-6 py-4">₹{item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center font-bold">{item.qty}</td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">₹{(item.qty * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4">
            <div className="w-full max-w-[380px] bg-[#FCFCFD] border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Order Total:</span>
                <span className="font-black text-gray-950">₹{selectedOrder.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 relative animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Orders List</h1>
        </div>
        <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
          <span>Home</span>
          <ChevronRight size={12} />
          <span className="text-[#5B3FD6]">Orders List</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-[1.5rem] shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-gray-50 bg-[#FCFCFD]">
          <h2 className="font-extrabold text-sm text-gray-800 mb-4">View Order List</h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-2 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] cursor-pointer"
              />
            </div>

            <div className="lg:col-span-2 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] cursor-pointer"
              />
            </div>

            <div className="lg:col-span-3 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] cursor-pointer"
              >
                {VENDOR_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                className="w-full px-2.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] cursor-pointer text-center"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="lg:col-span-3 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by order number..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] placeholder-gray-400 font-medium"
              />
            </div>

            <div className="lg:col-span-1 relative">
              <button
                type="button"
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 hover:border-[#5B3FD6]/20 bg-white hover:bg-purple-50/30 text-xs font-bold text-gray-700 hover:text-[#5B3FD6] transition-all"
              >
                <Download size={14} /> Export
              </button>
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 p-1.5 z-30">
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg text-gray-600 hover:bg-gray-50">
                    <FileSpreadsheet size={14} className="text-emerald-600" /> Excel (.xlsx)
                  </button>
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg text-gray-600 hover:bg-gray-50">
                    <FileText size={14} className="text-blue-600" /> PDF Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white space-y-3">
              <div className="w-8 h-8 border-4 border-[#5B3FD6] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading Orders Log...</span>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <th className="px-6 py-4">O. Id</th>
                  <th className="px-6 py-4">D. Date</th>
                  <th className="px-6 py-4">O. Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <tr key={order.mongoId || order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-black text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 text-gray-500">{order.deliveryDate}</td>
                      <td className="px-6 py-4 text-gray-500">{order.orderDate}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${order.statusColor}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-900">₹{order.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openOrderDetail(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-[#5B3FD6]/10 text-gray-600 hover:text-[#5B3FD6] text-xs font-bold border border-gray-100 hover:border-transparent transition-all"
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold bg-white">
                      No orders found matching the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-[#FCFCFD]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Showing page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorOrders;
