import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Search, 
  MapPin, 
  ChevronDown, 
  Bell, 
  Package, 
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight,
  Info,
  Truck,
  Building,
  History
} from 'lucide-react';
import ProductCard from '../../components/ui/ProductCard';
import useAuthStore from '../../store/useAuthStore';
import { ROUTES } from '../../constants/routes';
import LoginPromptModal from '../../components/shared/LoginPromptModal';

const SCHOOLS_DATA = [
  { id: 'DPS001', name: 'Delhi Public School, R.K. Puram', code: 'DPS-RKP', city: 'New Delhi' },
  { id: 'RYAN001', name: 'Ryan International School', code: 'RYAN-01', city: 'Mumbai' },
  { id: 'KV001', name: 'Kendriya Vidyalaya No. 1', code: 'KV-01', city: 'Bangalore' },
];

const GRADES = ['Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

const ANNOUNCEMENTS = [
  { id: 1, title: 'Winter Uniform Mandatory', date: 'Oct 15, 2024', content: 'As per school guidelines, winter uniforms are mandatory starting Nov 1st. Please ensure your child has the approved navy blue blazer.', type: 'alert' },
  { id: 2, title: 'New Session Textbooks', date: 'Sep 28, 2024', content: 'Textbooks for the mid-term session are now available. Please check the recommended list for your grade.', type: 'info' },
];

const RECOMMENDED_KITS = [
  {
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=600',
    category: 'Student Kits',
    title: 'Complete Grade 5 Essential Kit',
    currentPrice: 3450,
    originalPrice: 4200,
    discount: 18,
    hasBulkQuote: false,
    tag: 'Recommended by School',
    isApproved: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=600',
    category: 'Student Kits',
    title: 'Grade 5 Premium Stationery Bundle',
    currentPrice: 1200,
    originalPrice: 1500,
    discount: 20,
    hasBulkQuote: false,
    tag: 'Approved Item',
    isApproved: true,
  }
];

const ESSENTIAL_PRODUCTS = [
  {
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=600',
    category: 'Uniforms',
    title: 'Full Sleeve School Blazer - Navy Blue',
    currentPrice: 2450,
    originalPrice: 3200,
    discount: 23,
    hasBulkQuote: false,
    isMandatory: true,
    isApproved: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=600',
    category: 'Stationery',
    title: 'Oxford Mathematical Instrument Set',
    currentPrice: 350,
    originalPrice: 450,
    discount: 22,
    hasBulkQuote: false,
    isApproved: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
    category: 'Shoes',
    title: 'Puma School Sports Shoes - White',
    currentPrice: 1850,
    originalPrice: 2500,
    discount: 26,
    hasBulkQuote: false,
    isApproved: true,
  }
];

const MySchool = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedSchool, setSelectedSchool] = useState(SCHOOLS_DATA[0]);
  const [selectedGrade, setSelectedGrade] = useState('Class 5');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Mock progress
  const completedItems = 6;
  const totalItems = 10;
  const progressPercent = (completedItems / totalItems) * 100;

  const handleProtectedAction = (action, value = null) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    if (action === 'changeSchool') {
      setSelectedSchool(value);
      setShowSchoolDropdown(false);
    } else if (action === 'changeGrade') {
      setSelectedGrade(value);
    } else if (action === 'checkout') {
      console.log('Proceeding to checkout with kits and essentials');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* 1. Selection Header */}
      <div className="bg-white border-b border-gray-100 sticky top-[128px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* School Selector */}
            <div className="relative flex-1 w-full lg:w-auto">
              <div 
                onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
                className="flex items-center gap-4 px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer hover:border-primary transition-all group"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Building size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">My School</p>
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{selectedSchool.name}</p>
                </div>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${showSchoolDropdown ? 'rotate-180' : ''}`} />
              </div>

              {showSchoolDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 z-50">
                  {SCHOOLS_DATA.map(school => (
                    <div 
                      key={school.id}
                      onClick={() => handleProtectedAction('changeSchool', school)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                        <GraduationCap size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{school.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{school.city} • {school.code}</p>
                      </div>
                    </div>
                  ))}
                  <div className="p-2 border-t border-gray-50 mt-2">
                    <button 
                      onClick={() => handleProtectedAction('findSchool')}
                      className="w-full py-2.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Search size={14} /> Find Another School
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Grade Selector */}
            <div className="w-full lg:w-64">
              <div className="relative">
                <select 
                  value={selectedGrade}
                  onChange={(e) => handleProtectedAction('changeGrade', e.target.value)}
                  className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
                >
                  {GRADES.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                  <Package size={18} />
                </div>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Progress Checklist (Desktop) */}
            <div className="hidden xl:flex items-center gap-4 px-6 py-3 border-l border-gray-100">
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Shopping Progress</p>
                <p className="text-sm font-bold text-gray-900">{completedItems}/{totalItems} Items Complete</p>
              </div>
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent-green transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* 2. Announcements Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Bell className="text-accent-orange" size={24} /> School Notices
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ANNOUNCEMENTS.map(notice => (
                  <div key={notice.id} className={`p-5 rounded-2xl border ${notice.type === 'alert' ? 'bg-orange-50/50 border-orange-100' : 'bg-blue-50/50 border-blue-100'} transition-all hover:shadow-md`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${notice.type === 'alert' ? 'bg-accent-orange text-white' : 'bg-primary text-white'}`}>
                        {notice.type === 'alert' ? 'Action Required' : 'Update'}
                      </span>
                      <span className="text-[10px] font-medium text-gray-400">{notice.date}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{notice.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{notice.content}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Recommended Kits Section */}
            <section className="bg-primary/5 -mx-4 px-4 sm:mx-0 sm:px-8 py-8 sm:rounded-[2.5rem] border border-primary/10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-deep-purple">Recommended Kits</h2>
                  <p className="text-sm text-gray-500 mt-1">Pre-bundled essentials verified by {selectedSchool.name}</p>
                </div>
                <button className="text-sm font-bold text-primary hover:underline flex items-center gap-2">
                  View All Kits <ArrowRight size={14} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {RECOMMENDED_KITS.map((kit, index) => (
                  <div key={index} className="relative group">
                    <ProductCard product={kit} />
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-accent-green text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> {kit.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Essential Products Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Mandatory Essentials</h2>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-gray-400 hidden sm:block">Filter by:</span>
                  <div className="flex gap-2">
                    {['Uniforms', 'Books', 'Shoes'].map(cat => (
                      <button key={cat} className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium hover:border-primary hover:text-primary transition-all">
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {ESSENTIAL_PRODUCTS.map((product, index) => (
                  <div key={index} className="relative">
                    <ProductCard product={product} />
                    {product.isMandatory && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="bg-accent-orange/90 text-deep-purple text-[9px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm">
                          MANDATORY
                        </span>
                      </div>
                    )}
                    {product.isApproved && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-white/90 text-primary text-[9px] font-bold px-2.5 py-1 rounded-md border border-primary/20 backdrop-blur-sm flex items-center gap-1">
                          <CheckCircle2 size={10} /> {selectedSchool.code} Approved
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Shopping Checklist Card */}
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm sticky top-[160px]">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                <History className="text-primary" size={20} /> Smart Checklist
              </h3>
              
              <div className="space-y-5 mb-8">
                {[
                  { name: 'School Uniform Blazer', status: 'completed' },
                  { name: 'Grade 5 Textbook Set', status: 'completed' },
                  { name: 'Maths Geometry Box', status: 'pending' },
                  { name: 'White Sports Shoes', status: 'pending' },
                  { name: 'House Color Polo', status: 'pending' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${item.status === 'completed' ? 'bg-accent-green border-accent-green text-white' : 'bg-gray-50 border-gray-200'}`}>
                      {item.status === 'completed' && <CheckCircle2 size={12} />}
                    </div>
                    <span className={`text-sm ${item.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Truck size={14} /> Delivery Preferences
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center gap-2 p-3 bg-white border-2 border-primary rounded-xl text-center">
                    <ShoppingBag size={18} className="text-primary" />
                    <span className="text-[10px] font-bold text-primary">School Pickup</span>
                    <span className="text-[8px] text-gray-400">FREE Delivery</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl text-center hover:border-gray-300 transition-all">
                    <Truck size={18} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-700">Home Delivery</span>
                    <span className="text-[8px] text-gray-400">Charges apply</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={() => handleProtectedAction('checkout')}
                className="w-full py-4 bg-accent-orange text-deep-purple font-bold rounded-2xl shadow-xl shadow-orange-200 hover:bg-accent-gold transition-all active:scale-95"
              >
                Checkout All Essentials
              </button>
            </div>

            {/* Buy It Again */}
            <div className="bg-gray-900 rounded-[2rem] p-8 text-white">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                <History size={20} className="text-accent-orange" /> Buy Again
              </h3>
              <div className="space-y-6">
                {[
                  { name: 'A4 Copier Paper Bundle', price: '₹450', date: 'Last bought 2 months ago' },
                  { name: 'HB Graphite Pencils (12pcs)', price: '₹120', date: 'Last bought 3 weeks ago' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-accent-orange transition-colors">
                      <ShoppingBag size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-[10px] text-white/40">{item.date}</p>
                    </div>
                    <p className="text-sm font-bold text-accent-orange">{item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <LoginPromptModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        message="Please login to personalize your school experience, track your child's shopping progress, and access school-approved bundles."
      />
    </div>
  );
};

export default MySchool;
