import React, { useState } from 'react';
import {
  ChevronRight, ArrowLeft, Bell, Info,
  CheckCircle2, ShoppingBag, RotateCcw,
  Megaphone, ShieldCheck, ChevronDown,
  Star, Package, ListChecks, AlertCircle, Building2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SchoolHeader from '../../components/SchoolHeader';
import SectionHeader from '../../components/SectionHeader';
import ProductCard from '../../components/ProductCard';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';

const SchoolMySchoolPage = () => {
  const navigate = useNavigate();
  const kitsRef = useDraggableScroll();
  const [scrolled, setScrolled] = useState(false);
  const [schoolInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : { role: 'school', name: 'School Admin', school: 'School Management', progress: { completed: 85, total: 100 } };
  });

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  const announcements = [
    { id: 1, title: "Vendor Bidding Open", text: "Q3 Uniform supply cycle is now open", date: "1h ago" },
    { id: 2, title: "New Inventory Guidelines", text: "Revised stock management protocol", date: "4h ago" }
  ];

  const institutionalKits = [
    { id: 1, name: "Complete Grade 2 Batch", price: "₹45,299", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=300&h=400&fit=crop", badge: "Bulk Best Seller" },
    { id: 2, name: "Faculty Uniform Set", price: "₹18,450", image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=300&h=400&fit=crop", badge: "Staff Standard" }
  ];

  const renderProductCard = (product) => (
    <ProductCard key={product.id} product={product} />
  );

  return (
    <>
      <SchoolHeader scrolled={scrolled} childInfo={schoolInfo} />
      <div onScroll={handleScroll} className="flex flex-col h-full bg-white pb-32 font-outfit overflow-y-auto">
        <div className="h-[170px] shrink-0"></div>
        
        <div className="px-6 py-6 bg-gray-50/50 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-base font-bold text-deep-purple leading-none mb-1">{schoolInfo.school}</h2>
                <span className="text-[11px] text-gray-500 font-medium">Administrator Console</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pt-8 space-y-12">
          <section>
            <div className="bg-deep-purple rounded-[2.5rem] p-7 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                    <ListChecks size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold opacity-70 uppercase tracking-widest leading-none">Procurement</h3>
                    <p className="text-lg font-black tracking-tight">Quarterly Supply Status</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold opacity-80">Cycle Progress</span>
                    <span className="text-xs font-black text-yellow-400">85%</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `85%` }}></div>
                  </div>
                  <button className="w-full mt-4 py-4 bg-white text-deep-purple rounded-2xl text-xs font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    Manage Inventory <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionHeader title="Bulk Packages" className="px-0" />
            <div ref={kitsRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide select-none active:cursor-grabbing">
              {institutionalKits.map((kit) => (
                <div key={kit.id} className="min-w-[260px] bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-50">
                  <div className="h-36 relative bg-gray-50">
                    <img src={kit.image} alt={kit.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-white/90 text-deep-purple text-[9px] font-black px-2 py-1 rounded-full border border-white">Institutional Rate</div>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-deep-purple line-clamp-1">{kit.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-primary">{kit.price}</span>
                      <button className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gray-50 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone size={16} className="text-primary" />
              <h2 className="text-base font-bold text-deep-purple">Institutional Notices</h2>
            </div>
            <div className="space-y-4">
              {announcements.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0"></div>
                  <div>
                    <h4 className="text-xs font-bold text-deep-purple leading-tight">{msg.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold">{msg.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="pb-12">
            <div className="bg-white border border-gray-100 p-6 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-deep-purple mb-1">Need procurement help?</h3>
                <p className="text-[10px] text-gray-500 max-w-[180px]">Contact our dedicated school relationship manager.</p>
              </div>
              <button className="w-full py-3.5 bg-black text-white rounded-2xl text-[11px] font-bold shadow-lg">
                Call Relationship Manager
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default SchoolMySchoolPage;
