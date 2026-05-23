import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, MapPin, Edit3, ShoppingBag, 
  Clock, CreditCard, Wallet, ChevronRight, 
  Heart, Plus, Minus, Info, CheckCircle2,
  Building2, Truck, BadgePercent
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

const SchoolCheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  
  const [deliveryType, setDeliveryType] = useState('school'); // Default to school for institutional
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'
  
  const [schoolInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      name: parsed.school || "St. Xavier's High School",
      address: parsed.schoolAddress || 'Sector 4, Institutional Area, Indore - 452018',
      city: parsed.city || 'Indore',
      adminName: parsed.name || 'Admin Office'
    };
  });

  const parsePrice = (price) => {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      return parseFloat(price.replace(/[^\d.]/g, '')) || 0;
    }
    return 0;
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (parsePrice(item.price) * item.quantity), 0);
  const handlingCharge = 50; // Bulk handling fee
  const deliveryCharge = 0; // Institutional bulk orders get free delivery
  const grandTotal = subtotal + handlingCharge + deliveryCharge;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-outfit">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
          <Building2 size={48} />
        </div>
        <h2 className="text-xl font-bold text-deep-purple mb-2">No active bulk procurements</h2>
        <p className="text-gray-400 text-sm mb-8">Add items to your institutional cart to proceed</p>
        <button 
          onClick={() => navigate('/school/home')}
          className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20"
        >
          Explore Supplies
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
        <h1 className="text-xl font-black text-deep-purple">Bulk Checkout</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-4">
        {/* Institutional Identity */}
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ordering for</p>
              <p className="text-sm font-bold text-deep-purple">{schoolInfo.name}</p>
            </div>
          </div>
          <button className="text-sm font-bold text-primary">Switch</button>
        </div>

        {/* Delivery Address Section */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/tribal.png")' }}></div>
          
          <div className="p-4 border-b border-gray-50 bg-white/80 backdrop-blur-sm">
            <h2 className="font-bold text-deep-purple mb-1">Shipping Address</h2>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Institutional Delivery Point</p>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 relative">
              <div className="absolute top-4 left-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle2 size={12} className="text-white" />
              </div>
              <div className="pl-8">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-deep-purple">{schoolInfo.adminName}</h3>
                  <button className="text-xs font-bold text-primary uppercase tracking-widest">Edit</button>
                </div>
                <p className="text-xs font-bold text-gray-400 mb-1">Institutional Contact</p>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                  {schoolInfo.address}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Shipment Summary */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Bulk Shipment ({cartItems.length} categories)</p>
            <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase">Institutional Packs</span>
          </div>
          
          <div className="space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-deep-purple truncate">{item.name}</h3>
                    <p className="text-[11px] text-primary font-bold uppercase tracking-tighter">Bulk Qty: {item.quantity}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-medium">Unit: Institutional Pack</span>
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

        {/* Payment Method */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              <h2 className="font-bold text-deep-purple text-sm uppercase tracking-widest">Payment Method</h2>
            </div>
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
                <span className="text-[11px] font-black text-deep-purple uppercase tracking-widest text-center">CORPORATE BANKING / UPI</span>
              </div>
              {paymentMethod === 'online' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              )}
            </button>

            <button 
              onClick={() => setPaymentMethod('cod')}
              className={`p-5 rounded-3xl border-2 transition-all relative ${paymentMethod === 'cod' ? 'border-primary bg-white shadow-xl shadow-primary/5' : 'border-gray-50 bg-gray-50/30'}`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === 'cod' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                  <Wallet size={24} />
                </div>
                <span className="text-[11px] font-black text-deep-purple uppercase tracking-widest text-center">PAY ON DELIVERY</span>
              </div>
              {paymentMethod === 'cod' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Info size={16} className="text-primary" />
            <h2 className="font-bold text-deep-purple text-sm uppercase tracking-widest">Bulk Bill Details</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400 font-medium">Bulk Items Subtotal</span>
              <span className="font-bold text-deep-purple">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <ShoppingBag size={14} className="text-gray-400" />
                <span className="text-gray-400 font-medium">Bulk Handling Fee</span>
              </div>
              <span className="font-bold text-deep-purple">₹{handlingCharge}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-gray-400" />
                <span className="text-gray-400 font-medium">Institutional Delivery</span>
              </div>
              <span className="font-black text-green-500 uppercase">FREE</span>
            </div>

            <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
              <span className="text-base font-bold text-deep-purple">Total Bulk Amount</span>
              <span className="text-lg font-black text-black">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Institutional Policy */}
        <div className="py-6 px-4 space-y-4 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest cursor-pointer hover:text-primary">Institutional Policy</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 font-medium">
            Powered by <span className="font-bold text-deep-purple">School E-mart Institutional Portal</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 z-[60] flex items-center justify-between gap-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Amount to Pay</span>
          <span className="text-xl font-black text-black leading-none">₹{grandTotal.toLocaleString()}</span>
        </div>
        <button 
          onClick={() => {
            const orderId = 'BULK-' + Math.floor(10000000 + Math.random() * 90000000).toString();
            navigate('/school/orders', {
              state: {
                orderId,
                totalAmount: grandTotal,
                itemsCount: cartItems.length,
                type: 'BULK'
              }
            });
          }}
          className="flex-1 max-w-[240px] h-14 bg-primary text-white font-black text-base rounded-2xl shadow-xl shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center uppercase tracking-widest"
        >
          Confirm Bulk Order
        </button>
      </div>
    </div>
  );
};

export default SchoolCheckoutPage;
