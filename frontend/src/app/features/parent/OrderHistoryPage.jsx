import React, { useEffect, useState } from 'react';
import {
  RotateCcw, CheckCircle2, AlertCircle, Clock, Package, FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import LoginRequired from '../../components/LoginRequired';
import AuthPrompt from '../../components/AuthPrompt';
import InvoiceModal from '../../../components/InvoiceModal';
import useAuthStore from '../../../store/useAuthStore';
import { listOrders, getInvoice } from '../../../services/ordersApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import {
  getOrderStatusStyle,
  mapOrderForListCard,
} from '../../../utils/mappers/orderMapper';
import * as cartApi from '../../../services/cartApi';
import { getMarketplaceAudience } from '../../../utils/marketplaceAudience';
import { useCart } from '../../context/CartContext';

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { refreshCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [childInfo, setChildInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : {
      name: 'Guest',
      school: 'Explore Schools',
      grade: 'Select Grade',
    };
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reorderingId, setReorderingId] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  const handleViewInvoice = async (orderId, e) => {
    if (e) e.stopPropagation();
    setInvoiceModalOpen(true);
    setInvoiceLoading(true);
    setInvoiceError('');
    try {
      const data = await getInvoice(orderId);
      setInvoiceData(data);
    } catch (err) {
      setInvoiceError(getErrorMessage(err, 'Unable to load invoice receipt'));
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('childInfo');
      if (saved) setChildInfo(JSON.parse(saved));
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    listOrders({ limit: 50 }, { audience: 'parent' })
      .then(({ data }) => {
        if (!cancelled) {
          setOrders((data || []).map(mapOrderForListCard));
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setOrders([]);
          setError(getErrorMessage(err, 'Unable to load orders'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleScroll = (e) => {
    setScrolled(e.target.scrollTop > 50);
  };

  const getStatusIcon = (status) => {
    const normalized = String(status).toLowerCase();
    if (normalized === 'delivered') return <CheckCircle2 size={12} />;
    if (['shipped', 'out_for_delivery'].includes(normalized)) return <Package size={12} />;
    return <Clock size={12} />;
  };

  const handleReorder = async (order) => {
    setReorderingId(order.id);
    try {
      const audience = getMarketplaceAudience();
      for (const item of order.raw?.items || []) {
        await cartApi.addCartItem(audience, {
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          variantId: item.variantId,
        });
      }
      await refreshCart();
      navigate('/user/cart');
    } catch {
      setError('Unable to reorder items right now.');
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <>
      <AppHeader scrolled={scrolled} childInfo={childInfo} />
      <div
        onScroll={handleScroll}
        className="flex flex-col h-full bg-[#f8f5f2] pb-32 font-outfit overflow-y-auto"
      >
        <div className="h-[140px] shrink-0"></div>

        {!isAuthenticated ? (
          <div className="px-6 mt-6">
            <LoginRequired
              title="Track Your Orders"
              message="Login to view your order history, track active deliveries, and reorder your favorites."
            />
          </div>
        ) : (
          <div className="px-6 mt-6 relative z-20">
            <div className="mb-6">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Your Journey</p>
              <h2 className="text-2xl font-black text-deep-purple tracking-tight">Recent Orders</h2>
            </div>

            {loading ? (
              <p className="text-center text-sm text-gray-400 py-16">Loading orders...</p>
            ) : error ? (
              <p className="text-center text-sm text-red-500 py-16">{error}</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm mb-6">You have not placed any orders yet.</p>
                <button
                  onClick={() => navigate('/user/home')}
                  className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100/50 active:scale-[0.99] transition-all cursor-pointer"
                    onClick={() => navigate(`/user/track-order/${order.orderNumber}`, {
                      state: { orderId: order.id, orderNumber: order.orderNumber },
                    })}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Order ID</span>
                          <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border flex items-center gap-2 ${getOrderStatusStyle(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span>{order.statusLabel}</span>
                          </span>
                        </div>
                        <h3 className="text-base font-black text-deep-purple tracking-tight">#{order.orderNumber}</h3>
                        <p className="text-[11px] text-gray-400 font-medium">{order.date}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xl font-black text-deep-purple">{order.price}</span>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded-md">
                          {order.itemCount} {order.itemCount === 1 ? 'Item' : 'Items'} Ordered
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50">
                      <div className="flex -space-x-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="w-12 h-12 rounded-2xl bg-gray-50 border-2 border-white overflow-hidden shadow-sm flex items-center justify-center p-2">
                            <img src={item.image} alt={item.name || 'product'} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(event) => handleViewInvoice(order.id, event)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold px-4 py-3 rounded-2xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <FileText size={14} />
                          <span>Invoice</span>
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleReorder(order);
                          }}
                          disabled={reorderingId === order.id}
                          className="bg-primary hover:bg-[#eeb100] text-white text-[11px] font-black px-5 py-3 rounded-2xl shadow-lg active:scale-90 transition-all flex items-center gap-2 uppercase tracking-tighter disabled:opacity-60 cursor-pointer"
                        >
                          <RotateCcw size={14} strokeWidth={3} />
                          {reorderingId === order.id ? 'Adding...' : 'Order Again'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-10 mb-12 bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-deep-purple mb-1">Issue with an order?</h4>
                <p className="text-[10px] text-gray-400 max-w-[180px]">Our support team is here to help you 24/7 with any queries.</p>
              </div>
              <button
                onClick={() => navigate('/user/contact')}
                className="w-full py-3.5 bg-deep-purple text-white rounded-2xl text-[11px] font-bold shadow-lg active:scale-95 transition-all"
              >
                Get Help
              </button>
            </div>
          </div>
        )}
      </div>
      <AuthPrompt
        isOpen={isAuthPromptOpen}
        onClose={() => setIsAuthPromptOpen(false)}
        title="Track Your Orders"
        message="Login to see your past orders, active shipments, and digital invoices."
      />
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoiceData={invoiceData}
        loading={invoiceLoading}
        error={invoiceError}
      />
    </>
  );
};

export default OrderHistoryPage;
