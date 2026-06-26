import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Hero from '../../components/shared/Hero';
import ProductShowcase from '../products/Showcase';
import BannerRow from './components/BannerRow';
import CategoryShowcase from './components/CategoryShowcase';
import { Search, GraduationCap, MapPin, ChevronDown } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useCategoryTree } from '../../hooks/useCategoryTree';
import { useProducts } from '../../hooks/useProducts';
import { mapProductForMarketingCard } from '../../utils/mappers/productMapper';

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
  const { tree: categoryTree } = useCategoryTree();
  const { products: catalogProducts, loading: productsLoading } = useProducts({ limit: 8, sort: 'popular' });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [role]);

  const currentProducts = catalogProducts.map((p) => mapProductForMarketingCard(p));
  const currentBanners = [];

  const categoryProducts = categoryTree.slice(0, 4).map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    image: cat.image,
  }));

  return (
    <main className="flex flex-col">
      <Hero role={role} />

      {role === 'parent' && <SchoolSelector navigate={navigate} />}

      <ProductShowcase role={role} />

      <div className="pt-16 pb-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <h2 className="text-2xl font-bold text-text-primary">
            {role === 'school' ? 'Institutional Categories' : 'Student Shopping Categories'}
          </h2>
        </div>
        {currentBanners.length > 0 && <BannerRow banners={currentBanners} />}
        <CategoryShowcase
          title={role === 'school' ? 'Bulk Orders & Infrastructure' : 'Everything for Students'}
          subtitle={role === 'school' ? 'Direct factory-to-school procurement solutions.' : 'Top brands for books, uniforms, and school essentials.'}
          products={productsLoading ? [] : currentProducts}
          categories={categoryProducts}
        />
      </div>
    </main>
  );
};

export default MarketplaceHome;
