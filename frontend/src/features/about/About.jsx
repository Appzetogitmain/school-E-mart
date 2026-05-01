import React from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Globe, 
  Zap, 
  Layers,
  Building2,
  ShoppingBag,
  Target,
  Eye,
  ChevronRight,
  Warehouse,
  TrendingUp,
  FileText,
  BadgeCheck,
  BookOpen,
  Shirt,
  Armchair,
  Laptop,
  FlaskConical,
  GraduationCap,
  Users,
  Search,
  Settings,
  Truck,
  FileCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full bg-white text-text-primary overflow-x-hidden">
      
      {/* 1. Hero Section */}
      <section className="relative pt-16 pb-16 md:pb-24 overflow-hidden bg-soft-lavender/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 relative z-10 text-center lg:text-left">
              <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full mb-8">
                ABOUT US
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-deep-purple leading-tight mb-8">
                Better Supplies. Better Schools. <br/>
                <span className="text-accent-orange">Easier Shopping for Parents.</span>
              </h1>
              <p className="text-lg text-text-secondary mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
                School E-Mart is an all-in-one shop for schools and parents. We help schools get bulk supplies and help parents find the right kits for their children, all at great prices.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center lg:justify-start">
                <button 
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className="px-8 py-4 bg-accent-orange text-deep-purple rounded-xl font-bold tracking-wider hover:bg-accent-gold transition-all shadow-xl shadow-orange-950/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  Register Your School <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className="px-8 py-4 border-2 border-primary text-primary rounded-xl font-bold tracking-wider hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  Register as Parent <ArrowRight size={18} />
                </button>
              </div>

              {/* Trusted Strip */}
              <div className="mt-12 lg:mt-20">
                <p className="text-[11px] font-bold uppercase text-gray-400 tracking-widest mb-6">Trusted by leading schools and institutions</p>
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-8 md:gap-10 grayscale opacity-40">
                  {['Delhi Public School', 'Ryan International', 'Kendriya Vidyalaya', 'DAV Public', 'Shriram Millennium', 'Suncity School'].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                       <div className="w-6 h-6 bg-primary/20 rounded-full"></div>
                       <span className="text-[12px] font-semibold">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Visuals */}
            <div className="lg:col-span-5 relative">
              <div className="relative w-full h-[500px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl bg-gray-100">
                <img src="/assets/about_hero.png" alt="School kids" className="w-full h-full object-cover" />
              </div>
              
              {/* Floating Stat Badges */}
              <div className="absolute top-10 -right-4 md:-right-10 flex flex-col gap-4 z-20">
                {[
                  { val: '500+', label: 'Schools & Institutions', icon: Building2, color: 'text-primary', bg: 'bg-primary/5' },
                  { val: '10,000+', label: 'Happy Parents', icon: Users, color: 'text-accent-green', bg: 'bg-green-50' },
                  { val: '50K+', label: 'Products Listed', icon: ShoppingBag, color: 'text-accent-orange', bg: 'bg-orange-50' },
                  { val: '₹250Cr+', label: 'Savings Delivered', icon: TrendingUp, color: 'text-primary', bg: 'bg-blue-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-4 rounded-3xl shadow-xl border border-gray-100 flex items-center gap-4 min-w-[200px] transform hover:scale-105 transition-transform">
                    <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-full flex items-center justify-center shrink-0`}>
                      <stat.icon size={20} />
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${stat.color}`}>{stat.val}</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Why We Exist Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="text-accent-green text-[11px] font-bold uppercase tracking-widest mb-4">OUR STORY</div>
              <h2 className="text-4xl md:text-5xl font-bold text-deep-purple mb-8">Why We Exist</h2>
              <div className="space-y-6 text-text-secondary leading-relaxed text-lg font-normal mb-12">
                <p>We noticed that schools and parents find it hard to get good quality supplies at fair prices.</p>
                <p>We started School E-Mart to fix this. We bring together top products and fair pricing in one easy-to-use website.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 {[
                   { icon: ShieldCheck, title: 'School Approved Kits', color: 'text-accent-green', bg: 'bg-green-50' },
                   { icon: TrendingUp, title: 'Direct Parent Savings', color: 'text-accent-orange', bg: 'bg-orange-50' },
                   { icon: BadgeCheck, title: 'Quality Guaranteed', color: 'text-primary', bg: 'bg-blue-50' },
                 ].map((item, i) => (
                   <div key={i} className="flex flex-col gap-4">
                     <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
                       <item.icon size={24} />
                     </div>
                     <span className="text-xs font-bold text-text-primary leading-tight">{item.title}</span>
                   </div>
                 ))}
              </div>
            </div>
            
            {/* Challenge vs Solution Visual */}
            <div className="relative">
              <div className="bg-gray-50 rounded-[3rem] p-8 md:p-12 relative overflow-hidden border border-gray-100">
                <div className="grid grid-cols-2 gap-8 md:gap-64">
                  <div className="space-y-6">
                    <h4 className="text-accent-orange text-[10px] font-bold uppercase tracking-widest">The Old Way</h4>
                    <ul className="space-y-4">
                      {['Fragmented suppliers', 'High procurement cost', 'Lack of transparency', 'Time consuming'].map((li, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs font-medium text-text-secondary">
                          <div className="w-5 h-5 bg-accent-orange/10 text-accent-orange rounded-full flex items-center justify-center text-[10px] font-bold">x</div> {li}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-6 text-right">
                    <h4 className="text-accent-green text-[10px] font-bold uppercase tracking-widest">The E-Mart Way</h4>
                    <ul className="space-y-4 flex flex-col items-end">
                      {['One-stop marketplace', 'Competitive pricing', 'Complete transparency', 'Digital automation'].map((li, i) => (
                        <li key={i} className="flex flex-row-reverse items-center gap-3 text-xs font-medium text-text-secondary">
                          <div className="w-5 h-5 bg-accent-green/10 text-accent-green rounded-full flex items-center justify-center text-[10px] font-bold">✓</div> {li}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {/* Center Circular Image Placeholder with Motion */}
                <div className="absolute top-1/2 left-1/2 w-32 h-32 md:w-56 md:h-56 rounded-full border-8 border-white bg-gray-200 shadow-2xl overflow-hidden hidden md:block animate-float-center z-20">
                  <img src="/assets/About_why_exist.png" alt="Challenge vs Solution" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Ecosystem Flow */}
      <section className="py-12 bg-soft-lavender/30 border-y border-purple-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-accent-green text-[11px] font-bold uppercase tracking-widest mb-4">HOW WE HELP</div>
          <h2 className="text-3xl md:text-4xl font-bold text-deep-purple mb-6">Built for Schools and Families</h2>
          <p className="text-text-secondary text-lg font-normal mb-20 max-w-2xl mx-auto">One place to manage everything your student or school needs.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting Arrows (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full px-24 z-0">
               <div className="flex justify-between">
                 {[1,2,3].map(i => <ArrowRight key={i} size={24} className="text-gray-200" />)}
               </div>
            </div>
            
            {[
              { title: 'For Your School', icon: Building2, desc: 'Buy furniture, lab gear, and bulk supplies easily', bg: 'bg-green-50', color: 'text-accent-green' },
              { title: 'For Your Child', icon: Users, desc: 'Find exact uniforms and books for your school', bg: 'bg-orange-50', color: 'text-accent-orange' },
              { title: 'Wide Selection', icon: ShoppingBag, desc: 'From pencils to smart boards, we have it all', bg: 'bg-blue-50', color: 'text-primary' },
              { title: 'Fast Delivery', icon: Truck, desc: 'Safe and quick delivery right to your door', bg: 'bg-green-50', color: 'text-accent-green' },
            ].map((step, i) => (
              <div key={i} className="relative z-10 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:shadow-xl transition-all">
                <div className={`w-16 h-16 ${step.bg} ${step.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                  <step.icon size={28} />
                </div>
                <h4 className="font-bold text-sm text-deep-purple mb-4">{step.title}</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed font-normal">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Category Showcase */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-accent-orange text-[11px] font-bold uppercase tracking-widest mb-4">OUR PRODUCTS</div>
          <h2 className="text-4xl md:text-5xl font-bold text-deep-purple mb-16">Everything for Your Education</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16 text-left">
            {[
              { title: 'Books & Stationery', icon: BookOpen, image: '/assets/books.png', desc: 'School books and daily writing supplies' },
              { title: 'School Uniforms', icon: Shirt, image: '/assets/uniforms.png', desc: 'Comfortable uniforms made to last' },
              { title: 'School Furniture', icon: Armchair, image: '/assets/furniture.png', desc: 'Modern desks, chairs and cupboards' },
              { title: 'Teaching Tools', icon: GraduationCap, image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=400', desc: 'Whiteboards and tools for teachers' },
              { title: 'Science & Lab', icon: FlaskConical, image: '/assets/lab_and_science.png', desc: 'Equip your school lab with the best gear' },
              { title: 'Smart Technology', icon: Laptop, image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400', desc: 'Tablets and laptops for modern learning' },
            ].map((cat, i) => (
              <div key={i} className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 group hover:shadow-xl transition-all flex flex-col h-full">
                <div className="h-32 bg-gray-50 relative overflow-hidden shrink-0">
                   <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute top-3 left-3 w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-primary">
                     <cat.icon size={16} />
                   </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h4 className="text-[13px] font-semibold text-deep-purple mb-2 leading-tight">{cat.title}</h4>
                  <p className="text-[10px] text-text-secondary leading-relaxed font-normal">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="px-10 py-4 border-2 border-primary rounded-xl font-semibold tracking-wider text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-3 mx-auto">
            Explore All Categories <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* 5. Procurement Journey (How It Works) */}
      <section className="py-12 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-accent-orange text-[11px] font-bold uppercase tracking-widest mb-4">HOW IT WORKS</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-20">Simple 4-Step Process</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
             <div className="hidden md:block absolute top-10 left-0 w-full px-24">
                <div className="h-[2px] bg-white/10 border-t border-dashed border-white/30"></div>
             </div>
             
             {[
               { step: '01. Register', icon: UserPlus, desc: 'Join as a school or a parent.' },
               { step: '02. Browse', icon: FileText, desc: 'Find what you need or ask for a bulk quote.' },
               { step: '03. Select', icon: Settings, desc: 'Pick the best quality and price for you.' },
               { step: '04. Receive', icon: Truck, desc: 'Order and get it delivered to your door.' },
             ].map((item, i) => (
               <div key={i} className="relative z-10 flex flex-col items-center">
                 <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-8 hover:bg-accent-orange hover:border-accent-orange transition-all duration-300">
                    <item.icon size={28} />
                 </div>
                 <h4 className="font-bold text-lg mb-4">{item.step}</h4>
                 <p className="text-[13px] text-white/60 leading-relaxed font-normal">{item.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 6. Mission & Vision */}
      <section className="py-12 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            
            {/* Mission Card */}
            <div className="flex-1 bg-soft-lavender/40 p-10 md:p-12 rounded-[2.5rem] relative group border border-purple-100/30 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white text-accent-orange rounded-full flex items-center justify-center shadow-sm">
                  <Target size={24} />
                </div>
                <h4 className="text-sm font-semibold uppercase tracking-widest text-deep-purple/60">OUR MISSION</h4>
              </div>
              <p className="text-[15px] md:text-[16px] text-text-primary leading-relaxed font-normal">
                To make buying school supplies easy, fair, and fast for everyone, so schools and parents can focus on what matters most—the students.
              </p>
            </div>
            
            {/* Center Hero Visual with Blobs */}
            <div className="relative w-full max-w-[400px] flex items-center justify-center">
               {/* Organic Blobs */}
               <div className="absolute top-0 -left-10 w-24 h-24 bg-green-100 rounded-full blur-3xl opacity-60"></div>
               <div className="absolute bottom-0 -right-10 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-60"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gray-50 rounded-full -z-10"></div>
               
               <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden border-8 border-white shadow-2xl z-10">
                  <img src="/assets/About_mission_hero.png" alt="Mission Hero" className="w-full h-full object-cover" />
               </div>
            </div>
            
            {/* Vision Card */}
            <div className="flex-1 bg-soft-lavender/40 p-10 md:p-12 rounded-[2.5rem] relative group border border-purple-100/30 shadow-sm text-right lg:text-left">
              <div className="flex items-center lg:justify-start justify-end gap-4 mb-8">
                <div className="w-12 h-12 bg-white text-accent-green rounded-full flex items-center justify-center shadow-sm">
                  <Eye size={24} />
                </div>
                <h4 className="text-sm font-semibold uppercase tracking-widest text-deep-purple/60">OUR VISION</h4>
              </div>
              <p className="text-[15px] md:text-[16px] text-text-primary leading-relaxed font-normal">
                To be the top choice for every school and parent in India, providing quality supplies to every student, everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Role Showcase (Split Panels) */}
      <section className="pb-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          {/* Schools Card */}
          <div className="bg-soft-lavender/40 rounded-[3rem] p-10 md:p-14 relative overflow-hidden group border border-purple-100/30 flex flex-col md:flex-row items-center gap-10">
             <div className="relative z-10 flex-1">
                <h3 className="text-2xl md:text-3xl font-bold text-deep-purple mb-8">For Schools & Institutions</h3>
                <ul className="space-y-4 mb-12">
                   {['Buy from top suppliers', 'Manage all your orders in one place', 'Get quick quotes and best prices', 'Help with your account anytime'].map((li, i) => (
                     <li key={i} className="flex items-center gap-3 text-[13px] font-medium text-text-primary">
                       <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px]">
                         <CheckCircle2 size={12} />
                       </div>
                       {li}
                     </li>
                   ))}
                </ul>
                <button 
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className="w-full sm:w-auto px-10 py-4 bg-accent-orange text-deep-purple rounded-xl font-bold tracking-wider hover:bg-accent-gold transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Onboard Your School <ArrowRight size={18} />
                </button>
             </div>
             <div className="relative w-full md:w-64 h-64 md:h-80 shrink-0 transform group-hover:scale-105 transition-transform duration-700">
                <img src="/assets/About_mission_school.png" alt="School illustration" className="w-full h-full object-contain" />
             </div>
          </div>
          
          {/* Parents Card */}
          <div className="bg-soft-lavender/40 rounded-[3rem] p-10 md:p-14 relative overflow-hidden group border border-purple-100/30 flex flex-col md:flex-row items-center gap-10">
             <div className="relative z-10 flex-1">
                <h3 className="text-2xl md:text-3xl font-bold text-accent-orange mb-8">For Parents & Students</h3>
                <ul className="space-y-4 mb-12">
                   {['Get school-approved kits and uniforms', 'See only what your child’s school requires', 'Save money with direct-to-parent pricing', 'Easy delivery right to your home'].map((li, i) => (
                     <li key={i} className="flex items-center gap-3 text-[13px] font-medium text-text-primary">
                       <div className="w-5 h-5 bg-accent-orange/10 text-accent-orange rounded-full flex items-center justify-center text-[10px]">
                         <CheckCircle2 size={12} />
                       </div>
                       {li}
                     </li>
                   ))}
                </ul>
                <button 
                  onClick={() => navigate(ROUTES.HOME)}
                  className="w-full sm:w-auto px-10 py-4 bg-primary text-white rounded-xl font-bold tracking-wider hover:bg-deep-purple transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Start Shopping <ArrowRight size={18} />
                </button>
             </div>
             <div className="relative w-full md:w-64 h-64 md:h-80 shrink-0 transform group-hover:scale-105 transition-transform duration-700">
                <img src="/assets/About_mission_vendor.png" alt="Parent illustration" className="w-full h-full object-contain" />
             </div>
          </div>
        </div>
      </section>

      {/* 8. Final CTA Section */}
      <section className="bg-primary py-12 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Make School Life Easier?</h2>
           <p className="text-lg opacity-80 mb-12 max-w-2xl mx-auto font-normal">Join thousands of schools and families already using School E-Mart.</p>
           <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button 
                onClick={() => navigate(ROUTES.REGISTER)}
                className="px-12 py-5 bg-accent-orange text-deep-purple rounded-2xl font-bold tracking-wider hover:bg-accent-gold hover:shadow-2xl transition-all active:scale-95 text-lg"
              >
                Register Your School
              </button>
              <button 
                onClick={() => navigate(ROUTES.REGISTER)}
                className="px-12 py-5 border-2 border-white/30 text-white rounded-2xl font-bold tracking-wider hover:bg-white/10 transition-all active:scale-95 text-lg"
              >
                Register as Parent
              </button>
           </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-10px); }
        }
        .animate-float-center {
          animation: float 4s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

// Mock missing icon
const UserPlus = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line></svg>
);

export default About;
