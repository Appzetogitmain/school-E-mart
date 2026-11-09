import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Filter,
  ChevronDown, Sparkles, RotateCcw, X,
  ShoppingBag, Building2, Loader2
} from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { useCategoryTree } from '../../../hooks/useCategoryTree';
import * as catalogApi from '../../../services/catalogApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapProductForCard, gradeLabelToQuery, sortKeyFromLabel } from '../../../utils/mappers/productMapper';
import { findHeaderByCategoryName } from '../../../utils/mappers/categoryMapper';

const PAGE_SIZE = 50;

const SchoolProductsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const grade = searchParams.get('grade') || 'Bulk Orders';
  const urlSearch = searchParams.get('search') || '';

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [filterOpen, setFilterOpen] = useState(false);
  const [availability, setAvailability] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('Recommended');
  const { tree } = useCategoryTree();

  // Products & Pagination State
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Sync search from URL param if available
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null && s !== undefined) {
      setSearchQuery(s);
      setDebouncedSearch(s.trim());
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const categories = useMemo(() => ['All', ...(tree || []).map((item) => item.name)], [tree]);

  const selectedHeader = useMemo(
    () => findHeaderByCategoryName(tree, activeCategory),
    [tree, activeCategory]
  );

  // Base query filters for fetching products
  const baseFilterQuery = useMemo(() => {
    const query = {
      limit: PAGE_SIZE,
      sort: sortKeyFromLabel(sortBy),
      grade: gradeLabelToQuery(grade),
      search: debouncedSearch || undefined,
      ...(selectedHeader?.id ? { headerId: selectedHeader.id } : {}),
    };
    if (availability !== 'all') query.availability = availability;
    if (priceRange === 'under_1000') query.maxPrice = 99999;
    if (priceRange === '1000_5000') { query.minPrice = 100000; query.maxPrice = 500000; }
    if (priceRange === 'over_5000') query.minPrice = 500001;
    return query;
  }, [grade, debouncedSearch, sortBy, selectedHeader, availability, priceRange]);

  // Load initial page (page 1) whenever base filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(1);

    const query = { ...baseFilterQuery, page: 1 };
    catalogApi.listProducts(query)
      .then(({ data, pagination: pageMeta }) => {
        if (cancelled) return;
        setProducts((data || []).map((item) => mapProductForCard(item)));
        setPagination(pageMeta);
      })
      .catch((err) => {
        if (!cancelled) {
          setProducts([]);
          setError(getErrorMessage(err, 'Unable to load products'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [baseFilterQuery]);

  // Handle Load More
  const handleLoadMore = async () => {
    if (loadingMore || loading) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const query = { ...baseFilterQuery, page: nextPage };
      const { data, pagination: pageMeta } = await catalogApi.listProducts(query);
      const newItems = (data || []).map((item) => mapProductForCard(item));
      setProducts((prev) => [...prev, ...newItems]);
      setPage(nextPage);
      setPagination(pageMeta);
    } catch (err) {
      console.error('Failed to load more products:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasFilters = availability !== 'all' || priceRange !== 'all' || sortBy !== 'Recommended';
  const totalCount = pagination?.total ?? products.length;
  const hasMore = pagination ? pagination.hasNextPage || products.length < pagination.total : false;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 font-outfit">
      <div className="bg-gradient-to-br from-deep-purple via-deep-purple to-[#4c489d] pt-8 pb-6 px-6 rounded-b-[2.5rem] shadow-xl relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/school/admin')} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <div onClick={() => navigate('/school/grade')} className="flex flex-col cursor-pointer group">
              <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                Bulk Orders <ChevronDown size={10} className="group-hover:translate-y-0.5" />
              </div>
              <h1 className="text-xl font-bold text-white leading-none">{grade}</h1>
            </div>
          </div>
          <button onClick={() => navigate('/school/cart')} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white relative cursor-pointer">
            <ShoppingBag size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full border-2 border-deep-purple"></span>
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 bg-white rounded-2xl text-sm shadow-inner outline-none font-medium"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search" className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer">
              <X size={16} />
            </button>
          )}
          <button type="button" onClick={() => setFilterOpen((open) => !open)} aria-label="Filter bulk products" aria-expanded={filterOpen} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary cursor-pointer">
            <Filter size={18} />
          </button>
        </div>
        {filterOpen && (
          <div className="mt-3 rounded-2xl bg-white p-4 space-y-3 shadow-md animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-deep-purple">Filter bulk products</span>
              {hasFilters && (
                <button type="button" onClick={() => { setAvailability('all'); setPriceRange('all'); setSortBy('Recommended'); }} className="flex items-center gap-1 text-xs text-primary cursor-pointer hover:underline">
                  <RotateCcw size={12} /> Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="text-xs text-gray-600">Availability
                <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-deep-purple cursor-pointer">
                  <option value="all">All products</option><option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option>
                </select>
              </label>
              <label className="text-xs text-gray-600">Price
                <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-deep-purple cursor-pointer">
                  <option value="all">Any price</option><option value="under_1000">Under ₹1,000</option><option value="1000_5000">₹1,000–₹5,000</option><option value="over_5000">Over ₹5,000</option>
                </select>
              </label>
              <label className="text-xs text-gray-600">Sort by
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-deep-purple cursor-pointer">
                  <option>Recommended</option><option>Price: Low to High</option><option>Price: High to Low</option><option>Rating</option><option value="newest">Newest</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              activeCategory === cat ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white text-gray-400 border-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-6 mt-6">
        {activeCategory === 'All' && !searchQuery && !hasFilters && (
          <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-[#ffc107] to-[#ffb300] rounded-3xl p-6 shadow-xl shadow-yellow-100/50 block">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div className="max-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-deep-purple" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-deep-purple/60">Popular Item</span>
                </div>
                <h2 className="text-xl font-black text-deep-purple leading-tight mb-2">{grade} Kit</h2>
                <p className="text-deep-purple/70 text-[11px] font-bold leading-relaxed mb-4">Perfect for institutional batch orders.</p>
                <button className="px-5 py-2 bg-deep-purple text-white rounded-xl text-[10px] font-bold shadow-lg cursor-pointer">
                  Order Now
                </button>
              </div>
              <div className="w-24 h-24 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/40">
                <Building2 size={48} className="text-deep-purple" />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-deep-purple -ml-1">
            Bulk Products ({totalCount})
          </h2>
          <button type="button" onClick={() => setFilterOpen((open) => !open)} className="text-[10px] font-black text-primary uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-gray-100 cursor-pointer">{sortBy}</button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
            <p className="text-center text-sm text-gray-400">Loading products...</p>
          </div>
        ) : error ? (
          <p role="alert" className="text-center text-sm text-red-500 py-10">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">No bulk products match your search or filters.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load More Section */}
            {hasMore && (
              <div className="mt-8 flex flex-col items-center gap-2">
                <p className="text-xs text-gray-400 font-medium">
                  Showing {products.length} of {totalCount} products
                </p>
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full max-w-xs py-3.5 px-6 bg-white hover:bg-gray-50 text-deep-purple font-bold text-xs rounded-2xl border border-gray-200 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-primary" />
                      Loading more...
                    </>
                  ) : (
                    <>Load More Products ({totalCount - products.length} remaining)</>
                  )}
                </button>
              </div>
            )}

            {!hasMore && products.length > 0 && products.length >= PAGE_SIZE && (
              <p className="mt-8 text-center text-xs text-gray-400 font-medium">
                You've reached the end of the products ({products.length} total)
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SchoolProductsPage;
