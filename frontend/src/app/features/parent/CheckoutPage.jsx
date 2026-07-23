import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ShoppingBag,
  CreditCard, Wallet, ChevronRight,
  Heart, Plus, Minus, Info, CheckCircle2,
  Building2, Truck, BadgePercent, Loader2
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { createOrder, confirmPayment } from '../../../services/ordersApi';
import { getMyWallet } from '../../../services/walletApi';
import { openRazorpayCheckout } from '../../../utils/razorpay';
import { ENV } from '../../../config/env';
import useAuthStore from '../../../store/useAuthStore';
import { useCheckoutSummary } from '../../../hooks/useCheckoutSummary';
import { mapOrderForDetail } from '../../../utils/mappers/orderMapper';
import GuestCheckoutGate from './GuestCheckoutGate';
import { isSchoolLinked } from '../../../utils/schoolLinked';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { cartItems, updateQuantity, refreshCart } = useCart();

  const [deliveryType, setDeliveryType] = useState('home');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [walletBalancePaise, setWalletBalancePaise] = useState(0);
  const [applyWallet, setApplyWallet] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    getMyWallet()
      .then((w) => setWalletBalancePaise(w?.balancePaise || 0))
      .catch(() => setWalletBalancePaise(0));
  }, [isAuthenticated]);
  const readChildInfo = () => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : { name: 'Guest', school: 'Explore Schools', grade: 'Select Grade' };
  };
  const toAddress = (parsed = {}) => ({
    name: parsed.name || 'Guest',
    phone: parsed.phone || '',
    address: parsed.address || 'Please update your delivery address in profile',
    city: parsed.city || 'Indore',
    pinCode: parsed.pinCode || '452018',
  });

  const [childInfo, setChildInfo] = useState(readChildInfo);
  const [address, setAddress] = useState(() => toAddress(readChildInfo()));

  // A guest becomes authenticated after the checkout gate; re-read the freshly
  // saved profile/address so the order uses it.
  useEffect(() => {
    if (!isAuthenticated) return;
    const info = readChildInfo();
    setChildInfo(info);
    setAddress(toAddress(info));
  }, [isAuthenticated]);

  const addressSource = useMemo(
    () => ({
      address: address.address,
      city: address.city,
      pinCode: address.pinCode,
    }),
    [address.address, address.city, address.pinCode]
  );

  const schoolIdForPickup =
    deliveryType === 'school' ? childInfo.schoolId || null : null;

  const { summary, loading: summaryLoading, error: summaryError, totals, buildPayload } =
    useCheckoutSummary({
      deliveryType,
      paymentMethod,
      addressSource,
      schoolIdForPickup,
      audience: 'parent',
      enabled: isAuthenticated && cartItems.length > 0,
    });

  const parsePrice = (item) => {
    if (item.pricePaise) return item.pricePaise / 100;
    if (typeof item.price === 'number') return item.price;
    if (typeof item.price === 'string') {
      return parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
    }
    return 0;
  };

  const fallbackSubtotal = cartItems.reduce(
    (acc, item) => acc + parsePrice(item) * item.quantity,
    0
  );
  const subtotal = totals.subtotal || fallbackSubtotal;
  const handlingCharge = totals.handlingCharge || 0;
  const deliveryCharge = totals.deliveryCharge ?? (deliveryType === 'home' ? 0 : 0);
  const grandTotal = totals.grandTotal || subtotal + handlingCharge + deliveryCharge;

  // Wallet can cover up to the whole order; the gateway/COD collects the rest.
  const grandTotalPaise = Math.round(grandTotal * 100);
  const walletAmountPaise =
    applyWallet && walletBalancePaise > 0 ? Math.min(walletBalancePaise, grandTotalPaise) : 0;
  const payableAfterWallet = (grandTotalPaise - walletAmountPaise) / 100;

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      // The guest gate overlay handles onboarding; nothing to do here.
      return;
    }

    setOrderError('');
    setIsPlacingOrder(true);

    try {
      const { order, checkout } = await createOrder(
        { ...buildPayload(), walletAmountPaise },
        { audience: 'parent' }
      );

      if (paymentMethod === 'online' && checkout?.razorpayOrderId) {
        const razorpayResponse = await openRazorpayCheckout({
          keyId: checkout.keyId || ENV.RAZORPAY_KEY_ID,
          razorpayOrderId: checkout.razorpayOrderId,
          amountPaise: checkout.amountPaise,
          currency: checkout.currency,
          description: `Order ${order.orderNumber}`,
          prefill: { name: address.name, contact: address.phone },
          notes: { orderId: order._id },
        });

        await confirmPayment(order._id, {
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          razorpayOrderId: razorpayResponse.razorpay_order_id,
          razorpaySignature: razorpayResponse.razorpay_signature,
        });
      } else if (paymentMethod === 'online') {
        await confirmPayment(order._id);
      }

      await refreshCart();

      const mapped = mapOrderForDetail(order);
      navigate('/user/order-success', {
        state: {
          orderId: mapped.id,
          orderNumber: mapped.orderNumber,
          city: mapped.city || address.city,
          address: mapped.address || address.address,
          paymentMethod: mapped.paymentMethod,
          subtotal: mapped.subtotal,
          shipping: mapped.shipping,
          totalAmount: mapped.totalAmount,
          itemsCount: mapped.itemsCount,
        },
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to place order. Please try again.';
      setOrderError(message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-outfit">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-xl font-bold text-deep-purple mb-2">Your cart is empty</h2>
        <p className="text-gray-400 text-sm mb-8">Add some items to your cart to proceed with checkout</p>
        <button 
          onClick={() => navigate('/user/home')}
          className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20"
        >
          Explore Shop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-outfit pb-32">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 flex items-center justify-center relative border-b border-gray-100 sticky top-0 z-50">
        <button 
          onClick={() => navigate(-1)}
          className="absolute left-6 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-deep-purple">Checkout</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-4">
        {/* Order for someone else */}
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
          <span className="text-sm font-medium text-gray-500">Ordering for someone else?</span>
          <button className="text-sm font-bold text-primary">Add details</button>
        </div>

        {/* Delivery Address Section */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative">
          {/* Subtle Tribal Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/tribal.png")' }}></div>
          
          <div className="p-4 border-b border-gray-50 bg-white/80 backdrop-blur-sm">
            <h2 className="font-bold text-deep-purple mb-1">Delivery Address</h2>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Select or edit your saved address</p>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 relative">
              <div className="absolute top-4 left-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle2 size={12} className="text-white" />
              </div>
              <div className="pl-8">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-deep-purple">{address.name}</h3>
                  <button className="text-xs font-bold text-primary uppercase tracking-widest">Edit</button>
                </div>
                <p className="text-xs font-bold text-gray-400 mb-1">{address.phone}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                  {address.address}
                </p>
              </div>
            </div>


          </div>
        </div>

        {/* Shipment Summary */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-4">Shipment of {cartItems.length} item{cartItems.length > 1 ? 's' : ''}</p>
          
          <div className="space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-deep-purple truncate">{item.name}</h3>
                    <p className="text-[11px] text-gray-400 font-medium">{item.quantity} × {item.weight || 'Standard'}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button className="text-[11px] font-bold text-primary flex items-center gap-1">
                      <Heart size={12} /> Move to wishlist
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-gray-50 rounded-full border border-gray-100 px-1 py-1">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-deep-purple">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-primary"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-black text-black">₹{(parsePrice(item.price) * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Type Selection */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={18} className="text-primary" />
            <h2 className="font-bold text-deep-purple text-sm uppercase tracking-widest">Delivery Type</h2>
          </div>
          
          <div className={`grid gap-3 ${isSchoolLinked(childInfo) ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button
              onClick={() => setDeliveryType('home')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${deliveryType === 'home' ? 'border-primary bg-primary/5' : 'border-gray-50 bg-gray-50/50 grayscale'}`}
            >
              <Truck size={24} className={deliveryType === 'home' ? 'text-primary' : 'text-gray-400'} />
              <span className="text-xs font-black text-deep-purple">Home Delivery</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase">Within 24 Hours</span>
            </button>

            {/* School pick-up only for school-linked shoppers */}
            {isSchoolLinked(childInfo) && (
              <button
                onClick={() => setDeliveryType('school')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${deliveryType === 'school' ? 'border-primary bg-primary/5' : 'border-gray-50 bg-gray-50/50 grayscale'}`}
              >
                <Building2 size={24} className={deliveryType === 'school' ? 'text-primary' : 'text-gray-400'} />
                <span className="text-xs font-black text-deep-purple">School Pick-up</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase truncate w-full text-center">{childInfo.school}</span>
              </button>
            )}
          </div>
          
          {!deliveryType && <p className="mt-4 text-xs text-primary font-medium">Please select a delivery type to proceed</p>}
        </div>

        {/* Wallet balance */}
        {walletBalancePaise > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <button
              type="button"
              onClick={() => setApplyWallet((v) => !v)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                applyWallet ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50/40'
              }`}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${applyWallet ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                <Wallet size={20} />
              </div>
              <div className="flex-1">
                <span className="block text-sm font-black text-deep-purple">Use Wallet Balance</span>
                <span className="block text-[11px] font-bold text-gray-400 mt-0.5">
                  Available: ₹{(walletBalancePaise / 100).toFixed(2)}
                  {applyWallet && walletAmountPaise > 0 && (
                    <span className="text-emerald-600"> · Applying ₹{(walletAmountPaise / 100).toFixed(2)}</span>
                  )}
                </span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${applyWallet ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                {applyWallet && <CheckCircle2 size={14} className="text-white" />}
              </div>
            </button>
            {applyWallet && (
              <p className="text-[11px] font-bold text-gray-400 mt-3 text-center">
                Remaining ₹{payableAfterWallet.toFixed(2)} to pay by {paymentMethod === 'cod' ? 'cash' : 'online payment'}.
              </p>
            )}
          </div>
        )}

        {/* Payment Method */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              <h2 className="font-bold text-deep-purple text-sm uppercase tracking-widest">Payment Method</h2>
            </div>
            <button className="text-[11px] font-bold text-primary flex items-center gap-1 uppercase tracking-widest">
              See all coupons <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setPaymentMethod('online')}
              className={`p-5 rounded-3xl border-2 transition-all relative ${paymentMethod === 'online' ? 'border-primary bg-white shadow-xl shadow-primary/5' : 'border-gray-50 bg-gray-50/30'}`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === 'online' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                  <CreditCard size={24} />
                </div>
                <span className="text-[11px] font-black text-deep-purple uppercase tracking-widest">UPI / ONLINE</span>
              </div>
              {paymentMethod === 'online' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              )}
              <p className="text-[9px] text-gray-400 text-center font-medium mt-1">Pay via App / Card</p>
            </button>

            <button 
              onClick={() => setPaymentMethod('cod')}
              className={`p-5 rounded-3xl border-2 transition-all relative ${paymentMethod === 'cod' ? 'border-primary bg-white shadow-xl shadow-primary/5' : 'border-gray-50 bg-gray-50/30'}`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === 'cod' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                  <Wallet size={24} />
                </div>
                <span className="text-[11px] font-black text-deep-purple uppercase tracking-widest">CASH ON DELIVERY</span>
              </div>
              {paymentMethod === 'cod' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              )}
              <p className="text-[9px] text-gray-400 text-center font-medium mt-1">Pay at your doorstep</p>
            </button>
          </div>
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Info size={16} className="text-primary" />
            <h2 className="font-bold text-deep-purple text-sm uppercase tracking-widest">Bill Details</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-medium">Items total</span>
              </div>
              <span className="font-bold text-deep-purple">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <ShoppingBag size={14} className="text-gray-400" />
                <span className="text-gray-400 font-medium">Handling charge</span>
              </div>
              <span className="font-bold text-deep-purple">₹{handlingCharge}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-gray-400" />
                <span className="text-gray-400 font-medium">Delivery charge</span>
              </div>
              <span className={`font-bold ${deliveryType === 'home' ? 'text-deep-purple' : 'text-green-500'}`}>
                {deliveryType === 'home' ? `₹${deliveryCharge}` : 'FREE'}
              </span>
            </div>

            <button className="w-full py-4 mt-2 border-y border-gray-50 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <BadgePercent size={16} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-deep-purple">Add GSTIN</p>
                  <p className="text-[10px] text-gray-400 font-medium">Claim GST input credit up to 18%</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-active:translate-x-1 transition-all" />
            </button>

            <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
              <span className="text-base font-bold text-deep-purple">Grand total</span>
              <span className="text-lg font-black text-black">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="py-6 px-4 space-y-4 text-center">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-widest cursor-pointer hover:text-primary">Cancellation Policy</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 font-medium">
            Made with <Heart size={14} className="text-red-500 fill-current" /> by <span className="font-bold text-deep-purple">School E-mart</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 z-[60] flex flex-col gap-3 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        {orderError && (
          <p className="text-sm text-red-500 font-medium text-center">{orderError}</p>
        )}
        {summaryError && (
          <p className="text-sm text-amber-600 font-medium text-center">{summaryError}</p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total to pay</span>
            <span className="text-xl font-black text-black leading-none">
              {summaryLoading ? '...' : `₹${grandTotal.toLocaleString()}`}
            </span>
          </div>
          <button 
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || summaryLoading || !isAuthenticated}
            className="flex-1 max-w-[200px] h-14 bg-primary text-white font-black text-base rounded-2xl shadow-xl shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPlacingOrder ? <Loader2 size={22} className="animate-spin" /> : 'Place Order'}
          </button>
        </div>
      </div>

      {/* Guests must verify their number (creating an unlinked account) before
          they can place the order. */}
      {!isAuthenticated && (
        <GuestCheckoutGate
          onDone={() => {
            const info = readChildInfo();
            setChildInfo(info);
            setAddress(toAddress(info));
          }}
          onCancel={() => navigate(-1)}
        />
      )}
    </div>
  );
};

export default CheckoutPage;
