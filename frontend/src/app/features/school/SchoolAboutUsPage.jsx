import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, Building2, 
  Sparkles, GraduationCap, CheckCircle2 
} from 'lucide-react';

const SchoolAboutUsPage = () => {
  const navigate = useNavigate();

  const values = [
    { 
      icon: <ShieldCheck size={24} className="text-primary" />, 
      title: "Bulk Procurement", 
      desc: "Direct supply chains designed for large-scale institutional requirements." 
    },
    { 
      icon: <Building2 size={24} className="text-primary" />, 
      title: "School-Centric", 
      desc: "Tools built to simplify inventory, budgeting, and supply management for admins." 
    },
    { 
      icon: <Sparkles size={24} className="text-primary" />, 
      title: "Verified Vendors", 
      desc: "Every vendor is vetted for quality, timely delivery, and institutional standards." 
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit">
      <div className="bg-deep-purple px-6 pt-10 pb-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-black text-white tracking-tight">About School Portal</h1>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-10">
        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-black text-deep-purple mb-4">Modernizing Institutional Procurement</h2>
          <p className="text-gray-400 text-sm font-medium leading-relaxed">
            School E-Mart for Schools is a dedicated B2B platform designed to empower 
            educational institutions with seamless bulk procurement, inventory tracking, 
            and vendor management tools.
          </p>
        </section>

        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Institutional Values</h3>
          <div className="space-y-4">
            {values.map((v, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">{v.icon}</div>
                <div>
                  <h4 className="text-base font-bold text-deep-purple mb-1">{v.title}</h4>
                  <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-deep-purple rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-4">Our Institutional Vision</h3>
            <p className="text-white/70 text-sm font-medium leading-relaxed mb-6">
              To be the backbone of school infrastructure supply, ensuring every 
              institution has access to high-quality materials at competitive bulk rates.
            </p>
            <div className="flex items-center gap-2 text-yellow-400">
              <CheckCircle2 size={18} />
              <span className="text-xs font-black uppercase tracking-widest">B2B Certified Excellence</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SchoolAboutUsPage;
