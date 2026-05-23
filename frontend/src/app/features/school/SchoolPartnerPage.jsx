import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, ShoppingBag, TrendingUp, 
  Users, ShieldCheck, Zap, MessageCircle, Phone, 
  Building2, Percent, ClipboardCheck, Store
} from 'lucide-react';
import SchoolHeader from '../../components/SchoolHeader';
import SchoolSideMenu from '../../components/SchoolSideMenu';

const SchoolPartnerPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const schoolInfo = { name: "Adarsh Public School", code: "APS-1024" };

  const benefits = [
    { 
      title: "Earn Extra Income", 
      desc: "Earn commission when parents buy through your school portal", 
      icon: <Percent className="text-primary" size={24} />,
      color: "bg-primary/10"
    },
    { 
      title: "Best Vendor Prices", 
      desc: "Get competitive prices by comparing multiple verified vendors", 
      icon: <TrendingUp className="text-primary" size={24} />,
      color: "bg-primary/10"
    },
    { 
      title: "Simplified Management", 
      desc: "Manage uniforms, books, and kits easily in one place", 
      icon: <ClipboardCheck className="text-primary" size={24} />,
      color: "bg-primary/10"
    },
    { 
      title: "Parent Confidence", 
      desc: "Ensure parents buy the correct and approved school items", 
      icon: <Users className="text-primary" size={24} />,
      color: "bg-primary/10"
    },
    { 
      title: "Save Time", 
      desc: "No more endless calls and coordination with multiple vendors", 
      icon: <Zap className="text-primary" size={24} />,
      color: "bg-primary/10"
    }
  ];

  const steps = [
    { title: "Register", desc: "Register your school in 2 minutes" },
    { title: "Add Items", desc: "Add uniforms, books & required kits" },
    { title: "Collect Orders", desc: "Parents order through app OR request bulk" },
    { title: "Place Order", desc: "Choose best vendor and confirm" }
  ];

  return (
    <div className="flex flex-col h-full bg-white font-outfit overflow-y-auto">
      <SchoolSideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={schoolInfo} />
      <SchoolHeader 
        showSearch={false} 
        onMenuClick={() => setIsMenuOpen(true)} 
        childInfo={schoolInfo} 
      />
      
      <div className="flex-1 pb-32">
        <div className="h-[140px] shrink-0"></div>
        {/* Hero Section */}
        <div className="px-6 pt-8 pb-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-gold/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6 shadow-sm">
              <Building2 size={32} />
            </div>
            <h2 className="text-[26px] leading-[1.2] font-black text-deep-purple mb-4">
              Manage Your School Purchases & <span className="text-primary">Earn Extra Income</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed px-4">
              Handle uniforms, books, and school supplies in one place — with better prices and less effort.
            </p>
          </div>
        </div>

        {/* Highlight Card */}
        <div className="px-6 mb-12">
          <div className="bg-gradient-to-br from-primary to-primary/90 rounded-[2.5rem] p-8 shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold text-black uppercase tracking-widest mb-4 border border-white/10">
                <Percent size={12} /> Special Launch Offer
              </div>
              <h3 className="text-black text-xl font-bold leading-snug mb-3">
                On your first uniform order, almost the full commission goes to your school
              </h3>
              <p className="text-black/70 text-xs font-medium">
                Only payment gateway charges apply. We're committed to supporting your growth.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="px-6 mb-10">
          <h3 className="text-xl font-black text-deep-purple mb-8">Why Schools Join Us</h3>
          <div className="space-y-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-5">
                <div className={`w-12 h-12 shrink-0 rounded-2xl ${benefit.color} flex items-center justify-center`}>
                  {benefit.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-deep-purple mb-1">{benefit.title}</h4>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-50/50 py-10 px-6 mb-10">
          <h3 className="text-xl font-black text-deep-purple mb-6 text-center">How It Works</h3>
          <div className="space-y-8 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-6 relative z-10">
                <div className="w-12 h-12 shrink-0 rounded-full bg-white border-4 border-gray-50 shadow-sm flex items-center justify-center text-primary font-black text-lg">
                  {idx + 1}
                </div>
                <div className="flex-1 pt-1.5">
                  <h4 className="text-base font-bold text-deep-purple mb-1">{step.title}</h4>
                  <p className="text-xs text-gray-500 font-medium">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Section */}
        <div className="px-6 mb-10">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-sm">
            <h3 className="text-xl font-black text-deep-purple mb-8">Why You Can Trust Us</h3>
            <div className="grid grid-cols-2 gap-y-10 gap-x-6">
              {[
                { icon: <ShieldCheck size={28} />, text: "Verified Vendors" },
                { icon: <Store size={28} />, text: "Secure Payments" },
                { icon: <Zap size={28} />, text: "Transparent Pricing" },
                { icon: <MessageCircle size={28} />, text: "Support Team" }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3">
                  <div className="text-primary">{item.icon}</div>
                  <span className="text-[11px] font-bold text-deep-purple uppercase tracking-wider">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="px-6 mt-8 mb-20">
          <div className="max-w-md mx-auto">
            <button 
              onClick={() => window.open('https://wa.me/91XXXXXXXXXX', '_blank')}
              className="w-full bg-[#eeb100] hover:bg-yellow-400 text-black py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-accent-gold/20 active:scale-95 transition-all mb-4 flex items-center justify-center gap-3"
            >
              Get Started <ArrowRight size={24} />
            </button>
            <p className="text-center text-[11px] text-black font-bold uppercase tracking-widest">
              It takes less than 2 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ArrowRight = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

export default SchoolPartnerPage;
