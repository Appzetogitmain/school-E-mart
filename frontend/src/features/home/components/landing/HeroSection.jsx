import React from 'react';
import { ArrowRight, School, User, Check, ShieldCheck, BadgePercent, Truck, GraduationCap, ShoppingBag, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../constants/routes';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-40 pb-0 overflow-hidden bg-[#fafbff]">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_top_right,rgba(91,63,214,0.03),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(244,180,0,0.03),transparent_40%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-[11px] font-medium uppercase tracking-widest mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
          One Platform. Endless Possibilities.
        </div>

        <h1 className="text-4xl md:text-6xl font-medium text-[#1a1a1a] leading-tight mb-6 max-w-4xl mx-auto">
          Buy School Supplies, Uniforms & Books Online — For <span className="text-primary font-semibold">Schools</span> & <span className="text-primary font-semibold">Parents</span>
        </h1>
        <p className="text-[17px] text-text-secondary max-w-3xl mx-auto mb-12 font-normal leading-relaxed opacity-80">
          Find everything your school needs in one place — from school uniforms and books 
          to classroom furniture and project materials. School E-Mart connects schools, parents, 
          and verified vendors across India for easy and reliable school shopping.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto mb-16">
          {/* School Card */}
          <div className="group relative flex flex-col bg-gradient-to-br from-[#f3f0ff] to-[#ffffff] rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(91,63,214,0.05)] overflow-hidden transition-all duration-500 hover:shadow-[0_30px_60px_rgba(91,63,214,0.12)]">
            {/* Image at Top */}
            <div className="relative pt-12 px-10 pb-4 flex justify-center bg-white/40">
              <div className="absolute top-8 left-10 w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center text-primary z-10">
                <School size={24} strokeWidth={1.5} />
              </div>
              <img src="/assets/school.webp" alt="School Procurement" className="w-full max-w-[320px] h-auto object-contain transition-transform duration-700 group-hover:scale-105" />
            </div>

            {/* Content Below */}
            <div className="p-10 text-left flex flex-col flex-1">
              <h3 className="text-2xl font-medium text-[#1a1a1a] mb-3">Continue as School</h3>
              <p className="text-[#666] text-[14px] leading-relaxed mb-8 font-normal">
                Manage bulk school orders, uniforms, books, furniture, and supplies from trusted vendors across India.
              </p>
              
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Compare multiple vendors',
                  'Get best prices for bulk orders',
                  'Manage all school purchases easily'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#1a1a1a] text-[14px] font-normal">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => navigate(`${ROUTES.MARKETPLACE}?role=school`)}
                className="w-full py-4 bg-primary text-white font-normal rounded-2xl hover:bg-deep-purple transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group/btn"
              >
                Get Started <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Parent Card */}
          <div className="group relative flex flex-col bg-gradient-to-br from-[#fff9eb] to-[#ffffff] rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(244,180,0,0.05)] overflow-hidden transition-all duration-500 hover:shadow-[0_30px_60px_rgba(244,180,0,0.12)]">
            {/* Image at Top */}
            <div className="relative pt-12 px-10 pb-4 flex justify-center bg-white/40">
              <div className="absolute top-8 left-10 w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center text-golden-yellow z-10">
                <User size={24} strokeWidth={1.5} />
              </div>
              <img src="/assets/parent.webp" alt="Parent Shopping" className="w-full max-w-[320px] h-auto object-contain transition-transform duration-700 group-hover:scale-105" />
            </div>

            {/* Content Below */}
            <div className="p-10 text-left flex flex-col flex-1">
              <h3 className="text-2xl font-medium text-[#1a1a1a] mb-3">Continue as Parent</h3>
              <p className="text-[#666] text-[14px] leading-relaxed mb-8 font-normal">
                Buy school uniforms, books, and essentials online based on your child’s school and class.
              </p>
              
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'School-specific product listings',
                  'Easy and quick online shopping',
                  'Trusted and verified products'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#1a1a1a] text-[14px] font-normal">
                    <div className="w-5 h-5 rounded-full bg-golden-yellow flex items-center justify-center text-deep-purple">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => navigate(`${ROUTES.MARKETPLACE}?role=parent`)}
                className="w-full py-4 bg-golden-yellow text-deep-purple font-normal rounded-2xl hover:bg-[#e6a800] transition-all shadow-lg shadow-golden-yellow/20 flex items-center justify-center gap-2 group/btn"
              >
                Start Shopping <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
};

export default HeroSection;
