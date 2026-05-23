import React, { useState } from 'react';
import {
  ArrowLeft, Search, ShoppingBag,
  ChevronRight, Star, Clock, Package,
  RotateCcw, CheckCircle2, AlertCircle, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SchoolHeader from '../../components/SchoolHeader';
import SchoolSideMenu from '../../components/SchoolSideMenu';
import AuthPrompt from '../../components/AuthPrompt';

const SchoolOrderHistoryPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isGuest = !localStorage.getItem('childInfo');
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : { role: 'school' };
  });

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  const [orders] = useState([
    {
      id: "PROC-95014",
      status: "DELIVERED",
      date: "30 Apr 2026",
      price: "₹45,299",
      itemCount: 45,
      items: [
        { id: 1, image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=150&h=150&fit=crop" }
      ]
    },
    {
      id: "PROC-87663",
      status: "SHIPPED",
      date: "02 May 2026",
      price: "₹12,850",
      itemCount: 12,
      items: [
        { id: 2, image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=150&h=150&fit=crop" }
      ]
    }
  ]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'DELIVERED': return 'bg-primary text-white border-primary/20';
      case 'SHIPPED': return 'bg-blue-500 text-white border-blue-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <>
      <SchoolSideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={schoolInfo} />
      <SchoolHeader scrolled={scrolled} onMenuClick={() => setIsMenuOpen(true)} childInfo={schoolInfo} />
      <div onScroll={handleScroll} className="flex flex-col h-full bg-[#f8f5f2] pb-32 font-outfit overflow-y-auto">
        <div className="h-[170px] shrink-0"></div>

        <div className="px-6 mt-6 relative z-20">
          <div className="mb-6">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Institutional Records</p>
            <h2 className="text-2xl font-black text-deep-purple tracking-tight">Procurement History</h2>
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100/50 active:scale-[0.99] transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Procurement ID</span>
                      <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border flex items-center gap-2 ${getStatusStyle(order.status)}`}>
                        <Package size={12} />
                        <span className="capitalize">{order.status.toLowerCase()}</span>
                      </span>
                    </div>
                    <h3 className="text-base font-black text-deep-purple tracking-tight">{order.id}</h3>
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
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border-2 border-white overflow-hidden shadow-sm flex items-center justify-center p-2">
                      <img src={order.items[0].image} alt="product" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    {order.itemCount > 1 && (
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-400">
                        +{order.itemCount - 1}
                      </div>
                    )}
                  </div>

                  <button className="bg-primary hover:bg-[#eeb100] text-white text-[11px] font-black px-6 py-3 rounded-2xl shadow-lg active:scale-90 transition-all flex items-center gap-2 uppercase tracking-tighter">
                    <RotateCcw size={14} strokeWidth={3} />
                    Reorder Batch
                  </button>
                </div>
              </div>
            ))}
          </div>

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
