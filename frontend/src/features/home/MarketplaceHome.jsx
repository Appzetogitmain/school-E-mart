import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Hero from '../../components/shared/Hero';
import ProductShowcase from '../products/Showcase';
import BannerRow from './components/BannerRow';
import CategoryShowcase from './components/CategoryShowcase';
import { Search, GraduationCap, MapPin, ChevronDown } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const PARENT_PRODUCTS = [
  {
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=600',
    category: 'Student Kits',
    title: 'Complete Grade 5 Book & Stationery Kit',
    currentPrice: 2450,
    originalPrice: 3200,
    discount: 23,
    hasBulkQuote: false,
  },
  {
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=600',
    category: 'Uniforms',
    title: 'Formal School Uniform Set - Secondary Level',
    currentPrice: 1850,
    originalPrice: 2500,
    discount: 26,
    hasBulkQuote: false,
  },
  {
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=600',
    category: 'Bags & Accessories',
    title: 'Ergonomic Waterproof School Backpack',
    currentPrice: 1200,
    originalPrice: 1800,
    discount: 33,
    hasBulkQuote: false,
  },
  {
    image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=600',
    category: 'Stationery',
    title: 'Premium Geometry & Art Supply Box',
    currentPrice: 450,
    originalPrice: 650,
    discount: 30,
    hasBulkQuote: false,
  }
];

const SCHOOL_PRODUCTS = [
  {
    image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&q=80&w=600',
    category: 'Furniture',
    title: 'Bulk Order: Dual Student Desk & Chair Set (50+ units)',
    currentPrice: 4200,
    originalPrice: 5500,
    discount: 24,
    hasBulkQuote: true,
    moq: '50 Sets',
  },
  {
    image: 'https://images.unsplash.com/photo-1530639834082-05bafb81dbad?auto=format&fit=crop&q=80&w=600',
    category: 'STEM Labs',
    title: 'Institutional Robotics & Coding Lab Setup',
    currentPrice: 125000,
    originalPrice: 150000,
    discount: 16,
    hasBulkQuote: true,
    moq: '1 Lab',
  },
  {
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600',
    category: 'Lab Equipment',
    title: 'Compound Microscope Bulk Pack (10 units)',
    currentPrice: 75000,
    originalPrice: 90000,
    discount: 17,
    hasBulkQuote: true,
    moq: '10 Units',
  },
  {
    image: 'https://images.unsplash.com/photo-1756158448520-05fa211d60f9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Sports Infrastructure',
    title: 'Complete Outdoor Basketball Hoops & Nets',
    currentPrice: 35000,
    originalPrice: 45000,
    discount: 22,
    hasBulkQuote: true,
    moq: '2 Units',
  }
];

const SchoolSelector = ({ navigate }) => (
  <div className="bg-white border-y border-gray-100 py-4 shadow-sm sticky top-[128px] z-40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-3 text-primary shrink-0">
          <GraduationCap size={24} />
          <span className="font-semibold text-sm uppercase tracking-wider">Find My School</span>
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Enter School Name or Code" 
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
              <option>Select City</option>
              <option>New Delhi</option>
              <option>Mumbai</option>
              <option>Bangalore</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>

          <div className="relative">
            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
              <option>Select Grade/Class</option>
              {[...Array(12)].map((_, i) => (
                <option key={i}>Grade {i + 1}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        <button 
          onClick={() => navigate(ROUTES.MY_SCHOOL)}
          className="px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-deep-purple transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
        >
          View Kits
        </button>
      </div>
    </div>
  </div>
);

const MarketplaceHome = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role') || 'parent';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [role]);

  const parentBanners = [
    { image: '/assets/category_banner1.png', title: 'School Uniforms', badge: 'Best Quality', link: '/category/uniforms' },
    { image: 'https://images.unsplash.com/photo-1556316384-12c3de3033db?auto=format&fit=crop&q=80&w=800', title: 'Curated Books', badge: 'Latest Edition', link: '/category/books' },
    { image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800', title: 'Sports Kits', badge: 'Premium', link: '/category/sports' },
  ];

  const schoolBanners = [
    { image: '/assets/category_banner2.png', title: 'Bulk Furniture', badge: 'Factory Prices', link: '/category/furniture' },
    { image: '/assets/category_banner3.png', title: 'STEM Lab Setup', badge: 'Turnkey', link: '/category/stem-labs' },
    { image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800', title: 'Bulk Uniforms', badge: 'Customizable', link: '/category/uniforms' },
  ];

  const currentBanners = role === 'school' ? schoolBanners : parentBanners;
  const currentProducts = role === 'school' ? SCHOOL_PRODUCTS : PARENT_PRODUCTS;

  return (
    <main className="flex flex-col">
      <Hero role={role} />
      
      {role === 'parent' && <SchoolSelector navigate={navigate} />}
      
      <ProductShowcase role={role} />
      
      {/* Dynamic Category Section */}
      <div className="pt-16 pb-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <h2 className="text-2xl font-bold text-text-primary">
            {role === 'school' ? 'Institutional Categories' : 'Student Shopping Categories'}
          </h2>
        </div>
        <BannerRow banners={currentBanners} />
        <CategoryShowcase 
          title={role === 'school' ? "Bulk Orders & Infrastructure" : "Everything for Students"} 
          subtitle={role === 'school' ? "Direct factory-to-school procurement solutions." : "Top brands for books, uniforms, and school essentials."}
          products={currentProducts} 
          role={role}
        />
      </div>
    </main>
  );
};

export default MarketplaceHome;
