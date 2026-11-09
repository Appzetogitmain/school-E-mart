import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Search, ShoppingBag, Star, Filter, Sparkles,
  RotateCcw, ChevronDown, X
} from 'lucide-react';
import SchoolHeader from '../../components/SchoolHeader';
import { useCart } from '../../context/CartContext';
import { useCategoryTree } from '../../../hooks/useCategoryTree';
import { useProducts } from '../../../hooks/useProducts';
import {
  buildProductQueryForSubcategory,
  getSubcategoryOptions,
  resolveTaxonomyFromParam,
} from '../../../utils/mappers/categoryMapper';
import { sortKeyFromLabel } from '../../../utils/mappers/productMapper';

const SchoolSubcategoryPage = () => {
  const navigate = useNavigate();
  const { categoryName } = useParams();
  const { addToCart } = useCart();
  const [activeSub, setActiveSub] = useState('All');
  const [orderingId, setOrderingId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [availability, setAvailability] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('Recommended');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [schoolInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('childInfo');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          school: parsed.school || parsed.schoolName || parsed.name || 'Adarsh Public School',
          schoolLogo: parsed.schoolLogo || parsed.logo || null,
          role: 'school',
          ...parsed,
        };
      }
    } catch {
      // Fallback below
    }
    return { school: 'School Portal', code: 'APS-1024' };
  });

  const { tree, loading: treeLoading } = useCategoryTree();

  const taxonomy = useMemo(() => resolveTaxonomyFromParam(tree, categoryName), [tree, categoryName]);
  const subcategories = useMemo(() => getSubcategoryOptions(taxonomy), [taxonomy]);

  const productQuery = useMemo(() => {
    const query = buildProductQueryForSubcategory(taxonomy, activeSub, subcategories);
    if (debouncedSearch) {
      query.search = debouncedSearch;
    }
    if (availability !== 'all') {
      query.availability = availability;
    }
    if (priceRange === 'under_1000') {
      query.maxPrice = 99999;
    } else if (priceRange === '1000_5000') {
      query.minPrice = 100000;
      query.maxPrice = 500000;
    } else if (priceRange === 'over_5000') {
      query.minPrice = 500001;
    }
    if (sortBy && sortBy !== 'Recommended') {
      query.sort = sortKeyFromLabel(sortBy);
    }
    return query;
  }, [taxonomy, activeSub, subcategories, debouncedSearch, availability, priceRange, sortBy]);

  const { products, pagination, loading: productsLoading, error } = useProducts(productQuery, {
    mapperKey: 'subcategory',
  });

  const hasActiveFilters = availability !== 'all' || priceRange !== 'all' || sortBy !== 'Recommended';

  const handleResetFilters = () => {
    setAvailability('all');
    setPriceRange('all');
    setSortBy('Recommended');
  };

  const handleResetAll = () => {
    handleResetFilters();
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const handleOrderBulk = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setOrderingId(product.id);
    try {
      await addToCart(product);
      navigate('/school/cart');
    } catch (err) {
      console.error('Failed to add to bulk cart:', err);
    } finally {
      setOrderingId(null);
    }
  };

  const renderProductCard = (product) => (
    <div key={product.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col overflow-hidden group active:scale-[0.98] transition-all">
      <Link to={`/school/product/${product.id}`} className="relative h-36 w-full bg-gray-50/60 p-2.5 flex items-center justify-center overflow-hidden block">
        <div className="absolute top-2.5 left-2.5 bg-primary/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-wider z-10 shadow-lg">
          Bulk Deal
        </div>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute top-2.5 right-2.5 text-gray-300 hover:text-red-500 transition-colors z-10 bg-white/80 backdrop-blur-md w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
        >
          <Star size={14} />
        </button>
        <img
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 select-none"
        />
      </Link>
      <div className="p-5 flex flex-col flex-1">
        <Link to={`/school/product/${product.id}`}>
          <h3 className="text-sm font-bold text-deep-purple leading-tight line-clamp-2 h-10 mb-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-[10px] text-gray-400 font-medium mb-4">Institutional Quality Guaranteed</p>
        <div className="flex flex-col mb-4">
          <span className="text-primary font-black text-lg leading-none">{product.price}</span>
          <span className="text-[9px] text-gray-400 mt-1">per batch order</span>
        </div>
        <button
          type="button"
          disabled={orderingId === product.id}
          onClick={(e) => handleOrderBulk(e, product)}
          className="w-full py-3 bg-[#ffc107] hover:bg-[#ffb300] text-black rounded-2xl text-[11px] font-black shadow-lg shadow-yellow-100 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <ShoppingBag size={14} />
          {orderingId === product.id ? 'Adding to Bulk Cart...' : 'ORDER BULK'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white font-outfit">
      <SchoolHeader
        showSearch={true}
        childInfo={schoolInfo}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Category Rail */}
        <div className="w-24 bg-gray-50/50 border-r border-gray-100 overflow-y-auto scrollbar-hide pt-52 pb-32">
          <div className="flex flex-col items-center gap-6">
            {(treeLoading ? [{ id: 'all', name: 'All', image: '/assets/uniforms.png' }] : subcategories).map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSub(sub.name)}
                className="flex flex-col items-center gap-2 group w-full px-2 cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-[1.8rem] border-2 p-1 transition-all duration-300 relative ${activeSub === sub.name ? 'border-primary bg-white shadow-xl scale-105' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                  <img src={sub.image} alt={sub.name} className="w-full h-full object-cover rounded-[1.5rem] mix-blend-multiply" />
                  {activeSub === sub.name && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-l-full"></div>
                  )}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-tighter text-center leading-tight transition-colors ${activeSub === sub.name ? 'text-primary' : 'text-gray-400'}`}>
                  {sub.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto bg-white pt-48 pb-32 px-6">
          <div className="bg-gradient-to-br from-[#ffc107] to-[#ffb300] rounded-[2.5rem] p-8 mb-8 relative overflow-hidden group shadow-xl shadow-yellow-100/50">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            <div className="relative z-10 max-w-[85%]">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-deep-purple" />
                <span className="text-[10px] font-black uppercase tracking-widest text-deep-purple/60">Launch Offer</span>
              </div>
              <h2 className="text-deep-purple text-xl font-black leading-tight mb-4">Special Rates for {taxonomy.title}</h2>
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    title: `Bulk Quote Request - ${taxonomy.title}`,
                  });
                  if (activeSub && activeSub !== 'All') {
                    params.set('notes', `Requesting bulk quotation for ${activeSub} (${taxonomy.title}).`);
                  } else {
                    params.set('notes', `Requesting bulk quotation for ${taxonomy.title}.`);
                  }
                  navigate(`/school/create-request?${params.toString()}`);
                }}
                className="bg-deep-purple text-white text-[10px] font-black px-6 py-3 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                REQUEST QUOTE
              </button>
            </div>
          </div>

          {/* Section Header with working Filter Button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-black text-deep-purple uppercase tracking-[0.2em]">
              Bulk Products {pagination?.total !== undefined ? `(${pagination.total})` : `(${products.length})`}
            </h2>
            <button
              type="button"
              onClick={() => setFilterOpen((open) => !open)}
              aria-label="Filter bulk products"
              aria-expanded={filterOpen}
              className={`flex items-center gap-1.5 text-[10px] font-black px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                filterOpen || hasActiveFilters
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                  : 'text-primary bg-primary/10 hover:bg-primary/20 active:scale-95'
              }`}
            >
              <Filter size={13} />
              FILTER
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 ml-0.5"></span>
              )}
            </button>
          </div>

          {/* Mobile-friendly Filter Panel */}
          {filterOpen && (
            <div className="mb-6 rounded-2xl bg-gray-50/90 border border-gray-100 p-4 space-y-3 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Filter & Sort Bulk Products
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Availability */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Availability</label>
                  <div className="relative">
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="w-full appearance-none rounded-xl bg-white border border-gray-200 pl-2.5 pr-7 py-2 text-xs font-semibold text-deep-purple focus:outline-none focus:border-primary shadow-xs cursor-pointer"
                    >
                      <option value="all">All products</option>
                      <option value="in_stock">In stock</option>
                      <option value="out_of_stock">Out of stock</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Price Range</label>
                  <div className="relative">
                    <select
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="w-full appearance-none rounded-xl bg-white border border-gray-200 pl-2.5 pr-7 py-2 text-xs font-semibold text-deep-purple focus:outline-none focus:border-primary shadow-xs cursor-pointer"
                    >
                      <option value="all">Any price</option>
                      <option value="under_1000">Under ₹1,000</option>
                      <option value="1000_5000">₹1,000–₹5,000</option>
                      <option value="over_5000">Over ₹5,000</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Sort by</label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full appearance-none rounded-xl bg-white border border-gray-200 pl-2.5 pr-7 py-2 text-xs font-semibold text-deep-purple focus:outline-none focus:border-primary shadow-xs cursor-pointer"
                    >
                      <option value="Recommended">Recommended</option>
                      <option value="Price: Low to High">Price: Low to High</option>
                      <option value="Price: High to Low">Price: High to Low</option>
                      <option value="Rating">Rating</option>
                      <option value="newest">Newest</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid / Empty State */}
          {productsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
              <p className="text-xs font-semibold text-gray-400">Loading products...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-xs font-semibold text-red-500 mb-2">{error}</p>
              <button
                type="button"
                onClick={handleResetAll}
                className="text-xs font-bold text-primary underline cursor-pointer"
              >
                Reset Search & Filters
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center px-4 bg-gray-50/60 rounded-3xl border border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <Filter size={20} />
              </div>
              <h3 className="text-sm font-bold text-deep-purple mb-1">No products found</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
                {debouncedSearch
                  ? `No institutional supplies match "${debouncedSearch}".`
                  : 'No products match your selected filters in this category.'}
              </p>
              {(hasActiveFilters || debouncedSearch) && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={12} /> Clear Filters & Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {products.map((product) => renderProductCard(product))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolSubcategoryPage;
