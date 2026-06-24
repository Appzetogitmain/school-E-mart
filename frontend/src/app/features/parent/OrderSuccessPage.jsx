import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2, MapPin, ArrowRight, Loader2,
} from 'lucide-react';
import { getOrder } from '../../../services/ordersApi';
import {
  formatOrderStatus,
  mapOrderForDetail,
} from '../../../utils/mappers/orderMapper';
import useAuthStore from '../../../store/useAuthStore';

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showToast, setShowToast] = useState(true);
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(() => location.state || null);
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const pieces = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      size: Math.random() * 8 + 4,
      color: ['#6C4EFF', '#FFC107', '#4CAF50', '#FF5252', '#2196F3'][Math.floor(Math.random() * 5)],
    }));
    setConfetti(pieces);

    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const orderId = location.state?.orderId;
    if (!orderId || !isAuthenticated) return undefined;

    let cancelled = false;
    setLoading(true);

    getOrder(orderId)
      .then((order) => {
        if (!cancelled && order) {
          setOrderDetails(mapOrderForDetail(order));
        }
      })
      .catch(() => {
        if (!cancelled && location.state) {
          setOrderDetails(location.state);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, location.state]);

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-outfit px-6 text-center">
        <p className="text-gray-500 text-sm mb-4">Order details are unavailable.</p>
        <button
          onClick={() => navigate('/user/orders')}
          className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold"
        >
          View Orders
        </button>
      </div>
    );
  }

  const trackNumber = orderDetails.orderNumber || orderDetails.orderId;
  const paymentLabel = orderDetails.paymentMethod || 'CASH ON DELIVERY';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center relative overflow-hidden font-outfit">
      <style>
        {`
          @keyframes fall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
          }
          .confetti {
            position: absolute;
            top: -10px;
            animation: fall 4s linear infinite;
          }
          @keyframes bounce-subtle {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .animate-bounce-subtle {
            animation: bounce-subtle 3s ease-in-out infinite;
          }
          @keyframes toast-in {
            0% { transform: translateY(-100%); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          .toast-animation {
            animation: toast-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}
      </style>

      {confetti.map((c) => (
        <div
          key={c.id}
          className="confetti"
          style={{
            left: `${c.left}%`,
            animationDelay: `${c.delay}s`,
            width: `${c.size}px`,
            height: `${c.size}px`,
            backgroundColor: c.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}

      {showToast && (
        <div className="fixed top-12 inset-x-0 mx-auto w-max z-[100] bg-[#2E7D32] text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl border-2 border-white/20 toast-animation">
          <CheckCircle2 size={24} />
          <span className="font-bold text-sm tracking-tight">Order placed successfully!</span>
        </div>
      )}

      <div className="flex-1 w-full max-w-md flex flex-col items-center pt-10 px-6 z-10">
        <div className="relative mb-8">
          <div className="w-36 h-36 rounded-full bg-gray-50 border-8 border-gray-100 flex items-center justify-center animate-bounce-subtle overflow-hidden">
            <img src="/assets/logo.jpeg" alt="Logo" className="w-20 h-20 object-contain rounded-3xl" />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-50 flex items-center gap-2">
            <MapPin size={16} className="text-[#FF5252]" />
            <span className="font-black text-deep-purple uppercase tracking-widest text-sm">
              {orderDetails.city || 'Delivery'}
            </span>
          </div>
        </div>

        <p className="text-gray-400 text-[13px] font-medium text-center max-w-[280px] leading-relaxed mb-4">
          {orderDetails.address || 'Your delivery address is on file.'}
        </p>

        <div className="space-y-2 w-full flex flex-col items-center mb-6">
          <div className="bg-gray-50 px-4 py-1.5 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Loading order...
              </span>
            ) : (
              <>ID: {trackNumber}</>
            )}
          </div>
          <div className="bg-[#FFF9C4] px-6 py-2.5 rounded-2xl text-[11px] font-black text-[#F57F17] uppercase tracking-widest border-2 border-white shadow-lg">
            PAYMENT: {paymentLabel}
          </div>
          {orderDetails.statusLabel && (
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Status: {orderDetails.statusLabel || formatOrderStatus(orderDetails.orderStatus)}
            </div>
          )}
        </div>

        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-black text-deep-purple tracking-tight">Order Placed!</h1>
          <p className="text-gray-400 text-sm italic font-medium">
            Your school essentials are on their way to you...
          </p>
        </div>

        <button
          onClick={() => navigate(`/user/track-order/${trackNumber}`, {
            state: { orderId: orderDetails.id, orderNumber: trackNumber },
          })}
          className="w-full py-5 bg-primary text-white font-black text-base rounded-2xl shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all uppercase tracking-widest flex items-center justify-center gap-3"
        >
          Track Your Order <ArrowRight size={20} />
        </button>
      </div>

      <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-4 shrink-0"></div>
    </div>
  );
};

export default OrderSuccessPage;
