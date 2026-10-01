import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Package, CheckCircle, AlertTriangle, AlertCircle, Search, SlidersHorizontal,
  ChevronRight, Plus, HelpCircle, ArrowUpDown, ChevronDown, Check, X,
  Tag, Layers, ShieldCheck, ShoppingCart, ListCollapse, ArrowLeft,
  Bold, Italic, List, AlignLeft, Folder, Image, FileText, CheckCircle2,
  UploadCloud, Loader2, Edit3, Trash2, Eye, Power, Camera
} from 'lucide-react';
import {
  deleteVendorProduct, listVendorProducts, setVendorProductPublishStatus,
  createVendorProduct, updateVendorProduct, uploadVendorDocument,
} from '../../services/vendorApi';
import { getCategoryTree } from '../../services/catalogApi';
import { getErrorMessage } from '../../utils/apiHelpers';
import { mapVendorProductForList, resolveImageUrl } from '../../utils/mappers/vendorProductMapper';

const MAX_PRODUCT_IMAGES = 6;

const VendorProducts = () => {
  const location = useLocation();

  const [showAddPage, setShowAddPage] = useState(() => location.state?.openAddPage || false);
  const [activeFormTab, setActiveFormTab] = useState('General Info');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedApproval, setSelectedApproval] = useState('All');
  const [selectedAudience, setSelectedAudience] = useState('All'); // 'All' | 'users' | 'schools'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states for creating a new product
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newVariant, setNewVariant] = useState('');
  const [newStock, setNewStock] = useState('35');
  const [newPrice, setNewPrice] = useState('499');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newStatus, setNewStatus] = useState('PUBLISHED');
  const [newAudience, setNewAudience] = useState('users'); // 'users' (retail) | 'schools' (bulk)
  const [newAdded, setNewAdded] = useState(false);

  // Real catalog taxonomy + image so the product actually persists.
  const [catTree, setCatTree] = useState([]); // [{ _id, name, categories: [{_id, name, subcategories}] }]
  const [newHeaderId, setNewHeaderId] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newSubcategoryId, setNewSubcategoryId] = useState('');
  const [newImages, setNewImages] = useState([]); // [{ attachmentId, url, name }]
  const [imageAttachmentId, setImageAttachmentId] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listVendorProducts({
        limit: 100,
        ...(selectedAudience !== 'All' ? { audience: selectedAudience } : {}),
      });
      setProducts((data || []).map(mapVendorProductForList));
    } catch (err) {
      setProducts([]);
      setError(getErrorMessage(err, 'Unable to load products'));
    } finally {
      setLoading(false);
    }
  }, [selectedAudience]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Load the catalog tree for the Header/Category selectors.
  useEffect(() => {
    getCategoryTree()
      .then((tree) => setCatTree(tree || []))
      .catch(() => setCatTree([]));
  }, []);

  const selectedHeader = useMemo(
    () => catTree.find((h) => h._id === newHeaderId) || null,
    [catTree, newHeaderId]
  );
  const selectedCategoryObj = useMemo(
    () => (selectedHeader?.categories || []).find((c) => c._id === newCategoryId) || null,
    [selectedHeader, newCategoryId]
  );

  const resetProductForm = () => {
    setNewName(''); setNewDescription(''); setNewBrand(''); setNewCode('');
    setNewVariant(''); setNewStock('35'); setNewPrice('499'); setNewOriginalPrice(''); setNewStatus('PUBLISHED');
    setNewAudience('users'); setNewHeaderId(''); setNewCategoryId(''); setNewSubcategoryId('');
    setImageAttachmentId(''); setImagePreview('');
    setNewImages([]);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (newImages.length + files.length > MAX_PRODUCT_IMAGES) {
      setError(`You can upload a maximum of ${MAX_PRODUCT_IMAGES} images (${newImages.length} already uploaded).`);
      if (e.target) e.target.value = '';
      return;
    }

    const oversized = files.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      setError('Each image must be under 5MB');
      if (e.target) e.target.value = '';
      return;
    }

    setError('');
    setUploadingImage(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const attachment = await uploadVendorDocument(formData);
        const id = attachment?._id || attachment?.id || '';
        if (id) {
          uploaded.push({
            attachmentId: id,
            url: URL.createObjectURL(file),
            name: file.name,
          });
        }
      }
      setNewImages((prev) => {
        const combined = [...prev, ...uploaded].slice(0, MAX_PRODUCT_IMAGES);
        if (combined.length > 0) {
          setImageAttachmentId(combined[0].attachmentId);
          setImagePreview(combined[0].url);
        }
        return combined;
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Image upload failed'));
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeNewImage = (indexToRemove) => {
    setNewImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length > 0) {
        setImageAttachmentId(updated[0].attachmentId);
        setImagePreview(updated[0].url);
      } else {
        setImageAttachmentId('');
        setImagePreview('');
      }
      return updated;
    });
  };

  const handlePublish = async (e) => {
    e?.preventDefault?.();
    setError('');
    if (!newName.trim()) { setActiveFormTab('General Info'); return setError('Product title is required'); }
    if (!newHeaderId) { setActiveFormTab('Groups'); return setError('Select a header group'); }
    if (!newCategoryId) { setActiveFormTab('Groups'); return setError('Select a category'); }
    const pricePaise = Math.round(Number(newPrice) * 100);
    if (!pricePaise || pricePaise < 0) { setActiveFormTab('Item Variants'); return setError('Enter a valid price'); }
    if (!newImages.length && !imageAttachmentId) { setActiveFormTab('Photos'); return setError('Upload at least one product image'); }

    setPublishing(true);
    try {
      const finalImages = newImages.length > 0
        ? newImages.map((img, idx) => ({
            attachmentId: img.attachmentId,
            alt: `${newName.trim()}${idx > 0 ? ` photo ${idx + 1}` : ''}`,
          }))
        : [{ attachmentId: imageAttachmentId }];

      await createVendorProduct({
        name: newName.trim(),
        sku: newCode.trim() || `SKU-${Date.now().toString(36).toUpperCase()}`,
        brand: newBrand.trim() || undefined,
        description: newDescription.trim() || undefined,
        headerId: newHeaderId,
        categoryId: newCategoryId,
        subcategoryId: newSubcategoryId || undefined,
        audience: newAudience,
        pricePaise,
        originalPricePaise: newOriginalPrice && Number(newOriginalPrice) > 0 ? Math.round(Number(newOriginalPrice) * 100) : undefined,
        stock: Number(newStock) || 0,
        images: finalImages,
        publishStatus: newStatus === 'PUBLISHED' ? 'published' : 'draft',
      });
      setNewAdded(true);
      resetProductForm();
      setTimeout(() => {
        setNewAdded(false);
        setShowAddPage(false);
        loadProducts();
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to create product'));
    } finally {
      setPublishing(false);
    }
  };

  // Edit Product Modal states
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editOriginalPrice, setEditOriginalPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editHeaderId, setEditHeaderId] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editSubcategoryId, setEditSubcategoryId] = useState('');
  const [editImages, setEditImages] = useState([]); // [{ attachmentId, url, alt }]
  const [editPublishStatus, setEditPublishStatus] = useState('published');
  const [editAudience, setEditAudience] = useState('users');
  const [updating, setUpdating] = useState(false);

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditName(product.name || '');
    setEditBrand(product.raw?.brand || '');
    setEditDescription(product.raw?.description || '');
    setEditPrice(product.price ? product.price.toString() : '');
    setEditOriginalPrice(product.originalPrice ? product.originalPrice.toString() : product.raw?.originalPricePaise ? (product.raw.originalPricePaise / 100).toString() : '');
    setEditStock(product.stock ? product.stock.toString() : '0');
    setEditPublishStatus(product.publishStatus || 'published');
    setEditAudience(product.audience || product.raw?.audience || 'users');
    setEditHeaderId(product.raw?.headerId?._id || product.raw?.headerId || '');
    setEditCategoryId(product.raw?.categoryId?._id || product.raw?.categoryId || '');
    setEditSubcategoryId(product.raw?.subcategoryId?._id || product.raw?.subcategoryId || '');

    const existingImages = (product.images || product.raw?.images || []).map((img, idx) => {
      const id = img?.attachmentId?._id?.toString?.() ||
                 (typeof img?.attachmentId === 'string' ? img.attachmentId : img?._id?.toString?.() || '');
      const url = img?.url || resolveImageUrl(img) || (idx === 0 ? product.imageUrl : '');
      return { attachmentId: id, url: url || product.imageUrl, alt: img?.alt || '' };
    }).filter((img) => img.attachmentId || img.url);

    setEditImages(existingImages.length ? existingImages : product.imageUrl ? [{ attachmentId: null, url: product.imageUrl }] : []);
  };

  const handleEditImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (editImages.length + files.length > MAX_PRODUCT_IMAGES) {
      setError(`You can upload a maximum of ${MAX_PRODUCT_IMAGES} images (${editImages.length} already added).`);
      if (e.target) e.target.value = '';
      return;
    }

    const oversized = files.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      setError('Each image must be under 5MB');
      if (e.target) e.target.value = '';
      return;
    }

    setError('');
    setUploadingImage(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const att = await uploadVendorDocument(formData);
        const id = att?._id || att?.id || '';
        if (id) {
          uploaded.push({
            attachmentId: id,
            url: URL.createObjectURL(file),
            name: file.name,
          });
        }
      }
      setEditImages((prev) => [...prev, ...uploaded].slice(0, MAX_PRODUCT_IMAGES));
    } catch (err) {
      setError(getErrorMessage(err, 'Image upload failed'));
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeEditImage = (indexToRemove) => {
    setEditImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setError('');
    setUpdating(true);
    try {
      const payload = {
        name: editName.trim(),
        brand: editBrand.trim() || undefined,
        description: editDescription.trim() || undefined,
        pricePaise: Math.round(Number(editPrice) * 100),
        originalPricePaise: editOriginalPrice && Number(editOriginalPrice) > 0 ? Math.round(Number(editOriginalPrice) * 100) : null,
        stock: Number(editStock) || 0,
        publishStatus: editPublishStatus,
        audience: editAudience,
      };
      if (editHeaderId) payload.headerId = editHeaderId;
      if (editCategoryId) payload.categoryId = editCategoryId;
      if (editSubcategoryId) payload.subcategoryId = editSubcategoryId;
      if (editImages.length > 0) {
        const validImages = editImages.filter((img) => img.attachmentId);
        if (validImages.length > 0) {
          payload.images = validImages.map((img, idx) => ({
            attachmentId: img.attachmentId,
            alt: img.alt || `${editName.trim()} photo ${idx + 1}`,
          }));
        }
      }

      await updateVendorProduct(editingProduct.id, payload);
      await loadProducts();
      setEditingProduct(null);
      if (selectedProduct?.id === editingProduct.id) {
        setSelectedProduct(null);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update product'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteVendorProduct(productId);
      await loadProducts();
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }
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
  const activeItemsCount = useMemo(() => products.filter(p => p.approval === 'Approved' || p.approval === 'Pending').length, [products]);
  const lowStockCount = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).length, [products]);
  const outOfStockCount = useMemo(() => products.filter(p => p.stock === 0).length, [products]);

  // Real categories present in the vendor's own catalog, not a hardcoded guess.
  const availableCategories = useMemo(
    () => ['All', ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

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

          {/* Audience Tabs — keeps retail (Users) and bulk (Schools) catalogs visibly separate */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl p-1.5 w-fit">
            {[
              { key: 'All', label: 'All Products' },
              { key: 'users', label: 'Users (Retail)' },
              { key: 'schools', label: 'Schools (Bulk)' },
              { key: 'both', label: 'Both (Shared)' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedAudience(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  selectedAudience === tab.key
                    ? 'bg-white text-[#5B3FD6] shadow-sm border border-purple-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                  ))}
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
                    <th className="px-6 py-4">Sell To</th>
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
                            {product.imageUrl ? (
                              <div className="w-10 h-10 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 shrink-0 shadow-xs">
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className={`w-10 h-10 rounded-xl ${product.imgBg} flex items-center justify-center font-black text-sm shrink-0 border border-gray-100 shadow-xs`}>
                                {product.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-extrabold text-gray-900 tracking-tight leading-tight">{product.name}</p>
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <span className="text-[10px] font-black text-[#5B3FD6] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                                  ₹{product.price}
                                </span>
                                {product.originalPrice && (
                                  <span className="text-[9px] text-gray-400 line-through font-semibold">
                                    MRP ₹{product.originalPrice}
                                  </span>
                                )}
                                <span className="text-[9px] font-bold text-gray-400 uppercase ml-1">Stock: {product.stock}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* PRODUCT CODE */}
                        <td className="px-6 py-4.5">
                          <span className="font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded-md text-[11px] font-bold border border-gray-100">
                            {product.code}
                          </span>
                        </td>

                        {/* SELL TO (audience) */}
                        <td className="px-6 py-4.5">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            product.audience === 'schools'
                              ? 'bg-blue-50 text-blue-600 border-blue-100'
                              : product.audience === 'both'
                              ? 'bg-purple-50 text-[#5B3FD6] border-purple-200'
                              : 'bg-gray-50 text-gray-600 border-gray-150'
                          }`}>
                            {product.audience === 'schools' ? 'Schools' : product.audience === 'both' ? 'Both' : 'Users'}
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
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => setSelectedProduct(product)}
                              className="p-2 rounded-xl border border-purple-100 bg-gray-50 hover:bg-[#5B3FD6] hover:text-white text-gray-600 text-xs font-bold transition-all shadow-xs cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>

                            <button 
                              onClick={() => openEditModal(product)}
                              className="p-2 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 text-xs font-bold transition-all shadow-xs cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 size={14} />
                            </button>

                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 rounded-xl border border-red-100 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 text-xs font-bold transition-all shadow-xs cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400 font-bold bg-white">
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
                    {selectedProduct.imageUrl ? (
                      <div className="w-12 h-12 rounded-xl border border-gray-200 overflow-hidden bg-white shrink-0 shadow-xs">
                        <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-xl ${selectedProduct.imgBg} flex items-center justify-center font-black text-xl shrink-0`}>
                        {selectedProduct.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 leading-tight">{selectedProduct.name}</h4>
                      <span className="inline-flex items-center gap-1.5 mt-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Price: ₹{selectedProduct.price}
                      </span>
                    </div>
                  </div>

                  {selectedProduct.images?.length > 1 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-sans">
                        Product Photos ({selectedProduct.images.length})
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {selectedProduct.images.map((img, idx) => (
                          <div key={idx} className="relative w-14 h-14 rounded-xl border border-gray-200 overflow-hidden shrink-0 shadow-2xs">
                            <img src={img.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                            {idx === 0 && (
                              <span className="absolute bottom-0 inset-x-0 bg-[#5B3FD6]/90 text-white text-[7px] font-black text-center py-0.5 uppercase tracking-wider">
                                Cover
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-sans">Details</span>
                    <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-white shadow-sm text-xs font-semibold">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Sell To</span>
                        <span className={selectedProduct.audience === 'schools' ? 'text-blue-600 font-bold' : selectedProduct.audience === 'both' ? 'text-[#5B3FD6] font-bold' : 'text-gray-800 font-bold'}>
                          {selectedProduct.audience === 'schools' ? 'Schools (Bulk)' : selectedProduct.audience === 'both' ? 'Both (Users & Schools)' : 'Users (Retail)'}
                        </span>
                      </div>
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

                <div className="p-6 border-t border-gray-100 flex items-center gap-3 shrink-0 bg-gray-50/50">
                  <button
                    onClick={() => {
                      const prodToEdit = selectedProduct;
                      setSelectedProduct(null);
                      openEditModal(prodToEdit);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#5B3FD6] hover:bg-[#4C31BD] text-white text-xs font-black transition-all shadow-md shadow-purple-200 cursor-pointer"
                  >
                    <Edit3 size={15} /> Edit Product
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(selectedProduct.id)}
                    className="px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black transition-all border border-red-100 cursor-pointer"
                    title="Delete product"
                  >
                    <Trash2 size={15} />
                  </button>
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
                disabled={publishing}
                className="px-5 py-2.5 bg-[#0E0E2C] hover:bg-[#1a1a45] text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-gray-900/10 cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {publishing && <Loader2 size={14} className="animate-spin" />}
                Save &amp; Publish
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

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

              {/* Audience — who this product is sold to */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4.5 space-y-2.5 shadow-sm">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Sell To</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'users', label: 'Users', hint: 'Retail' },
                    { key: 'schools', label: 'Schools', hint: 'Bulk' },
                    { key: 'both', label: 'Both', hint: 'Retail & Bulk' },
                  ].map((opt) => {
                    const active = newAudience === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setNewAudience(opt.key)}
                        className={`rounded-xl px-2.5 py-2.5 text-left border transition-all ${
                          active ? 'bg-[#0E0E2C] border-[#0E0E2C] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="block text-[11px] font-black">{opt.label}</span>
                        <span className={`block text-[8px] font-bold uppercase tracking-wide ${active ? 'text-white/60' : 'text-gray-400'}`}>{opt.hint}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="block text-[8px] text-gray-400 font-medium">
                  Users → parent app. Schools → school module. Both → visible in both applications.
                </span>
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
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Selling Price (₹)</label>
                        <input 
                          type="number"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          placeholder="499"
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2"
                        />
                      </div>

                      {/* MRP / Original Price Input */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                          MRP / Original Price (₹) <span className="text-gray-400 normal-case font-normal">(optional, for discount badge)</span>
                        </label>
                        <input 
                          type="number"
                          value={newOriginalPrice}
                          onChange={(e) => setNewOriginalPrice(e.target.value)}
                          placeholder="699"
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
                        <select
                          value={newHeaderId}
                          onChange={(e) => { setNewHeaderId(e.target.value); setNewCategoryId(''); setNewSubcategoryId(''); }}
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
                        >
                          <option value="">Select header…</option>
                          {catTree.map((h) => (
                            <option key={h._id} value={h._id}>{h.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Category select */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Category</label>
                        <select
                          value={newCategoryId}
                          onChange={(e) => { setNewCategoryId(e.target.value); setNewSubcategoryId(''); }}
                          disabled={!selectedHeader}
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 disabled:opacity-50"
                        >
                          <option value="">{selectedHeader ? 'Select category…' : 'Pick a header first'}</option>
                          {(selectedHeader?.categories || []).map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Subcategory select (optional) */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Subcategory <span className="text-gray-300 normal-case">(optional)</span></label>
                        <select
                          value={newSubcategoryId}
                          onChange={(e) => setNewSubcategoryId(e.target.value)}
                          disabled={!selectedCategoryObj}
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 disabled:opacity-50"
                        >
                          <option value="">{selectedCategoryObj ? 'None' : 'Pick a category first'}</option>
                          {(selectedCategoryObj?.subcategories || []).map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                    </div>

                  </div>
                )}

                {activeFormTab === 'Photos' && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-900">Product Images</h3>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                          Upload 1 to {MAX_PRODUCT_IMAGES} photos. The first image will be used as the primary cover photo.
                        </p>
                      </div>
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                        newImages.length >= MAX_PRODUCT_IMAGES
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-purple-50 text-[#5B3FD6] border border-purple-100'
                      }`}>
                        {newImages.length} / {MAX_PRODUCT_IMAGES} Images
                      </span>
                    </div>

                    {/* Image Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {newImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative group aspect-square rounded-2xl border-2 border-gray-200 hover:border-[#5B3FD6] overflow-hidden bg-gray-50 shadow-xs transition-all"
                        >
                          <img src={img.url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                            {idx === 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-[#5B3FD6] text-white text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                                <CheckCircle2 size={10} /> Cover
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
                                Photo {idx + 1}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeNewImage(idx)}
                              className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-all cursor-pointer hover:scale-110 active:scale-95"
                              title="Delete photo"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Image Slot (Visible if < MAX_PRODUCT_IMAGES) */}
                      {newImages.length < MAX_PRODUCT_IMAGES && (
                        <div className={`aspect-square rounded-2xl border-2 border-dashed ${
                          newImages.length === 0
                            ? 'border-purple-200 hover:border-[#5B3FD6]/40 bg-purple-50/15 col-span-2 sm:col-span-3 py-10'
                            : 'border-gray-300 hover:border-[#5B3FD6]/40 bg-gray-50/50'
                        } flex flex-col items-center justify-center p-4 text-center transition-all`}>
                          {uploadingImage ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 size={24} className="animate-spin text-[#5B3FD6]" />
                              <span className="text-[11px] font-bold text-gray-500">Uploading photos…</span>
                            </div>
                          ) : (
                            <div className="space-y-3 flex flex-col items-center justify-center">
                              <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5B3FD6] flex items-center justify-center border border-purple-100">
                                <UploadCloud size={20} />
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-900">
                                  {newImages.length === 0 ? 'Add Product Photos' : 'Add More Photos'}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                                  PNG, JPG up to 5MB ({MAX_PRODUCT_IMAGES - newImages.length} slots left)
                                </p>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-purple-200 hover:border-[#5B3FD6]/40 text-[#5B3FD6] text-[11px] font-black cursor-pointer transition-all shadow-2xs">
                                  <Camera size={12} /> Camera
                                  <input type="file" accept=".png,.jpg,.jpeg,.webp" capture="environment" className="hidden" onChange={handleImageUpload} />
                                </label>
                                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5B3FD6] hover:bg-[#4C31BD] text-white text-[11px] font-black cursor-pointer transition-all shadow-2xs">
                                  <UploadCloud size={12} /> Browse Files
                                  <input type="file" accept=".png,.jpg,.jpeg,.webp" multiple className="hidden" onChange={handleImageUpload} />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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

      {/* EDIT PRODUCT MODAL OVERLAY */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all animate-fade-in">
          <div className="bg-white border border-gray-100 max-w-[500px] w-full p-6 rounded-[2rem] shadow-2xl space-y-5 animate-scale-in relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-[#5B3FD6] uppercase tracking-wider block">Edit Catalog Item</span>
                <h3 className="text-base font-extrabold text-gray-900 mt-0.5">{editingProduct.name}</h3>
              </div>
              <button 
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors border border-gray-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              
              {/* Product Image Section */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block">Product Image</label>
                <div className="flex items-center gap-3">
                  {editImagePreview ? (
                    <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                      <img src={editImagePreview} alt="Product" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                      <Image size={20} />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5B3FD6] text-xs font-bold border border-purple-100 cursor-pointer transition-colors">
                      <Camera size={14} />
                      <span>Take Photo</span>
                      <input type="file" accept=".png,.jpg,.jpeg,.webp" capture="environment" className="hidden" onChange={handleEditImageUpload} />
                    </label>
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5B3FD6] text-xs font-bold border border-purple-100 cursor-pointer transition-colors">
                      {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                      <span>{editImagePreview ? 'Change Image' : 'Upload Image'}</span>
                      <input type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleEditImageUpload} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Header & Category Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block">Header Group</label>
                  <select
                    value={editHeaderId}
                    onChange={(e) => {
                      setEditHeaderId(e.target.value);
                      setEditCategoryId('');
                      setEditSubcategoryId('');
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6]"
                  >
                    <option value="">Select header...</option>
                    {catTree.map((h) => (
                      <option key={h._id} value={h._id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block">Category</label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => {
                      setEditCategoryId(e.target.value);
                      setEditSubcategoryId('');
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6]"
                  >
                    <option value="">Select category...</option>
                    {(catTree.find(h => h._id === editHeaderId)?.categories || []).map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sell To — who this product is sold to */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block">Sell To</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'users', label: 'Users', hint: 'Retail' },
                    { key: 'schools', label: 'Schools', hint: 'Bulk' },
                    { key: 'both', label: 'Both', hint: 'Retail & Bulk' },
                  ].map((opt) => {
                    const active = editAudience === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setEditAudience(opt.key)}
                        className={`rounded-xl px-2.5 py-2.5 text-left border transition-all ${
                          active ? 'bg-[#0E0E2C] border-[#0E0E2C] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="block text-[11px] font-black">{opt.label}</span>
                        <span className={`block text-[8px] font-bold uppercase tracking-wide ${active ? 'text-white/60' : 'text-gray-400'}`}>{opt.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block">Product Name</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block">Brand</label>
                  <input 
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block">Selling Price (₹)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block">
                    MRP / Orig. (₹) <span className="text-gray-400 normal-case font-normal">(optional)</span>
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={editOriginalPrice}
                    onChange={(e) => setEditOriginalPrice(e.target.value)}
                    placeholder="e.g. 699"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block">Stock Quantity</label>
                  <input 
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block">Status</label>
                  <select 
                    value={editPublishStatus}
                    onChange={(e) => setEditPublishStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block">Description</label>
                <textarea 
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6]"
                />
              </div>

              {/* Product Photos Section */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block">
                    Product Photos ({editImages.length} / {MAX_PRODUCT_IMAGES})
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">1st photo is Cover photo</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {editImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square rounded-xl border border-gray-200 overflow-hidden bg-gray-50 shadow-xs"
                    >
                      <img src={img.url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
                        {idx === 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-[#5B3FD6] text-white text-[8px] font-black uppercase tracking-wider shadow-sm">
                            Cover
                          </span>
                        ) : (
                          <span className="px-1 py-0.5 rounded bg-black/60 text-white text-[8px] font-bold">
                            #{idx + 1}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeEditImage(idx)}
                          className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-all cursor-pointer hover:scale-110 active:scale-95"
                          title="Remove photo"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add more button in edit modal */}
                  {editImages.length < MAX_PRODUCT_IMAGES && (
                    <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#5B3FD6]/40 bg-gray-50/50 flex flex-col items-center justify-center p-2 text-center transition-all">
                      {uploadingImage ? (
                        <div className="flex flex-col items-center gap-1">
                          <Loader2 size={16} className="animate-spin text-[#5B3FD6]" />
                          <span className="text-[8px] text-gray-500">Uploading…</span>
                        </div>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer">
                          <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#5B3FD6] flex items-center justify-center border border-purple-100">
                            <Plus size={14} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-700">Add Photo</span>
                          <span className="text-[8px] text-gray-400">({MAX_PRODUCT_IMAGES - editImages.length} left)</span>
                          <input type="file" accept=".png,.jpg,.jpeg,.webp" multiple className="hidden" onChange={handleEditImageUpload} />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5B3FD6] hover:bg-[#4C31BD] text-white text-xs font-black transition-all shadow-md shadow-purple-200 cursor-pointer disabled:opacity-50"
                >
                  {updating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorProducts;
