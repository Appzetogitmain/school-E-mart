import React, { useState } from 'react';
import {
  ArrowLeft, Search, ShoppingBag,
  ChevronRight, Star, Clock, Package,
  RotateCcw, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import SideMenu from '../../components/SideMenu';
import LoginRequired from '../../components/LoginRequired';
import AuthPrompt from '../../components/AuthPrompt';

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isGuest = !localStorage.getItem('childInfo');
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(isGuest);
  const [childInfo, setChildInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : {
      name: "Priya Damodaran",
      school: "St. Xavier's High School",
      grade: "Class 2",
      phone: "+91 79999 42772"
    };
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('childInfo');
      if (saved) setChildInfo(JSON.parse(saved));
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  const [orders] = useState([
    {
      id: "29505014",
      status: "DELIVERED",
      date: "30 Apr 2026, 03:40 pm",
      price: "₹155",
      itemCount: 1,
      items: [
        { id: 1, image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=150&h=150&fit=crop" }
      ]
    },
    {
      id: "35087663",
      status: "PENDING",
      date: "30 Apr 2026, 03:39 pm",
      price: "₹155",
      itemCount: 1,
      items: [
        { id: 2, image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=150&h=150&fit=crop" }
      ]
    },
    {
      id: "28037962",
      status: "DELIVERED",
      date: "24 Apr 2026, 02:55 pm",
      price: "₹107",
      itemCount: 2,
      items: [
        { id: 3, image: "https://images.unsplash.com/photo-1582966271819-755813ec3b90?q=80&w=150&h=150&fit=crop" },
        { id: 4, image: "https://images.unsplash.com/photo-1634045550273-db9897ca800c?q=80&w=150&h=150&fit=crop" }
      ]
    },
    {
      id: "83117278",
      status: "ORDER PLACED",
      date: "24 Apr 2026, 02:55 pm",
      price: "₹107",
      itemCount: 1,
      items: [
        { id: 5, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=150&h=150&fit=crop" }
      ]
    }
  ]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-primary text-white border-primary/20';
      case 'PENDING':
        return 'bg-deep-purple text-white border-deep-purple/20';
      case 'ORDER PLACED':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle2 size={12} />;
      case 'PENDING':
        return <Clock size={12} />;
      default:
        return <Package size={12} />;
    }
  };

  return (
    <>
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={childInfo}
      />
      <AppHeader
        scrolled={scrolled}
        onMenuClick={() => setIsMenuOpen(true)}
        childInfo={childInfo}
      />
      <div
        onScroll={handleScroll}
        className="flex flex-col h-full bg-[#f8f5f2] pb-32 font-outfit overflow-y-auto"
      >
        <div className="h-[170px] shrink-0"></div>

        {isGuest ? (
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

            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100/50 active:scale-[0.99] transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Order ID</span>
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border flex items-center gap-2 ${getStatusStyle(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status.toLowerCase()}</span>
                        </span>
                      </div>
                      <h3 className="text-base font-black text-deep-purple tracking-tight">#{order.id}</h3>
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
                      {order.items.map((item, idx) => (
                        <div key={item.id} className="w-12 h-12 rounded-2xl bg-gray-50 border-2 border-white overflow-hidden shadow-sm flex items-center justify-center p-2 relative z-[5-idx]">
                          <img src={item.image} alt="product" className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                      ))}
                      {order.itemCount > order.items.length && (
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-400 relative z-0">
                          +{order.itemCount - order.items.length}
                        </div>
                      )}
                    </div>

                    <button className="bg-primary hover:bg-[#eeb100] text-white text-[11px] font-black px-6 py-3 rounded-2xl shadow-lg shadow-yellow-100 active:scale-90 transition-all flex items-center gap-2 uppercase tracking-tighter">
                      <RotateCcw size={14} strokeWidth={3} />
                      Order Again
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 mb-12 bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-deep-purple mb-1">Issue with an order?</h4>
                <p className="text-[10px] text-gray-400 max-w-[180px]">Our support team is here to help you 24/7 with any queries.</p>
              </div>
              <button className="w-full py-3.5 bg-deep-purple text-white rounded-2xl text-[11px] font-bold shadow-lg shadow-purple-100 active:scale-95 transition-all">
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
    </>
  );
};

export default OrderHistoryPage;
