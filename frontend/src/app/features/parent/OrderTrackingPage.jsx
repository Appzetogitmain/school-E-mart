import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw,
  Home, ShieldCheck,
  HelpCircle, XCircle,
  Package, Loader2, FileText,
} from 'lucide-react';
import {
  trackOrder, getOrder, cancelOrder, getInvoice,
} from '../../../services/ordersApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import {
  canCustomerCancelOrder,
  formatOrderStatus,
  mapOrderForDetail,
  mapTrackOrderResult,
} from '../../../utils/mappers/orderMapper';
import { formatRupee } from '../../../utils/mappers/productMapper';
import useAuthStore from '../../../store/useAuthStore';
import InvoiceModal from '../../../components/InvoiceModal';

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId: orderNumberParam } = useParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  const orderMongoId = location.state?.orderId;

  const handleViewInvoice = async (targetOrderId) => {
    const idToFetch = targetOrderId || orderMongoId;
    if (!idToFetch) return;
    setInvoiceModalOpen(true);
    setInvoiceLoading(true);
    setInvoiceError('');
    try {
      const data = await getInvoice(idToFetch);
      setInvoiceData(data);
    } catch (err) {
      setInvoiceError(getErrorMessage(err, 'Unable to load invoice receipt'));
    } finally {
      setInvoiceLoading(false);
    }
  };

  const loadOrderData = useCallback(async (isRefresh = false) => {
    if (!orderNumberParam) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const trackPayload = await trackOrder(orderNumberParam);
      const mappedTrack = mapTrackOrderResult(trackPayload);
      setTracking(mappedTrack);

      if (isAuthenticated && orderMongoId) {
        const order = await getOrder(orderMongoId);
        setOrderDetails(mapOrderForDetail(order));
      } else if (trackPayload?.order) {
        setOrderDetails({
          orderNumber: trackPayload.order.orderNumber,
          orderStatus: trackPayload.order.orderStatus,
          statusLabel: formatOrderStatus(trackPayload.order.orderStatus),
          paymentMethod: trackPayload.order.paymentStatus === 'paid' ? 'ONLINE PAYMENT' : 'CASH ON DELIVERY',
          address: location.state?.address || '',
          subtotal: location.state?.subtotal,
          shipping: location.state?.shipping,
          totalAmount: location.state?.totalAmount,
          itemsCount: location.state?.itemsCount || 1,
        });
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load order details'));
      setTracking(null);
      setOrderDetails(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, orderMongoId, orderNumberParam, location.state]);

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  const handleCancel = async () => {
    if (!orderMongoId || !canCustomerCancelOrder(orderDetails?.orderStatus)) return;
    const reason = window.prompt('Reason for cancellation (optional)') || 'Cancelled by customer';
    if (reason === null) return;

    setCancelling(true);
    try {
      const cancelled = await cancelOrder(orderMongoId, reason);
      setOrderDetails(mapOrderForDetail(cancelled));
      await loadOrderData(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to cancel this order'));
    } finally {
      setCancelling(false);
    }
  };

  const displayNumber = orderDetails?.orderNumber || orderNumberParam;
  const statusLabel = orderDetails?.statusLabel || tracking?.statusLabel || 'Order Placed';
  const canCancel = isAuthenticated && orderMongoId && canCustomerCancelOrder(orderDetails?.orderStatus);

  const formatAmount = (value) => {
    if (value === undefined || value === null) return '—';
    return formatRupee(Number(value) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center font-outfit">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium">Loading order...</span>
        </div>
      </div>
    );
  }

  if (error && !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center font-outfit px-6 text-center">
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button
          onClick={() => navigate('/user/orders')}
          className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-outfit pb-24">
      <div className="bg-primary text-white px-6 pt-8 pb-10 rounded-b-[40px] relative shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Order Details</h2>
            <p className="text-[12px] font-bold">#{displayNumber}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadOrderData(true)}
              disabled={refreshing}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-60"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black mb-4 tracking-tight uppercase">{statusLabel}</h1>
          <div className="inline-flex items-center bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
            <span className="text-[10px] font-black uppercase tracking-widest">
              {orderDetails?.paymentMethod === 'ONLINE PAYMENT' ? 'Paid Online' : 'Pay at Delivery'}
            </span>
          </div>
        </div>
      </div>

      {tracking?.steps?.length > 0 && (
        <div className="px-4 mt-4 relative z-10 mb-4">
          <div className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100">
            <h3 className="text-xs font-black text-deep-purple uppercase tracking-widest mb-4">Delivery Timeline</h3>
            <div className="space-y-4">
              {tracking.steps.map((step, index) => (
                <div key={`${step.title}-${index}`} className="flex gap-4">
                  <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${step.completed ? 'bg-primary' : 'bg-gray-200'}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${step.active ? 'text-primary' : 'text-deep-purple'}`}>{step.title}</p>
                    <p className="text-[11px] text-gray-400">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-[#FFF9C4] p-4 rounded-2xl border-2 border-white shadow-sm flex flex-col gap-1">
          <h3 className="text-[11px] font-black text-[#F57F17] uppercase tracking-widest">
            {orderDetails?.paymentMethod === 'ONLINE PAYMENT'
              ? 'PAID ONLINE'
              : `PAY AT DELIVERY: ${formatAmount(orderDetails?.totalAmount)}`}
          </h3>
          <p className="text-[10px] text-[#FBC02D] font-bold">Payment status: {orderDetails?.raw?.paymentStatus || 'pending'}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <Package size={24} />
          </div>
          <span className="text-xs font-black text-deep-purple uppercase tracking-tight">
            {statusLabel}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <ShieldCheck size={24} />
          </div>
          <span className="text-xs font-black text-deep-purple uppercase tracking-tight">Order verified</span>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <Home size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-deep-purple">Delivery Address</h3>
              <p className="text-[12px] text-gray-400 font-medium">{orderDetails?.address || '—'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                <Package size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-deep-purple uppercase tracking-tight">Bill Summary</h3>
                <p className="text-[10px] text-gray-400 font-bold">#{displayNumber} • {orderDetails?.itemsCount || 1} Items</p>
              </div>
            </div>
            {orderMongoId && (
              <button
                type="button"
                onClick={() => handleViewInvoice(orderMongoId)}
                className="px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <FileText size={14} />
                <span>Invoice</span>
              </button>
            )}
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
              <span>Subtotal</span>
              <span className="text-gray-500">{formatAmount(orderDetails?.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
              <span>Shipping</span>
              <span className="text-gray-500">{formatAmount(orderDetails?.shipping)}</span>
            </div>
            <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
              <span className="text-xs font-black text-deep-purple uppercase tracking-[0.2em]">Payable Amount</span>
              <span className="text-xl font-black text-black">{formatAmount(orderDetails?.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
          <button
            type="button"
            onClick={() => navigate('/user/contact')}
            className="w-full p-4 flex items-center justify-between group active:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-deep-purple">Need Help?</h3>
                <p className="text-[12px] text-gray-400 font-medium">Contact support</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={!canCancel || cancelling}
            className={`w-full p-4 flex items-center justify-between group active:bg-gray-50 transition-colors text-left ${canCancel ? '' : 'opacity-50 cursor-not-allowed'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <XCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-500">
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </h3>
                <p className="text-[12px] text-gray-400 font-medium">
                  {canCancel ? 'Available before processing starts' : 'Not available for this status'}
                </p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={() => navigate('/user/orders')}
          className="w-full py-4 text-center text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] active:text-primary transition-colors mb-8"
        >
          View All Orders
        </button>
      </div>

      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoiceData={invoiceData}
        loading={invoiceLoading}
        error={invoiceError}
      />
    </div>
  );
};

export default OrderTrackingPage;
