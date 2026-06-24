import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Search, Edit, Trash2, X, ChevronRight, Upload, 
  Package, CheckCircle, AlertCircle, ShoppingBag, Check, Filter,
  FileText, Tag, Folder, Image, ChevronDown, UploadCloud, Loader2
} from 'lucide-react';
import { listProducts, setProductApprovalStatus } from '../../../services/catalogApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapProductForAdminList } from '../../../utils/mappers/vendorProductMapper';

const ProductListManagement = () => {
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Approved' | 'Pending Approval' | 'Rejected'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Newest first');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('General Info');

  // Full Vendor-parity product fields state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editPrice, setEditPrice] = useState('499');
  const [editStock, setEditStock] = useState('35');
  const [editVariant, setEditVariant] = useState('');
  const [editHeaderGroup, setEditHeaderGroup] = useState('');
  const [editCategory, setEditCategory] = useState('Accessories');
  const [editSubcategory, setEditSubcategory] = useState('Backpacks');
  const [editVendor, setEditVendor] = useState('');
  const [editApprovalStatus, setEditApprovalStatus] = useState('Approved');
  const [editImage, setEditImage] = useState('');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listProducts({ limit: 100 })
      .then(({ data }) => {
        if (!cancelled) {
          setProducts((data || []).map(mapProductForAdminList));
          setError('');
        }
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
  }, []);

  const handleApprove = async (product) => {
    if (!product?.mongoId) return;
    try {
      await setProductApprovalStatus(product.mongoId, 'approved');
      setProducts((prev) =>
        prev.map((p) =>
          p.mongoId === product.mongoId ? { ...p, approvalStatus: 'Approved', approvalRaw: 'approved' } : p
        )
      );
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to approve product'));
    }
  };

  const handleReject = async (product) => {
    if (!product?.mongoId) return;
    try {
      await setProductApprovalStatus(product.mongoId, 'rejected');
      setProducts((prev) =>
        prev.map((p) =>
          p.mongoId === product.mongoId ? { ...p, approvalStatus: 'Rejected', approvalRaw: 'rejected' } : p
        )
      );
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to reject product'));
    }
  };

  // Safe product deletion handler
  const handleDeleteProduct = (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // Open Edit Modal pre-populating parameters
  const openEditModal = (p) => {
    setEditingProductId(p.id);
    setEditName(p.name);
    setEditDescription(p.description || '');
    setEditBrand(p.brand || '');
    setEditSku(p.sku);
    setEditPrice(String(p.price || '499'));
    setEditStock(String(p.stock || '35'));
    setEditVariant(p.variant || '');
    setEditHeaderGroup(p.headerGroup || '');
    setEditCategory(p.category);
    setEditSubcategory(p.subcategory);
    setEditVendor(p.vendor || '');
    setEditApprovalStatus(p.approvalStatus);
    setEditImage(p.image);
    setActiveFormTab('General Info');
    setIsEditModalOpen(true);
  };

  // Update Product attributes
  const handleUpdateProduct = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editingProductId) return;

    const numericStock = parseInt(editStock) || 0;
    let computedStockStatus = 'In Stock';
    if (numericStock === 0) computedStockStatus = 'Out of Stock';
    else if (numericStock <= 5) computedStockStatus = 'Low Stock';

    setProducts(prev => prev.map(p => {
      if (p.id === editingProductId) {
        return {
          ...p,
          name: editName,
          description: editDescription,
          brand: editBrand,
          sku: editSku,
          price: editPrice,
          stock: numericStock,
          variant: editVariant,
          headerGroup: editHeaderGroup,
          category: editCategory,
          subcategory: editSubcategory,
          stockStatus: computedStockStatus,
          approvalStatus: editApprovalStatus,
          image: editImage,
          vendor: editVendor
        };
      }
      return p;
    }));

    setIsEditModalOpen(false);
  };

  // Filter products dynamically
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === 'Approved') matchesTab = p.approvalStatus === 'Approved';
    if (activeTab === 'Pending Approval') matchesTab = p.approvalStatus === 'Pending';
    if (activeTab === 'Rejected') matchesTab = p.approvalStatus === 'Rejected';

    let matchesCategory = true;
    if (selectedCategory !== 'All') matchesCategory = p.category === selectedCategory;

    return matchesSearch && matchesTab && matchesCategory;
  });

  // Calculate dynamic stats metrics
  const totalCount = products.length;
  const activeCount = products.filter(p => p.approvalStatus === 'Approved').length;
  const lowStockCount = products.filter(p => p.stockStatus === 'Low Stock').length;
  const outOfStockCount = products.filter(p => p.stockStatus === 'Out of Stock').length;

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Product List</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none animate-pulse">
              LIVE
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Track your items, prices, and how many are left in stock.</p>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        
        {/* Card 1: All Items */}
        <div className="bg-white border border-gray-200/70 p-5 rounded-2xl flex items-center gap-4 hover:shadow-sm transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 text-gray-700">
            <Package size={22} className="stroke-[2]" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">All Items</span>
            <span className="text-2xl font-black text-gray-900 leading-tight mt-0.5 block">{totalCount}</span>
          </div>
        </div>

        {/* Card 2: Active Items */}
        <div className="bg-white border border-gray-200/70 p-5 rounded-2xl flex items-center gap-4 hover:shadow-sm transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-indigo-50/50 flex items-center justify-center border border-indigo-100/50 shrink-0 text-indigo-600">
            <CheckCircle size={22} className="stroke-[2]" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Items</span>
            <span className="text-2xl font-black text-gray-900 leading-tight mt-0.5 block">{activeCount}</span>
          </div>
        </div>

        {/* Card 3: Low Stock */}
        <div className="bg-white border border-gray-200/70 p-5 rounded-2xl flex items-center gap-4 hover:shadow-sm transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-amber-50/50 flex items-center justify-center border border-amber-100/50 shrink-0 text-amber-600">
            <AlertCircle size={22} className="stroke-[2]" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Low Stock</span>
            <span className="text-2xl font-black text-gray-900 leading-tight mt-0.5 block">{lowStockCount}</span>
          </div>
        </div>

        {/* Card 4: Out of Stock */}
        <div className="bg-white border border-gray-200/70 p-5 rounded-2xl flex items-center gap-4 hover:shadow-sm transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-rose-50/50 flex items-center justify-center border border-rose-100/50 shrink-0 text-rose-600">
            <Package size={22} className="stroke-[2] text-rose-500" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Out of Stock</span>
            <span className="text-2xl font-black text-gray-900 leading-tight mt-0.5 block">{outOfStockCount}</span>
          </div>
        </div>

      </div>

      {/* 3. TABS FILTER ROW */}
      <div className="bg-white rounded-2xl border border-gray-200/75 p-3 flex flex-wrap gap-2 select-none shadow-sm">
        {['All', 'Approved', 'Pending Approval', 'Rejected'].map(tab => {
          let count = totalCount;
          if (tab === 'Approved') count = activeCount;
          if (tab === 'Pending Approval') count = products.filter(p => p.approvalStatus === 'Pending').length;
          if (tab === 'Rejected') count = products.filter(p => p.approvalStatus === 'Rejected').length;

          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                isActive 
                  ? 'bg-[#0B1528] text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200/60'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* 4. ACTIONS & SELECT FILTERS ROW */}
      <div className="bg-white rounded-2xl border border-gray-200/75 p-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none shadow-sm">
        
        {/* Search by name, SKU or slug */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, SKU or slug..." 
            className="w-full bg-[#F8F9FB]/60 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-gray-400"
          />
        </div>

        {/* Filter controls right side */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Category Dropdown */}
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Accessories">Accessories</option>
            <option value="Fashion">Fashion</option>
            <option value="School Uniforms">School Uniforms</option>
            <option value="Stationery">Stationery</option>
          </select>

          {/* Show All filter */}
          <button className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-extrabold text-gray-700 flex items-center gap-1.5 transition-all">
            <Filter size={13} className="stroke-[2.5]" />
            <span>SHOW ALL</span>
          </button>

          {/* Sorting */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option>Newest first</option>
            <option>Oldest first</option>
            <option>Stock: Low to High</option>
          </select>
        </div>

      </div>

      {/* 5. DATATABLE MAIN PANEL */}
      <div className="bg-white rounded-[1.25rem] border border-gray-250/60 shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto border border-gray-200/80 rounded-2xl shadow-inner bg-[#FCFDFE]">
          <table className="w-full text-left text-xs font-semibold text-gray-600 border-collapse select-none">
            <thead>
              <tr className="border-b border-gray-250 bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                <th className="py-4 px-5">Product</th>
                <th className="py-4 px-5">Vendor</th>
                <th className="py-4 px-5">Variant</th>
                <th className="py-4 px-5">Category</th>
                <th className="py-4 px-5">Subcategory</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-xs font-black text-gray-400">
                    No matching product records found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    {/* PRODUCT COLUMN */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-150 bg-gray-50 shrink-0">
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=80&auto=format&fit=crop&q=60' }}
                          />
                        </div>
                        <div className="text-left leading-tight max-w-[200px]">
                          <span className="font-extrabold text-[#0B1528] text-xs hover:text-indigo-600 cursor-pointer transition-colors block truncate" title={p.name}>
                            {p.name}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold block mt-1">SKU: {p.sku}</span>
                        </div>
                      </div>
                    </td>

                    {/* VENDOR COLUMN */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-200/50 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        </div>
                        <span className="font-black text-gray-700 text-xs">{p.vendor}</span>
                      </div>
                    </td>

                    {/* VARIANT COLUMN */}
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-wider border border-indigo-100/50">
                        {p.variant}
                      </span>
                    </td>

                    {/* CATEGORY COLUMN */}
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-[9px] font-bold">
                        {p.category}
                      </span>
                    </td>

                    {/* SUBCATEGORY COLUMN */}
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-[9px] font-bold">
                        {p.subcategory}
                      </span>
                    </td>

                    {/* STATUS COLUMN */}
                    <td className="py-4 px-5">
                      <div className="flex flex-col gap-1.5 items-start">
                        {/* Stock Status Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-wider ${
                          p.stockStatus === 'Low Stock'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : p.stockStatus === 'Out of Stock'
                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {p.stockStatus}
                        </span>

                        {/* Approval Status Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-wider ${
                          p.approvalStatus === 'Approved'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            : p.approvalStatus === 'Pending'
                            ? 'bg-gray-50 text-gray-500 border-gray-200'
                            : p.approvalStatus === 'Rejected'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {p.approvalStatus}
                        </span>
                      </div>
                    </td>

                    {/* ACTIONS COLUMN */}
                    <td className="py-4 px-5 text-right pr-6">
                      <div className="flex items-center gap-1.5 ml-auto justify-end">
                        {/* Approve button */}
                        <button 
                          onClick={() => handleApprove(p)}
                          title="Approve Product Listing"
                          className="w-7 h-7 rounded-xl border border-gray-250/60 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center transition-all shrink-0"
                        >
                          <Check size={12} className="stroke-[3]" />
                        </button>

                        {/* Reject button */}
                        <button 
                          onClick={() => handleReject(p)}
                          title="Reject / Flag Product"
                          className="w-7 h-7 rounded-xl border border-gray-250/60 text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all shrink-0"
                        >
                          <X size={12} className="stroke-[3]" />
                        </button>

                        {/* Edit Button */}
                        <button 
                          onClick={() => openEditModal(p)}
                          title="Edit Product Details"
                          className="w-7 h-7 rounded-xl border border-gray-250/60 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center transition-all shrink-0"
                        >
                          <Edit size={12} className="stroke-[2.5]" />
                        </button>

                        {/* Delete Button */}
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          title="Delete Product Listing"
                          className="w-7 h-7 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-all shrink-0"
                        >
                          <Trash2 size={12} className="stroke-[2.5]" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. VENDOR-PARITY EDIT PRODUCT MODAL PORTAL */}
      {isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-4xl overflow-hidden animate-slide-up flex flex-col h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white px-6 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#0B1528]">Edit Product Listing</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Admin catalog override console</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all border border-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Multi-tab Grid Body */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-4 min-h-0">
              
              {/* Left Control Panel / Tab pills */}
              <div className="md:col-span-1 border-r border-gray-150 p-5 bg-gray-50/50 flex flex-col gap-4">
                <div className="space-y-1">
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
                        type="button"
                        onClick={() => setActiveFormTab(tab.name)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                          isActive 
                            ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' 
                            : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'
                        }`}
                      >
                        <Icon size={15} className={isActive ? 'text-[#0B1528]' : 'text-gray-400'} />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Status select for approvals */}
                <div className="border-t border-gray-200/80 pt-4 mt-auto space-y-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Approval Status</span>
                  <div className="relative">
                    <select
                      value={editApprovalStatus}
                      onChange={(e) => setEditApprovalStatus(e.target.value)}
                      className="w-full appearance-none pl-3.5 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* Right Panel Main Form Container */}
              <div className="md:col-span-3 overflow-y-auto p-6 text-left">
                
                {activeFormTab === 'General Info' && (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Product Title</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. SONY WH-CH520 Wireless..." 
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">About This Item</label>
                      <textarea 
                        rows={6}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Detailed dimensions, specifications, accessories description..." 
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Brand Name</label>
                        <input 
                          type="text" 
                          value={editBrand}
                          onChange={(e) => setEditBrand(e.target.value)}
                          placeholder="e.g. Sony" 
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Product Code / SKU</label>
                        <input 
                          type="text" 
                          value={editSku}
                          onChange={(e) => setEditSku(e.target.value)}
                          placeholder="e.g. SONY-WH520" 
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'Item Variants' && (
                  <div className="space-y-5">
                    <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">Pricing & Variants</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Variant Details</label>
                        <input 
                          type="text" 
                          value={editVariant}
                          onChange={(e) => setEditVariant(e.target.value)}
                          placeholder="e.g. 1 Variant, Pack of 2" 
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Unit Price (₹)</label>
                        <input 
                          type="number" 
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="e.g. 4499" 
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 max-w-xs">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Opening Inventory Stock</label>
                      <input 
                        type="number" 
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        placeholder="e.g. 35" 
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2"
                      />
                    </div>
                  </div>
                )}

                {activeFormTab === 'Groups' && (
                  <div className="space-y-5">
                    <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">Category Associations</h4>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Header Group</label>
                      <input 
                        type="text" 
                        value={editHeaderGroup}
                        onChange={(e) => setEditHeaderGroup(e.target.value)}
                        placeholder="e.g. Accessories" 
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Category</label>
                        <input 
                          type="text" 
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Subcategory</label>
                        <input 
                          type="text" 
                          value={editSubcategory}
                          onChange={(e) => setEditSubcategory(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Vendor Hub</label>
                      <input 
                        type="text" 
                        value={editVendor}
                        onChange={(e) => setEditVendor(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2"
                      />
                    </div>
                  </div>
                )}

                {activeFormTab === 'Photos' && (
                  <div className="space-y-5">
                    <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">Product Images</h4>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Product Image URL</label>
                      <input 
                        type="text" 
                        value={editImage}
                        onChange={(e) => setEditImage(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..." 
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div className="border-2 border-dashed border-indigo-150 hover:border-indigo-300 bg-indigo-50/10 rounded-2xl p-10 text-center transition-all cursor-pointer">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <UploadCloud size={28} className="text-indigo-500" />
                        <div>
                          <p className="text-xs font-black text-gray-950">Drag & Drop replacement photos or browse</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">PNG, JPG formats supported up to 5MB.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Footer buttons bar */}
            <div className="p-5 border-t border-gray-150 flex items-center justify-end gap-2.5 bg-white px-6 shrink-0">
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs px-5 py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleUpdateProduct}
                className="bg-[#0B1528] hover:bg-gray-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-950/10"
              >
                Save & Update Product
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default ProductListManagement;
