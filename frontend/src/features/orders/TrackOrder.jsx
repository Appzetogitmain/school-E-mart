import React, { useState } from 'react';
import { Search, Truck, Package, CheckCircle2, Clock, ArrowRight, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { trackOrder } from '../../services/ordersApi';
import { getErrorMessage } from '../../utils/apiHelpers';
import { mapTrackOrderResult } from '../../utils/mappers/orderMapper';

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [orderStatus, setOrderStatus] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setError('');
    setOrderStatus(null);

    try {
      const payload = await trackOrder(trimmed);
      const mapped = mapTrackOrderResult(payload);
      if (!mapped) {
        setOrderStatus('not_found');
        return;
      }
      setOrderStatus({
        id: mapped.orderNumber,
        status: mapped.statusLabel,
        estimatedDelivery: mapped.deliveredAt
          ? new Date(mapped.deliveredAt).toLocaleDateString('en-IN')
          : 'Pending',
        steps: mapped.steps,
      });
    } catch (err) {
      const message = getErrorMessage(err, '');
      if (message.toLowerCase().includes('not found') || err.response?.status === 404) {
        setOrderStatus('not_found');
      } else {
        setError(getErrorMessage(err, 'Unable to track order. Please try again.'));
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#fcfcfd] pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Truck size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-deep-purple mb-4">Track Your Order</h1>
          <p className="text-text-secondary font-normal">Enter your order number to see delivery updates.</p>
        </div>

        <form onSubmit={handleTrack} className="mb-12">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={24} />
            <input
              type="text"
              placeholder="e.g. ORD1234567890"
              className="w-full bg-white rounded-2xl py-6 pl-16 pr-32 text-lg font-medium text-text-primary border border-gray-100 shadow-xl focus:outline-none focus:ring-8 focus:ring-primary/5 transition-all"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
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

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6 text-center mb-8 text-red-600 text-sm">
            {error}
          </div>
        )}

        {orderStatus === 'not_found' && (
          <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 bg-white text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <XCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-red-800 mb-2">Order Not Found</h3>
            <p className="text-red-600/80 text-sm font-normal">We could not find an order with that number. Please check and try again.</p>
          </div>
        )}

        {orderStatus && orderStatus !== 'not_found' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden mb-8">
              <div className="bg-primary p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Order Number</p>
                  <h3 className="text-2xl font-bold">{orderStatus.id}</h3>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Status</p>
                  <p className="text-lg font-bold">{orderStatus.status}</p>
                </div>
              </div>

              <div className="p-8 md:p-12">
                <div className="space-y-8">
                  {orderStatus.steps.map((step, i) => (
                    <div key={i} className="flex gap-6 relative">
                      {i !== orderStatus.steps.length - 1 && (
                        <div className={`absolute left-[15px] top-[30px] w-[2px] h-[calc(100%+8px)] ${step.completed ? 'bg-accent-green' : 'bg-gray-100'}`}></div>
                      )}

                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors duration-500 ${step.completed ? 'bg-accent-green text-white' : 'bg-gray-100 text-gray-300'}`}>
                        {step.completed ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                          <h4 className={`font-bold ${step.active ? 'text-primary' : 'text-deep-purple'}`}>{step.title}</h4>
                          <span className="text-xs text-text-secondary font-normal">{step.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-soft-lavender/40 rounded-[2rem] p-8 border border-purple-100/30 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white text-primary rounded-xl flex items-center justify-center shadow-sm">
                  <Package size={24} />
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

        {!orderStatus && !isSearching && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-50 text-accent-orange rounded-xl flex items-center justify-center shrink-0">
                <Package size={20} />
              </div>
              <div>
                <h4 className="font-bold text-deep-purple mb-1">Where is my order number?</h4>
                <p className="text-sm text-text-secondary font-normal">Check your order confirmation email or SMS. It usually starts with ORD.</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="font-bold text-deep-purple mb-1">Delayed delivery?</h4>
                <p className="text-sm text-text-secondary font-normal">Logistics can take longer during peak season. We are monitoring your shipment.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
