import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Search, Filter, ShoppingCart,
  ChevronDown, Package, Sparkles,
  ShoppingBag
} from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { useCategoryTree } from '../../../hooks/useCategoryTree';
import { useProducts } from '../../../hooks/useProducts';
import { findHeaderByCategoryName } from '../../../utils/mappers/categoryMapper';
import { gradeLabelToQuery, sortKeyFromLabel } from '../../../utils/mappers/productMapper';

const GradeProductsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const grade = searchParams.get('grade') || 'All Grades';
  const { tree } = useCategoryTree();

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Recommended');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const categories = ['All', 'Uniforms', 'Books', 'Stationery', 'Shoes', 'Bags', 'Accessories'];
  const sortOptions = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Rating'];

  const selectedHeader = useMemo(
    () => findHeaderByCategoryName(tree, activeCategory),
    [tree, activeCategory]
  );

  const productQuery = useMemo(() => {
    const query = {
      limit: 50,
      sort: sortKeyFromLabel(sortBy),
      grade: gradeLabelToQuery(grade),
      search: searchQuery || undefined,
    };
    if (selectedHeader?.id) query.headerId = selectedHeader.id;
    return query;
  }, [grade, searchQuery, sortBy, selectedHeader]);

  const { products, loading, pagination } = useProducts(productQuery);
  const filteredProducts = products;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-outfit">
      <div className="bg-gradient-to-br from-deep-purple via-deep-purple to-[#4c489d] pt-8 pb-6 px-6 rounded-b-[2.5rem] shadow-xl relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/user/home')}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div
              onClick={() => navigate('/user/select-grade')}
              className="flex flex-col cursor-pointer group active:opacity-70 transition-all"
            >
              <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                Shopping for <ChevronDown size={10} className="group-hover:translate-y-0.5 transition-transform" />
              </div>
              <h1 className="text-xl font-bold text-white leading-none">{grade}</h1>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white relative active:scale-90 transition-all">
            <ShoppingBag size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full border-2 border-deep-purple"></span>
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder={`Search in ${grade}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 bg-white rounded-2xl text-sm shadow-inner focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border
              ${activeCategory === cat
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-6 mt-6">
        {activeCategory === 'All' && !searchQuery && (
          <Link
            to="/user/product/bundle_1"
            className="mb-8 relative overflow-hidden bg-gradient-to-r from-[#ffc107] to-[#ffb300] rounded-3xl p-6 shadow-xl shadow-yellow-100/50 group active:scale-[0.98] transition-all cursor-pointer block"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div className="max-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-deep-purple animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-deep-purple/60">Most Convenient</span>
                </div>
                <h2 className="text-xl font-black text-deep-purple leading-tight mb-2">Complete {grade} Kit</h2>
                <p className="text-deep-purple/70 text-[11px] font-bold leading-relaxed mb-4">Books, Uniforms, Stationery & more in one box!</p>
                <button className="px-5 py-2 bg-deep-purple text-white rounded-xl text-[10px] font-bold shadow-lg shadow-black/10">
                  Buy Bundle & Save 20%
                </button>
              </div>
              <div className="w-24 h-24 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/40 shadow-inner">
                <Package size={48} className="text-deep-purple" />
              </div>
            </div>
          </Link>
        )}

        <div className="flex items-center justify-between mb-4 relative">
          <h2 className="text-lg font-bold text-deep-purple">
            Products ({pagination?.total ?? filteredProducts.length})
          </h2>
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm active:scale-95 transition-all"
            >
              {sortBy} <ChevronDown size={10} className={`transition-transform duration-300 ${showSortDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowSortDropdown(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-50 py-2 z-30 animate-in fade-in zoom-in duration-200">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors ${sortBy === option ? 'text-primary bg-primary/5' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">Loading products...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-deep-purple mb-1">No products found</h3>
            <p className="text-gray-400 text-xs">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeProductsPage;
