import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, AlertTriangle, AlertCircle, Coins, Search, Plus,
  ChevronRight, ArrowUpDown, ChevronDown, Check, X, ShieldAlert,
  ArrowUpRight, RefreshCw, Edit3, Loader2
} from 'lucide-react';
import { listVendorProducts, updateVendorInventory } from '../../services/vendorApi';
import { getErrorMessage } from '../../utils/apiHelpers';
import { mapVendorProductForStock } from '../../utils/mappers/vendorProductMapper';

const VendorStock = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustStockVal, setAdjustStockVal] = useState('');
  const [adjustPriceVal, setAdjustPriceVal] = useState('');
  const [adjustSuccess, setAdjustSuccess] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listVendorProducts({ limit: 200 });
      setProducts((data || []).map(mapVendorProductForStock));
    } catch (err) {
      setProducts([]);
      setError(getErrorMessage(err, 'Unable to load inventory'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Set initial input states when drawer is opened
  const handleOpenAdjust = (prod) => {
    setSelectedProduct(prod);
    setAdjustStockVal(prod.stock.toString());
    setAdjustPriceVal(prod.price.toString());
    setAdjustSuccess(false);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSaving(true);
    setError('');
    try {
      await updateVendorInventory(selectedProduct.id, {
        stock: parseInt(adjustStockVal, 10) || 0,
      });
      await loadProducts();
      setAdjustSuccess(true);
      setTimeout(() => {
        setSelectedProduct(null);
        setAdjustSuccess(false);
      }, 1200);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update stock'));
    } finally {
      setSaving(false);
    }
  };

  // Metrics Calculations (Dynamic in real-time)
  const totalInventory = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock > 0 && p.stock <= 5).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => p.stock === 0).length;
  }, [products]);

  const stockValuation = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  }, [products]);

  // Filter and Query Log
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search matching
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase());

      // Segment matching
      let matchesSegment = true;
      if (activeSegment === 'In Stock') {
        matchesSegment = product.stock > 0;
      } else if (activeSegment === 'Out of Stock') {
        matchesSegment = product.stock === 0;
      }

      return matchesSearch && matchesSegment;
    });
  }, [products, searchQuery, activeSegment]);

  return (
    <div className="space-y-6 pb-12 relative font-sans text-gray-900 selection:bg-purple-100">
      
      {/* 1. Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Stock Management</h1>
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
              Inventory Control
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-400 mt-1">Monitor stock levels, manage restocks, and track movements.</p>
        </div>
      </div>

      {/* 2. Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric Card 1: Total Inventory */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-700 shrink-0 border border-gray-100">
            <Package size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Inventory</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{totalInventory}</span>
          </div>
        </div>

        {/* Metric Card 2: Low Stock */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-100/50">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Low Stock Items</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{lowStockCount}</span>
          </div>
        </div>

        {/* Metric Card 3: Out of Stock */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shrink-0 border border-rose-100/50">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Out of Stock</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{outOfStockCount}</span>
          </div>
        </div>

        {/* Metric Card 4: Stock Valuation */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-[#5B3FD6] shrink-0 border border-purple-100/50">
            <Coins size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Stock Valuation</span>
            <span className="text-2xl font-black text-[#5B3FD6] tracking-tight block mt-0.5">
              ₹{stockValuation.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

      </div>

      {/* 3. Search & Segment Control row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          
          {/* Search field */}
          <div className="relative group w-full sm:w-[320px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name or SKU..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] placeholder-gray-400 font-medium shadow-sm"
            />
          </div>

          {/* Segments filters */}
          <div className="flex bg-gray-50 border border-gray-100 p-1 rounded-xl shrink-0">
            {['All', 'In Stock', 'Out of Stock'].map((seg) => {
              const isActive = activeSegment === seg;
              return (
                <button
                  key={seg}
                  onClick={() => setActiveSegment(seg)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {seg}
                </button>
              );
            })}
          </div>

        </div>

        {/* Quick add product button */}
        <button 
          onClick={() => navigate('/vendor/products', { state: { openAddPage: true } })}
          className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-[#5B3FD6] hover:bg-[#492eb3] text-white text-xs font-black transition-all shrink-0 shadow-lg shadow-purple-200/50 cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} /> Add New Product
        </button>

      </div>

      {/* 4. Inventory Catalog Table (Aligned with brand quotations theme) */}
      <div className="bg-white border border-gray-100 rounded-[1.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                <th className="px-6 py-4">Product Information</th>
                <th className="px-6 py-4">Inventory Capacity</th>
                <th className="px-6 py-4">Stock Health</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod) => {
                  
                  // Dynamically determine stock health status
                  let healthText = "IN STOCK";
                  let healthStyle = "bg-emerald-50 text-emerald-600 border-emerald-100";
                  let bulletStyle = "bg-emerald-500";

                  if (prod.stock === 0) {
                    healthText = "OUT OF STOCK";
                    healthStyle = "bg-rose-50 text-rose-600 border-rose-100";
                    bulletStyle = "bg-rose-500";
                  } else if (prod.stock <= 5) {
                    healthText = "LOW STOCK";
                    healthStyle = "bg-amber-50 text-amber-600 border-amber-100";
                    bulletStyle = "bg-amber-500";
                  }

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* Product details info card */}
                      <td className="px-6 py-4.5 max-w-[500px]">
                        <div className="flex items-start gap-3.5">
                          <div className={`w-9 h-9 rounded-lg ${prod.imgBg} flex items-center justify-center font-black text-sm shrink-0 border border-gray-100 shadow-sm mt-0.5`}>
                            {prod.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-900 tracking-tight leading-tight hover:text-[#5B3FD6] transition-colors">
                              {prod.name}
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 mt-1.5 uppercase tracking-wide">
                              Product Code: {prod.code}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Capacity stock unit count */}
                      <td className="px-6 py-4.5 text-gray-900 font-extrabold text-xs">
                        {prod.stock} units
                      </td>

                      {/* Health badge */}
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${healthStyle}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${bulletStyle}`}></span>
                          {healthText}
                        </span>
                      </td>

                      {/* Dynamic price */}
                      <td className="px-6 py-4.5 text-gray-900 font-black text-sm">
                        ₹{prod.price}
                      </td>

                      {/* Actions adjust stock */}
                      <td className="px-6 py-4.5 text-center">
                        <button
                          onClick={() => handleOpenAdjust(prod)}
                          className="px-3.5 py-1.5 rounded-xl border border-purple-100 hover:border-transparent bg-gray-50 hover:bg-[#5B3FD6]/10 text-gray-600 hover:text-[#5B3FD6] text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit3 size={11} /> Adjust Stock
                        </button>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold bg-white">
                    No matching stock items in catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Pagination Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          Showing 1 to {filteredProducts.length} of {products.length} entries
        </span>
        <div className="flex items-center gap-1">
          <button className="px-3 py-1.5 rounded-xl border border-gray-100 text-xs font-bold text-gray-400 hover:bg-gray-50 transition-all cursor-not-allowed">
            Previous
          </button>
          <button className="w-8 h-8 rounded-xl bg-[#5B3FD6] text-white text-xs font-bold flex items-center justify-center shadow-md shadow-purple-200">
            1
          </button>
          <button className="px-3 py-1.5 rounded-xl border border-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
            Next
          </button>
        </div>
      </div>

      {/* 6. STOCK ADJUSTMENT SLIDE-OVER DRAWER */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end transition-all animate-fade-in">
          <div className="w-full max-w-[450px] bg-white h-full shadow-2xl flex flex-col animate-slide-in relative">
            
            {/* Header info */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black text-[#5B3FD6] uppercase tracking-wider block">Inventory Control</span>
                <h3 className="font-extrabold text-base text-gray-900 mt-1">Adjust Price & Stock</h3>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors border border-gray-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Main scrollable layout */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Product Profile preview */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3.5 items-start">
                <div className={`w-10 h-10 rounded-xl ${selectedProduct.imgBg} flex items-center justify-center font-black text-base shrink-0 shadow-sm mt-0.5`}>
                  {selectedProduct.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-gray-900 leading-tight">{selectedProduct.name}</h4>
                  <p className="text-[9px] font-bold text-gray-400 mt-1.5 uppercase">SKU: {selectedProduct.code}</p>
                </div>
              </div>

              {adjustSuccess ? (
                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3.5 animate-scale-in">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-emerald-800 uppercase tracking-wider">Adjustment Saved!</h4>
                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Stock capacity and prices updated dynamically.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveAdjustment} className="space-y-4">
                  
                  {/* Stock Quantity Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Inventory Quantity</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={adjustStockVal}
                      onChange={(e) => setAdjustStockVal(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] font-semibold"
                    />
                  </div>

                  {/* Unit Price Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Unit Price (₹)</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={adjustPriceVal}
                      onChange={(e) => setAdjustPriceVal(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] font-semibold"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#5B3FD6] hover:bg-[#492eb3] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-100 mt-2 cursor-pointer"
                  >
                    Apply Adjustment
                  </button>

                </form>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default VendorStock;
