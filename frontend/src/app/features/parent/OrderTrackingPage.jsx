import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  ChevronLeft, Share2, RefreshCw, MapPin, 
  Phone, Home, Building2, ShieldCheck, 
  Info, ChevronRight, HelpCircle, XCircle,
  Truck, Package, ShoppingBag
} from 'lucide-react';

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  
  const orderDetails = location.state || {
    orderId: orderId || "19257251",
    address: "321 Lala Banarasilal Dawar Marg, Indore",
    paymentMethod: "CASH ON DELIVERY",
    totalAmount: "85",
    subtotal: "20",
    shipping: "55"
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-outfit pb-24">
      {/* 1. Header Section */}
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
            <p className="text-[12px] font-bold">#{orderDetails.orderId}</p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all">
              <Share2 size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black mb-4 tracking-tight uppercase">Order Pending</h1>
          <div className="inline-flex items-center bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
            <span className="text-[10px] font-black uppercase tracking-widest">Waiting for Confirmation</span>
          </div>
        </div>
      </div>

      {/* 2. Map Section (Placeholder) */}
      <div className="px-4 mt-4 relative z-10 mb-4">
        <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border-4 border-white h-64 relative">
          <img 
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=600&h=400&fit=crop" 
            alt="Map" 
            className="w-full h-full object-cover opacity-80 grayscale-[0.2]"
          />
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
          
          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-deep-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            </button>
            <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-deep-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
            </button>
          </div>

          {/* Route Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
             <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl border border-white">
                <span className="text-lg font-black text-deep-purple">Indore</span>
             </div>
          </div>
        </div>
      </div>

      {/* 3. Status Cards */}
      <div className="px-4 space-y-3">
        {/* Payment Info */}
        <div className="bg-[#FFF9C4] p-4 rounded-2xl border-2 border-white shadow-sm flex flex-col gap-1">
          <h3 className="text-[11px] font-black text-[#F57F17] uppercase tracking-widest">
            {orderDetails.paymentMethod === 'ONLINE PAYMENT' ? 'PAID ONLINE' : `PAY AT DELIVERY: ₹${orderDetails.totalAmount}`}
          </h3>
          <p className="text-[10px] text-[#FBC02D] font-bold">Handover cash or show UPI scan to partner</p>
        </div>

        {/* Preparation Step */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <Package size={24} />
          </div>
          <span className="text-xs font-black text-deep-purple uppercase tracking-tight">Store is preparing your order</span>
        </div>

        {/* Safety Protocols */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <ShieldCheck size={24} />
            </div>
            <span className="text-xs font-black text-deep-purple uppercase tracking-tight">Safety Protocols Verified</span>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
          <div className="p-4 flex items-center justify-between group active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-deep-purple">Customer</h3>
                <p className="text-[12px] text-gray-400 font-medium">9XXXXXXXXX</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>

          <div className="p-4 flex items-center justify-between group active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <Home size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-deep-purple">Delivery Address</h3>
                <p className="text-[12px] text-gray-400 font-medium truncate max-w-[200px]">{orderDetails.address}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        </div>

        {/* Store Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-deep-purple uppercase tracking-tight">Fashion Hub</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-gray-400 font-bold italic">9111966732</span>
                <span className="bg-green-50 text-green-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Click to call</span>
              </div>
            </div>
          </div>
          <button className="w-full py-4 border-t border-gray-50 flex items-center justify-between px-4 group active:bg-gray-50 transition-all">
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gray-400" />
              <span className="text-xs font-bold text-deep-purple uppercase tracking-widest">Call Store</span>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                <Package size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-deep-purple uppercase tracking-tight">Bill Summary</h3>
                <p className="text-[10px] text-gray-400 font-bold">#{orderDetails.orderId} • {orderDetails.itemsCount || 1} Items</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
              <span>Subtotal</span>
              <span className="text-gray-500">₹{orderDetails.subtotal}</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
              <span>Shipping</span>
              <span className="text-gray-500">₹{orderDetails.shipping}</span>
            </div>
            <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
              <span className="text-xs font-black text-deep-purple uppercase tracking-[0.2em]">Payable Amount</span>
              <span className="text-xl font-black text-black">₹{orderDetails.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Help & Actions */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
          <div className="p-4 flex items-center justify-between group active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-deep-purple">Need Help?</h3>
                <p className="text-[12px] text-gray-400 font-medium">Visit FAQ</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>

          <div className="p-4 flex items-center justify-between group active:bg-gray-50 transition-colors opacity-60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <XCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-500">Cancel Order</h3>
                <p className="text-[12px] text-gray-400 font-medium">Only available before store accepts</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        </div>

        <button 
          onClick={() => navigate('/user/orders')}
          className="w-full py-4 text-center text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] active:text-primary transition-colors mb-8"
        >
          View All Orders
        </button>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
