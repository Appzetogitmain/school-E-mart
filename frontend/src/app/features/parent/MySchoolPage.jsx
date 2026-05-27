import React, { useState } from 'react';
import {
  ChevronRight, ArrowLeft, Bell, Info,
  CheckCircle2, ShoppingBag, RotateCcw,
  Megaphone, ShieldCheck, ChevronDown,
  Star, Package, ListChecks, AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import SectionHeader from '../../components/SectionHeader';
import ProductCard from '../../components/ProductCard';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import LoginRequired from '../../components/LoginRequired';
import AuthPrompt from '../../components/AuthPrompt';

const MySchoolPage = () => {
  const navigate = useNavigate();
  const kitsRef = useDraggableScroll();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isGuest = !localStorage.getItem('childInfo');
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(isGuest);

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  const [childInfo, setChildInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    const parsed = saved ? JSON.parse(saved) : {};
    return saved ? JSON.parse(saved) : {
      name: "Priya Damodaran",
      school: "St. Xavier's High School",
      grade: "Class 2",
      phone: "+91 79999 42772",
      progress: { completed: 12, total: 18 }
    };
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('childInfo');
      if (saved) {
        const parsed = JSON.parse(saved);
        setChildInfo(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          school: parsed.school || prev.school,
          grade: parsed.grade || prev.grade
        }));
      }
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const announcements = [
    { id: 1, title: "Final Term Uniform", text: "Mandatory for coming session", date: "2h ago" },
    { id: 2, title: "Summer Camp Kit", text: "Available for pre-order", date: "5h ago" }
  ];

  const recommendedKits = [
    { id: 1, name: "Complete Grade 2 Kit", price: "₹4,299", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=300&h=400&fit=crop", badge: "School Recommended" },
    { id: 2, name: "Sports & House Kit", price: "₹1,450", image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=300&h=400&fit=crop", badge: "Essential" }
  ];

  const mandatoryItems = [
    { id: 1, name: "Formal Blazer with Crest", price: "₹1,250", status: "Missing", image: "https://images.unsplash.com/photo-1591336373305-5850a990a5a0?q=80&w=150&h=150&fit=crop" },
    { id: 2, name: "St. Xavier's Tie", price: "₹150", status: "Missing", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=150&h=150&fit=crop" }
  ];

  const missingItems = [
    { id: 101, name: "Lab Coat - White", price: "₹450", image: "https://images.unsplash.com/photo-1581093583449-92d5069be01d?q=80&w=300&h=300&fit=crop" },
    { id: 102, name: "Name Tags (Pack of 20)", price: "₹99", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=300&h=300&fit=crop" },
    { id: 103, name: "Art Sketchbook A4", price: "₹120", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=300&h=300&fit=crop" }
  ];

  const renderProductCard = (product) => (
    <ProductCard key={product.id} product={product} />
  );

  return (
    <>
            <AppHeader
        scrolled={scrolled}
        onMenuClick={() => setIsMenuOpen(true)}
        childInfo={childInfo}
      />
      <div
        onScroll={handleScroll}
        className="flex flex-col h-full bg-white pb-32 font-outfit overflow-y-auto"
      >
        <div className="h-[140px] shrink-0"></div>
        
        {isGuest ? (
          <LoginRequired 
            title="School Store Protected"
            message="Please login to see products, notices, and mandatory items specifically for your child's school."
          />
        ) : (
          <>
            {/* 2. Child Context Section */}
            <div className="px-6 py-6 bg-gray-50/50 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">
                    {childInfo.name[0]}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-deep-purple leading-none mb-1">{childInfo.name}</h2>
                    <span className="text-[11px] text-gray-500 font-medium">{childInfo.grade}</span>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-500 shadow-sm active:scale-95 transition-all">
                  Switch Child <ChevronDown size={12} />
                </button>
              </div>
            </div>

            <div className="px-6 pt-8 space-y-12">
              {/* 3. Primary Section: Checklist */}
              <section>
                <div className="bg-deep-purple rounded-[2.5rem] p-7 text-white shadow-xl shadow-purple-900/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <ListChecks size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold opacity-70 uppercase tracking-widest leading-none">Status</h3>
                        <p className="text-lg font-black tracking-tight">Requirements Checklist</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold opacity-80">{childInfo.progress.completed} of {childInfo.progress.total} items completed</span>
                        <span className="text-xs font-black text-yellow-400">{(childInfo.progress.completed / childInfo.progress.total * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                          style={{ width: `${(childInfo.progress.completed / childInfo.progress.total) * 100}%` }}
                        ></div>
                      </div>
                      <button className="w-full mt-4 py-4 bg-white text-deep-purple rounded-2xl text-xs font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        View Missing Items <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. Recommended Kits */}
              <section>
                <SectionHeader
                  title="Recommended Kits"
                  onViewAll={() => { }}
                  viewAllLabel="All Kits"
                  className="px-0"
                />
                <div ref={kitsRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide select-none active:cursor-grabbing">
                  {recommendedKits.map((kit) => (
                    <div key={kit.id} className="min-w-[260px] bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-50 flex flex-col">
                      <div className="h-36 relative bg-gray-50">
                        <img src={kit.image} alt={kit.name} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-deep-purple text-[9px] font-bold px-2 py-1 rounded-full border border-white flex items-center gap-1">
                          <ShieldCheck size={10} className="text-primary" />
                          School Approved
                        </div>
                      </div>
                      <div className="p-4 flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-deep-purple line-clamp-1">{kit.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black text-primary">{kit.price}</span>
                          <button className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md active:scale-90 transition-all">
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 6. School Notices (Minimal) */}
              <section className="bg-gray-50 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone size={16} className="text-primary" />
                  <h2 className="text-base font-bold text-deep-purple">Notices</h2>
                </div>
                <div className="space-y-4">
                  {announcements.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 group cursor-pointer">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0"></div>
                      <div>
                        <h4 className="text-xs font-bold text-deep-purple leading-tight group-hover:text-primary transition-colors">{msg.title}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold">{msg.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 7. Mandatory Items */}
              <section>
                <SectionHeader title="Mandatory Items" className="px-0" />
                <div className="grid grid-cols-2 gap-3">
                  {mandatoryItems.map((item) => renderProductCard(item))}
                </div>
              </section>

              {/* 8. Missing Items Section */}
              <section>
                <SectionHeader title="Missing Items" className="px-0" />
                <div className="grid grid-cols-2 gap-3">
                  {missingItems.map((item) => renderProductCard(item))}
                </div>
              </section>

              {/* 9. Support Section */}
              <section className="pb-12">
                <div className="bg-white border border-gray-100 p-6 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100">
                    <Info size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-deep-purple mb-1">Need school assistance?</h3>
                    <p className="text-[10px] text-gray-500 max-w-[180px]">Contact our dedicated helpdesk for {childInfo.school}.</p>
                  </div>
                  <button className="w-full py-3.5 bg-black text-white rounded-2xl text-[11px] font-bold shadow-lg active:scale-95 transition-all">
                    Chat with School Support
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
      <AuthPrompt 
        isOpen={isAuthPromptOpen} 
        onClose={() => setIsAuthPromptOpen(false)} 
        title="School Store Protected"
        message="Login to see products, notices, and mandatory items specifically for your child's school."
      />
    </>
  );
};

export default MySchoolPage;
