import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingBag, Filter, ChevronDown, RotateCcw } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { useCategoryTree } from '../../../hooks/useCategoryTree';
import { useProducts } from '../../../hooks/useProducts';
import { useCart } from '../../context/CartContext';
import {
  buildProductQueryForSubcategory,
  getSubcategoryOptions,
  resolveTaxonomyFromParam,
} from '../../../utils/mappers/categoryMapper';

const SubcategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { totalQuantity } = useCart();
  const [activeSub, setActiveSub] = useState('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [availability, setAvailability] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const { tree, loading: treeLoading } = useCategoryTree();

  const taxonomy = useMemo(() => resolveTaxonomyFromParam(tree, categoryId), [tree, categoryId]);
  const subcategories = useMemo(() => getSubcategoryOptions(taxonomy), [taxonomy]);
  const productQuery = useMemo(
    () => {
      const query = buildProductQueryForSubcategory(taxonomy, activeSub, subcategories);
      if (search.trim()) query.q = search.trim();
      if (availability !== 'all') query.availability = availability;
      if (priceRange === 'under_1000') query.maxPrice = 99999;
      if (priceRange === '1000_5000') { query.minPrice = 100000; query.maxPrice = 500000; }
      if (priceRange === 'over_5000') query.minPrice = 500001;
      return query;
    },
    [taxonomy, activeSub, subcategories, search, availability, priceRange]
  );
  const { products, loading: productsLoading, pagination, error } = useProducts(productQuery, {
    mapperKey: 'subcategory',
  });

  const renderProductCard = (product) => (
    <ProductCard key={product.id} product={product} />
  );

  return (
    <div className="flex flex-col h-full bg-white font-outfit">
      {/* 1. Header */}
      <div className="bg-white px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-50 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-deep-purple active:scale-90 transition-all cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-deep-purple capitalize">{taxonomy.title || categoryId || 'Products'}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {pagination?.total ?? products.length} Items found
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            aria-label="Search products" 
            onClick={() => setSearchOpen((value) => !value)} 
            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-deep-purple active:scale-90 transition-all cursor-pointer"
          >
            <Search size={20} />
          </button>
          <button 
            type="button" 
            aria-label="Shopping Cart" 
            onClick={() => navigate('/user/cart')} 
            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-primary active:scale-90 transition-all relative cursor-pointer"
          >
            <ShoppingBag size={20} />
            {totalQuantity > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {totalQuantity}
              </span>
            ) : (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Search Field (Collapsible) */}
      {searchOpen && (
        <form onSubmit={(event) => { event.preventDefault(); setSearch(searchInput); }} className="flex gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <input 
            autoFocus 
            aria-label="Search products" 
            value={searchInput} 
            onChange={(event) => setSearchInput(event.target.value)} 
            placeholder="Search products..." 
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary shadow-xs" 
          />
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer">
            Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="text-xs font-bold text-primary cursor-pointer">
              Clear
            </button>
          )}
        </form>
      )}

      {/* 3. Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Subcategory Rail */}
        <div className="w-20 bg-gray-50/50 border-r border-gray-100 overflow-y-auto scrollbar-hide py-4">
          <div className="flex flex-col items-center gap-6">
            {(treeLoading ? [{ id: 'all', name: 'All', image: '/assets/uniforms.png' }] : subcategories).map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSub(sub.name)}
                className="flex flex-col items-center gap-2 group w-full px-1 cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-full border-2 p-1 transition-all duration-300 relative ${activeSub === sub.name ? 'border-primary bg-white shadow-md' : 'border-transparent bg-white/50'}`}>
                  <img src={sub.image} alt={sub.name} className="w-full h-full object-cover rounded-full mix-blend-multiply" />
                  {activeSub === sub.name && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full"></div>
                  )}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-tighter text-center leading-tight transition-colors ${activeSub === sub.name ? 'text-primary' : 'text-gray-400'}`}>
                  {sub.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Product Grid */}
        <div className="flex-1 overflow-y-auto bg-white px-4 pt-4 pb-24">
          
          {/* Promo Card */}
          <div className="bg-amber-50 rounded-3xl p-5 mb-5 relative overflow-hidden min-h-[140px] flex flex-col justify-center">
            <div className="relative z-10 max-w-[60%]">
              <span className="inline-block bg-[#ffc107] text-black text-[9px] font-black px-2 py-0.5 rounded-md mb-2 shadow-xs">
                30% OFF
              </span>
              <h2 className="text-deep-purple text-base font-black leading-tight mb-2.5">
                Everything for {taxonomy.title}
              </h2>
              <button 
                type="button"
                onClick={() => {
                  const target = document.querySelector('[data-product-list]');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-black text-white text-[10px] font-black px-3.5 py-1.5 rounded-full active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                ORDER NOW
              </button>
            </div>
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=400&h=300&fit=crop"
              className="absolute right-0 top-0 h-full w-[45%] object-cover mix-blend-multiply opacity-80 pointer-events-none"
              alt="Promo"
            />
          </div>

          {/* Product Header & Filter Toggle */}
          <div data-product-list className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-deep-purple uppercase tracking-wider">{activeSub} Products</h2>
            <button 
              type="button" 
              onClick={() => setFilterOpen((value) => !value)} 
              aria-expanded={filterOpen} 
              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                filterOpen || availability !== 'all' || priceRange !== 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-primary bg-primary/10 hover:bg-primary/20'
              }`}
            >
              <Filter size={13} />
              FILTER
              {(availability !== 'all' || priceRange !== 'all') && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-gold ml-0.5"></span>
              )}
            </button>
          </div>

          {/* Compact Mobile-Friendly Filter Dropdowns */}
          {filterOpen && (
            <div className="mb-4 rounded-2xl bg-gray-50/80 border border-gray-100 p-3 space-y-2.5 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Filter Products</span>
                {(availability !== 'all' || priceRange !== 'all') && (
                  <button 
                    type="button" 
                    onClick={() => { setAvailability('all'); setPriceRange('all'); }} 
                    className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Availability Dropdown */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Availability</label>
                  <div className="relative">
                    <select 
                      value={availability} 
                      onChange={(event) => setAvailability(event.target.value)} 
                      className="w-full appearance-none rounded-xl bg-white border border-gray-200/90 pl-2.5 pr-6 py-1.5 text-xs font-bold text-deep-purple focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs cursor-pointer truncate"
                    >
                      <option value="all">All products</option>
                      <option value="in_stock">In stock</option>
                      <option value="out_of_stock">Out of stock</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Price Dropdown */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Price</label>
                  <div className="relative">
                    <select 
                      value={priceRange} 
                      onChange={(event) => setPriceRange(event.target.value)} 
                      className="w-full appearance-none rounded-xl bg-white border border-gray-200/90 pl-2.5 pr-6 py-1.5 text-xs font-bold text-deep-purple focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs cursor-pointer truncate"
                    >
                      <option value="all">Any price</option>
                      <option value="under_1000">&lt; ₹1,000</option>
                      <option value="1000_5000">₹1,000–₹5,000</option>
                      <option value="over_5000">&gt; ₹5,000</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          {productsLoading ? (
            <p className="text-center text-sm text-gray-400 py-10">Loading products...</p>
          ) : error ? (
            <p role="alert" className="text-center text-sm text-red-500 py-10">{error}</p>
          ) : products.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">No products match your search or filters.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => renderProductCard(product))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubcategoryPage;
