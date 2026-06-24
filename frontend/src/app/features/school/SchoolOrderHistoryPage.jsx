import React, { useEffect, useState } from 'react';
import {
  RotateCcw, Package, Building2, AlertCircle
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import SchoolHeader from '../../components/SchoolHeader';
import useAuthStore from '../../../store/useAuthStore';
import { listOrders } from '../../../services/ordersApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import {
  getOrderStatusStyle,
  mapOrderForListCard,
} from '../../../utils/mappers/orderMapper';
import * as cartApi from '../../../services/cartApi';
import { useCart } from '../../context/CartContext';

const SchoolOrderHistoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { refreshCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [schoolInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : { role: 'school' };
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reorderingId, setReorderingId] = useState(null);
  const orderPlaced = location.state?.orderPlaced;

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    listOrders({ limit: 50 }, { audience: 'school' })
      .then(({ data }) => {
        if (!cancelled) {
          setOrders((data || []).map(mapOrderForListCard));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setOrders([]);
          setError(getErrorMessage(err, 'Unable to load procurement history'));
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

  const handleReorder = async (order) => {
    setReorderingId(order.id);
    try {
      for (const item of order.raw?.items || []) {
        await cartApi.addCartItem('school', {
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          variantId: item.variantId,
        });
      }
      await refreshCart();
      navigate('/school/cart');
    } catch {
      setError('Unable to reorder this batch right now.');
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <>
      <SchoolHeader scrolled={scrolled} childInfo={schoolInfo} />
      <div onScroll={handleScroll} className="flex flex-col h-full bg-[#f8f5f2] pb-32 font-outfit overflow-y-auto">
        <div className="h-[185px] shrink-0"></div>

        <div className="px-6 mt-6 relative z-20">
          {orderPlaced && (
            <div className="mb-4 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 font-medium">
              Bulk order {location.state?.orderNumber} placed successfully.
            </div>
          )}

          <div className="mb-6">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Institutional Records</p>
            <h2 className="text-2xl font-black text-deep-purple tracking-tight">Procurement History</h2>
          </div>

          {loading ? (
            <p className="text-center text-sm text-gray-400 py-16">Loading orders...</p>
          ) : error ? (
            <p className="text-center text-sm text-red-500 py-16">{error}</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm mb-6">No institutional orders yet.</p>
              <button
                onClick={() => navigate('/school/admin')}
                className="px-8 py-3 bg-primary text-white rounded-2xl text-xs font-bold"
              >
                Start Procurement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Order ID</span>
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border flex items-center gap-2 ${getOrderStatusStyle(order.status)}`}>
                          <Package size={12} />
                          <span>{order.statusLabel}</span>
                        </span>
                      </div>
                      <h3 className="text-base font-black text-deep-purple tracking-tight">{order.orderNumber}</h3>
                      <p className="text-[11px] text-gray-400 font-medium">{order.date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xl font-black text-deep-purple">{order.price}</span>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded-md">
                        {order.itemCount} Units Ordered
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50">
                    <div className="flex -space-x-3">
                      {order.items.slice(0, 1).map((item) => (
                        <div key={item.id} className="w-12 h-12 rounded-2xl bg-gray-50 border-2 border-white overflow-hidden shadow-sm flex items-center justify-center p-2">
                          <img src={item.image} alt={item.name || 'product'} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleReorder(order)}
                      disabled={reorderingId === order.id}
                      className="bg-primary hover:bg-[#eeb100] text-white text-[11px] font-black px-6 py-3 rounded-2xl shadow-lg active:scale-90 transition-all flex items-center gap-2 uppercase tracking-tighter disabled:opacity-60"
                    >
                      <RotateCcw size={14} strokeWidth={3} />
                      {reorderingId === order.id ? 'Adding...' : 'Reorder Batch'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 mb-12 bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Building2 size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-deep-purple mb-1">Bulk Order Support</h4>
              <p className="text-[10px] text-gray-400 max-w-[180px]">Need help with a large procurement? Our institutional experts are ready to assist.</p>
            </div>
            <button className="w-full py-3.5 bg-deep-purple text-white rounded-2xl text-[11px] font-bold shadow-lg active:scale-95 transition-all">
              Contact Procurement Desk
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SchoolOrderHistoryPage;
