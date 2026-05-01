import React, { useState } from 'react';
import { Search, Truck, Package, CheckCircle2, Clock, MapPin, Phone, ArrowRight, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);

  const handleTrack = (e) => {
    e.preventDefault();
    if (!orderId) return;
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
      // Mock result
      if (orderId.toUpperCase() === 'ERR') {
        setOrderStatus('not_found');
      } else {
        setOrderStatus({
          id: orderId.toUpperCase(),
          date: 'Oct 24, 2026',
          status: 'In Transit',
          currentLocation: 'New Delhi Distribution Center',
          estimatedDelivery: 'Oct 28, 2026',
          steps: [
            { title: 'Order Placed', date: 'Oct 24, 09:30 AM', completed: true },
            { title: 'Packed & Ready', date: 'Oct 25, 02:15 PM', completed: true },
            { title: 'In Transit', date: 'Oct 26, 11:00 AM', completed: true, active: true },
            { title: 'Out for Delivery', date: 'Expected Oct 28', completed: false },
            { title: 'Delivered', date: 'Expected Oct 28', completed: false },
          ]
        });
      }
    }, 1500);
  };

  return (
    <div className="w-full min-h-screen bg-[#fcfcfd] pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Truck size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-deep-purple mb-4">Track Your Order</h1>
          <p className="text-text-secondary font-normal">Enter your order ID to see real-time delivery updates.</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleTrack} className="mb-12">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={24} />
            <input
              type="text"
              placeholder="e.g. SEM-123456"
              className="w-full bg-white rounded-2xl py-6 pl-16 pr-32 text-lg font-medium text-text-primary border border-gray-100 shadow-xl focus:outline-none focus:ring-8 focus:ring-primary/5 transition-all"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isSearching}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-deep-purple transition-all active:scale-95 disabled:opacity-50"
            >
              {isSearching ? 'Tracking...' : 'Track'}
            </button>
          </div>
        </form>

        {/* Results Section */}
        {orderStatus === 'not_found' && (
          <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 bg-white text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <XCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-red-800 mb-2">Order Not Found</h3>
            <p className="text-red-600/80 text-sm font-normal">We couldn't find an order with that ID. Please check and try again.</p>
          </div>
        )}

        {orderStatus && orderStatus !== 'not_found' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick Status Card */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden mb-8">
              <div className="bg-primary p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Order ID</p>
                  <h3 className="text-2xl font-bold">{orderStatus.id}</h3>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Est. Delivery</p>
                  <p className="text-lg font-bold">{orderStatus.estimatedDelivery}</p>
                </div>
              </div>
              
              <div className="p-8 md:p-12">
                {/* Timeline */}
                <div className="space-y-8">
                  {orderStatus.steps.map((step, i) => (
                    <div key={i} className="flex gap-6 relative">
                      {/* Line */}
                      {i !== orderStatus.steps.length - 1 && (
                        <div className={`absolute left-[15px] top-[30px] w-[2px] h-[calc(100%+8px)] ${step.completed ? 'bg-accent-green' : 'bg-gray-100'}`}></div>
                      )}
                      
                      {/* Icon Container */}
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors duration-500 ${step.completed ? 'bg-accent-green text-white' : 'bg-gray-100 text-gray-300'}`}>
                        {step.completed ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                          <h4 className={`font-bold ${step.active ? 'text-primary' : 'text-deep-purple'}`}>{step.title}</h4>
                          <span className="text-xs text-text-secondary font-normal">{step.date}</span>
                        </div>
                        {step.active && (
                          <div className="mt-3 p-4 bg-primary/5 rounded-2xl flex items-center gap-3 border border-primary/10">
                            <MapPin size={16} className="text-primary" />
                            <p className="text-sm text-primary font-medium">{orderStatus.currentLocation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Support Callout */}
            <div className="bg-soft-lavender/40 rounded-[2rem] p-8 border border-purple-100/30 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white text-primary rounded-xl flex items-center justify-center shadow-sm">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-deep-purple">Need help with this order?</h4>
                  <p className="text-sm text-text-secondary font-normal">Contact our support team for assistance.</p>
                </div>
              </div>
              <Link to={ROUTES.HELP_CENTER} className="px-8 py-3 bg-white text-primary rounded-xl font-bold border border-primary/10 hover:bg-primary hover:text-white transition-all flex items-center gap-2 group">
                Contact Support <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}

        {/* Info Grid (Visible when no search has been performed yet) */}
        {!orderStatus && !isSearching && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-50 text-accent-orange rounded-xl flex items-center justify-center shrink-0">
                <Package size={20} />
              </div>
              <div>
                <h4 className="font-bold text-deep-purple mb-1">Where is my Order ID?</h4>
                <p className="text-sm text-text-secondary font-normal">Check your order confirmation email or SMS. It usually starts with 'SEM-'.</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="font-bold text-deep-purple mb-1">Delayed Delivery?</h4>
                <p className="text-sm text-text-secondary font-normal">Sometimes logistics can take longer due to holidays or location. Don't worry, we're on it!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
