import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, Heart, 
  Sparkles, GraduationCap, CheckCircle2 
} from 'lucide-react';

const AboutUsPage = () => {
  const navigate = useNavigate();

  const values = [
    { 
      icon: <ShieldCheck size={24} className="text-primary" />, 
      title: "Trusted Quality", 
      desc: "We partner directly with schools to ensure every item meets official standards." 
    },
    { 
      icon: <Heart size={24} className="text-primary" />, 
      title: "Parent First", 
      desc: "Designed to save you time and effort with a seamless mobile shopping experience." 
    },
    { 
      icon: <Sparkles size={24} className="text-primary" />, 
      title: "Smart Solutions", 
      desc: "From auto-filled addresses to smart kits, we make school prep effortless." 
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit">
      {/* Header */}
      <div className="bg-deep-purple px-6 pt-10 pb-6 rounded-b-[2.5rem] shadow-xl shadow-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-white tracking-tight">About Us</h1>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-10">
        {/* Mission Section */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 border border-gray-50 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-black text-deep-purple mb-4">Empowering Education through Convenience</h2>
          <p className="text-gray-400 text-sm font-medium leading-relaxed">
            School E-Mart is India's premier digital marketplace dedicated to school essentials. 
            We bridge the gap between schools, parents, and quality supplies, ensuring every 
            student starts their academic year with the right tools.
          </p>
        </section>

        {/* Core Values */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Our Core Values</h3>
          <div className="space-y-4">
            {values.map((v, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
                  {v.icon}
                </div>
                <div>
                  <h4 className="text-base font-bold text-deep-purple mb-1">{v.title}</h4>
                  <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vision Section */}
        <section className="bg-deep-purple rounded-[2.5rem] p-8 text-white shadow-xl shadow-purple-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-4">Our Vision</h3>
            <p className="text-white/70 text-sm font-medium leading-relaxed mb-6">
              To become the most trusted ecosystem for school communities, where quality 
              education materials are just a tap away for every parent across the country.
            </p>
            <div className="flex items-center gap-2 text-yellow-400">
              <CheckCircle2 size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Verified Partnerships</span>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <div className="pt-4 pb-8 text-center">
          <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
            School E-Mart © 2026
          </p>
          <p className="text-[9px] text-gray-200 mt-1 uppercase font-bold tracking-tighter">
            An initiative by Zeppe Platforms
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
