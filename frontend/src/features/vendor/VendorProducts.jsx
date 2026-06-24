import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Package, CheckCircle, AlertTriangle, AlertCircle, Search, SlidersHorizontal,
  ChevronRight, Plus, HelpCircle, ArrowUpDown, ChevronDown, Check, X,
  Tag, Layers, ShieldCheck, ShoppingCart, ListCollapse, ArrowLeft,
  Bold, Italic, List, AlignLeft, Folder, Image, FileText, CheckCircle2,
  UploadCloud, Loader2
} from 'lucide-react';
import { deleteVendorProduct, listVendorProducts, setVendorProductPublishStatus } from '../../services/vendorApi';
import { getErrorMessage } from '../../utils/apiHelpers';
import { mapVendorProductForList } from '../../utils/mappers/vendorProductMapper';

const VendorProducts = () => {
  const location = useLocation();

  const [showAddPage, setShowAddPage] = useState(() => location.state?.openAddPage || false);
  const [activeFormTab, setActiveFormTab] = useState('General Info');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedApproval, setSelectedApproval] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states for creating a new product
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newHeader, setNewHeader] = useState('');
  const [newCategory, setNewCategory] = useState('Apparel');
  const [newSubcategory, setNewSubcategory] = useState('Boys Uniform');
  const [newVariant, setNewVariant] = useState('');
  const [newStock, setNewStock] = useState('35');
  const [newPrice, setNewPrice] = useState('499');
  const [newStatus, setNewStatus] = useState('PUBLISHED');
  const [newAdded, setNewAdded] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listVendorProducts({ limit: 200 });
      setProducts((data || []).map(mapVendorProductForList));
    } catch (err) {
      setProducts([]);
      setError(getErrorMessage(err, 'Unable to load products'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handlePublish = (e) => {
    e.preventDefault();
    setError('Product creation requires catalog category IDs and uploaded images. Use the admin catalog flow or contact support.');
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteVendorProduct(productId);
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete product'));
    }
  };

  const handleTogglePublish = async (product) => {
    try {
      const nextStatus = product.publishStatus === 'published' ? 'draft' : 'published';
      await setVendorProductPublishStatus(product.id, nextStatus);
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update publish status'));
    }
  };

  // Metrics calculators
  const totalItemsCount = useMemo(() => products.length, [products]);
  const activeItemsCount = useMemo(() => products.filter(p => p.approval === 'Approved').length, [products]);
  const lowStockCount = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= 5).length, [products]);
  const outOfStockCount = useMemo(() => products.filter(p => p.stock === 0).length, [products]);

  // Filtered array logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.header.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesApproval = selectedApproval === 'All' || product.approval === selectedApproval;

      return matchesSearch && matchesCategory && matchesApproval;
    });
  }, [products, searchQuery, selectedCategory, selectedApproval]);

  return (
    <div className="space-y-6 pb-12 relative font-sans text-gray-900 selection:bg-purple-100">
      
      {!showAddPage ? (
        // ------------------ MAIN PRODUCTS LIST VIEW ------------------
        <>
          {/* Header Block */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Product List</h1>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-400 mt-1">Track your items, prices, and how many are left in stock.</p>
            </div>
            
            <button 
              onClick={() => setShowAddPage(true)}
              className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-black transition-all shrink-0 shadow-lg shadow-gray-900/10 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} /> Add New Product
            </button>
          </div>

          {/* Top Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: All Items */}
            <div className="bg-white border-2 border-gray-950 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-800 shrink-0 border border-gray-100">
                <Package size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">All Items</span>
                <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{totalItemsCount}</span>
              </div>
            </div>

            {/* Card 2: Active Items */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100/50">
                <CheckCircle size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Active Items</span>
                <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{activeItemsCount}</span>
              </div>
            </div>

            {/* Card 3: Low Stock */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-100/50">
                <AlertTriangle size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Low Stock</span>
                <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{lowStockCount}</span>
              </div>
            </div>

            {/* Card 4: Out of Stock */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shrink-0 border border-rose-100/50">
                <AlertCircle size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Out of Stock</span>
                <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{outOfStockCount}</span>
              </div>
            </div>

          </div>

          {/* Search & Filter Parameters row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
            
            {/* Search Field */}
            <div className="relative group w-full lg:w-[450px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU or slug..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] placeholder-gray-400 font-medium shadow-sm"
              />
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              
              {/* Categories Selector */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none pl-4 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] shadow-sm cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Accessories">Accessories</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Approvals Selector */}
              <div className="relative">
                <select
                  value={selectedApproval}
                  onChange={(e) => setSelectedApproval(e.target.value)}
                  className="appearance-none pl-4 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] shadow-sm cursor-pointer"
                >
                  <option value="All">All Approvals</option>
                  <option value="Approved">Approved Only</option>
                  <option value="Pending">Pending Only</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-purple-200 hover:border-[#5B3FD6]/30 bg-white text-[#5B3FD6] text-xs font-bold transition-all shadow-sm">
                <SlidersHorizontal size={14} /> Filters
              </button>

              <div className="relative">
                <select
                  className="appearance-none pl-4 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] shadow-sm cursor-pointer"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="alphabetical">A - Z</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

            </div>

          </div>

          {/* Products Table */}
          <div className="bg-white border border-gray-100 rounded-[1.5rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Product Code</th>
                    <th className="px-6 py-4">Header</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Subcategory</th>
                    <th className="px-6 py-4">Variant</th>
                    <th className="px-6 py-4">Approval</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        
                        {/* PRODUCT */}
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${product.imgBg} flex items-center justify-center font-black text-sm shrink-0 border border-gray-100 shadow-sm`}>
                              {product.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-gray-900 tracking-tight leading-tight">{product.name}</p>
                              <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Stock left: {product.stock} units</p>
                            </div>
                          </div>
                        </td>

                        {/* PRODUCT CODE */}
                        <td className="px-6 py-4.5">
                          <span className="font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded-md text-[11px] font-bold border border-gray-100">
                            {product.code}
                          </span>
                        </td>

                        {/* HEADER */}
                        <td className="px-6 py-4.5 text-gray-800">{product.header}</td>

                        {/* CATEGORY */}
                        <td className="px-6 py-4.5">
                          <span className="text-[10px] bg-purple-50 text-[#5B3FD6] border border-purple-100 px-2 py-0.5 rounded-md font-bold">
                            {product.category}
                          </span>
                        </td>

                        {/* SUBCATEGORY */}
                        <td className="px-6 py-4.5 text-gray-500 font-semibold">{product.subcategory}</td>

                        {/* VARIANT */}
                        <td className="px-6 py-4.5 text-gray-400 font-semibold">{product.variant}</td>

                        {/* APPROVAL */}
                        <td className="px-6 py-4.5">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            product.approval === 'Approved' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              product.approval === 'Approved' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}></span>
                            {product.approval}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-6 py-4.5 text-center">
                          <button 
                            onClick={() => setSelectedProduct(product)}
                            className="px-3 py-1.5 rounded-xl border border-purple-100 hover:border-transparent bg-gray-50 hover:bg-[#5B3FD6]/10 text-gray-600 hover:text-[#5B3FD6] text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            View Info
                          </button>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-bold bg-white">
                        No products cataloged matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer */}
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

          {/* PRODUCT INFO DRAWER */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end transition-all animate-fade-in">
              <div className="w-full max-w-[450px] bg-white h-full shadow-2xl flex flex-col animate-slide-in relative">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <div>
                    <span className="text-[10px] font-black text-[#5B3FD6] uppercase tracking-wider block">Product Overview</span>
                    <h3 className="font-extrabold text-base text-gray-900 mt-1">
                      Code: {selectedProduct.code}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors border border-gray-100 cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3.5 items-center">
                    <div className={`w-12 h-12 rounded-xl ${selectedProduct.imgBg} flex items-center justify-center font-black text-xl shrink-0`}>
                      {selectedProduct.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 leading-tight">{selectedProduct.name}</h4>
                      <span className="inline-flex items-center gap-1.5 mt-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Price: ₹{selectedProduct.price}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-sans">Details</span>
                    <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-white shadow-sm text-xs font-semibold">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Header Group</span>
                        <span className="text-gray-800">{selectedProduct.header}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Category</span>
                        <span className="text-[#5B3FD6] font-bold">{selectedProduct.category}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Subcategory</span>
                        <span className="text-gray-800">{selectedProduct.subcategory}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Variant specifications</span>
                        <span className="text-gray-800">{selectedProduct.variant}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Available Stock</span>
                        <span className="text-gray-800">{selectedProduct.stock} units</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Moderation Review</span>
                        <span className="text-emerald-600 font-bold">{selectedProduct.approval}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        // ------------------ ADD PRODUCT PAGE VIEW ------------------
        <div className="space-y-6 pt-2 select-none">
          
          {/* Top Bar Header */}
          <div className="flex items-center justify-between gap-4 pb-2">
            <button 
              onClick={() => setShowAddPage(false)}
              className="flex items-center gap-2 text-sm font-extrabold text-gray-900 bg-transparent hover:opacity-75 transition-opacity cursor-pointer"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              <span>Back to Products</span>
            </button>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowAddPage(false)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-extrabold text-xs rounded-xl hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handlePublish}
                className="px-5 py-2.5 bg-[#0E0E2C] hover:bg-[#1a1a45] text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-gray-900/10 cursor-pointer"
              >
                Save & Publish
              </button>
            </div>
          </div>

          {/* Form Content layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            
            {/* Left Control Panel Column */}
            <div className="md:col-span-1 space-y-4">
              
              {/* Tab Navigation pills card */}
              <div className="bg-white/40 border border-gray-100 rounded-3xl p-1.5 space-y-1">
                {[
                  { name: 'General Info', icon: FileText },
                  { name: 'Item Variants', icon: Tag },
                  { name: 'Groups', icon: Folder },
                  { name: 'Photos', icon: Image },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeFormTab === tab.name;
                  return (
                    <button
                      key={tab.name}
                      onClick={() => setActiveFormTab(tab.name)}
                      className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                        isActive 
                          ? 'bg-white text-gray-900 border border-gray-100/50 shadow-sm shadow-gray-200/50' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-white/20'
                      }`}
                    >
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-gray-900' : 'text-gray-400'} />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Status Select card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4.5 space-y-2.5 shadow-sm">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Status</span>
                <div className="relative">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full appearance-none pl-4 pr-9 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-[#5B3FD6] cursor-pointer"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Right Main Panel Form Column */}
            <div className="md:col-span-3">
              <div className="bg-white border border-gray-100 rounded-[1.8rem] p-6.5 shadow-sm min-h-[450px]">
                
                {activeFormTab === 'General Info' && (
                  <div className="space-y-6">
                    
                    {/* Title */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Product Title</label>
                      <input 
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Premium Basmati Rice"
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 focus:bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-[#5B3FD6] font-semibold text-gray-800 placeholder-gray-400 transition-all"
                      />
                    </div>

                    {/* About item mock rich text editor */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">About This Item</label>
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        
                        {/* Mock Toolbar */}
                        <div className="flex items-center gap-4.5 px-4 py-2.5 border-b border-gray-100 bg-gray-50/40 text-gray-400 font-extrabold text-sm select-none">
                          <button type="button" className="hover:text-gray-900 transition-colors font-serif font-black">B</button>
                          <button type="button" className="hover:text-gray-900 transition-colors italic font-serif">I</button>
                          <button type="button" className="hover:text-gray-900 transition-colors flex items-center justify-center font-black">•</button>
                          <button type="button" className="hover:text-gray-900 transition-colors font-black text-[11px] leading-none">1.</button>
                          <span className="w-[1px] h-4 bg-gray-200 my-0.5"></span>
                          <button type="button" className="hover:text-gray-900 transition-colors font-mono text-xs font-black">Tx</button>
                        </div>

                        {/* Editor text area */}
                        <textarea
                          rows={8}
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          placeholder="Describe your item details, dimensions, and materials..."
                          className="w-full p-4.5 focus:outline-none placeholder-gray-400 text-xs font-semibold text-gray-700 bg-white resize-none"
                        />
                      </div>
                    </div>

                    {/* Dual Column: Brand and Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Brand name */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Brand Name</label>
                        <input 
                          type="text"
                          value={newBrand}
                          onChange={(e) => setNewBrand(e.target.value)}
                          placeholder="e.g. Amul"
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 focus:bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-[#5B3FD6] font-semibold text-gray-800 placeholder-gray-400 transition-all"
                        />
                      </div>

                      {/* Product Code SKU */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Product Code</label>
                        <input 
                          type="text"
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          placeholder="AUTO-GENERATED"
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 focus:bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-[#5B3FD6] font-semibold text-gray-800 placeholder-gray-400 transition-all"
                        />
                      </div>

                    </div>

                  </div>
                )}

                {activeFormTab === 'Item Variants' && (
                  <div className="space-y-6">
                    <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-50 pb-2">Item Specifications & Variants</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Variant Input */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Variant Details (Size, Pack, Color)</label>
                        <input 
                          type="text"
                          value={newVariant}
                          onChange={(e) => setNewVariant(e.target.value)}
                          placeholder="e.g. Size 28, Pack of 2"
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2"
                        />
                      </div>

                      {/* Price Input */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Unit Price (₹)</label>
                        <input 
                          type="number"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          placeholder="499"
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2"
                        />
                      </div>

                      {/* Stock Quantity */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Opening Inventory Stock</label>
                        <input 
                          type="number"
                          value={newStock}
                          onChange={(e) => setNewStock(e.target.value)}
                          placeholder="35"
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2"
                        />
                      </div>

                    </div>

                  </div>
                )}

                {activeFormTab === 'Groups' && (
                  <div className="space-y-6">
                    <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-50 pb-2">Category & Catalog Groups</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Header Group */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Header Group</label>
                        <input 
                          type="text"
                          value={newHeader}
                          onChange={(e) => setNewHeader(e.target.value)}
                          placeholder="e.g. White Shirts"
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2"
                        />
                      </div>

                      {/* Category select */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Category</label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
                        >
                          <option value="Apparel">Apparel</option>
                          <option value="Footwear">Footwear</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>

                      {/* Subcategory select */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Subcategory</label>
                        <select
                          value={newSubcategory}
                          onChange={(e) => setNewSubcategory(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
                        >
                          <option value="Boys Uniform">Boys Uniform</option>
                          <option value="Girls Uniform">Girls Uniform</option>
                          <option value="Uniform Shoes">Uniform Shoes</option>
                          <option value="Bags">Bags</option>
                          <option value="Sports Wear">Sports Wear</option>
                          <option value="Winter Wear">Winter Wear</option>
                        </select>
                      </div>

                    </div>

                  </div>
                )}

                {activeFormTab === 'Photos' && (
                  <div className="space-y-6">
                    <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-50 pb-2">Product Images</h3>
                    
                    {/* Mock Dropzone */}
                    <div className="border-2 border-dashed border-purple-200 hover:border-[#5B3FD6]/30 bg-purple-50/10 rounded-2xl p-12 text-center transition-all cursor-pointer">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#5B3FD6] flex items-center justify-center border border-purple-100">
                          <UploadCloud size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900">Drag & Drop images or browse</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">PNG, JPG formats supported up to 5MB.</p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUCCESS MODAL OVERLAY */}
      {newAdded && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center transition-all animate-fade-in">
          <div className="bg-white border border-gray-100 max-w-[400px] w-full p-8 rounded-[2rem] shadow-2xl text-center space-y-4 animate-scale-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 size={32} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-950">Product Published!</h3>
              <p className="text-xs font-bold text-gray-400 mt-1.5 leading-relaxed">
                Your new catalog item was created successfully and is now live for school review.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorProducts;
