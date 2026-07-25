import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Package, Plus, Search, Filter, Trash2, Edit3, X, Check, 
  Loader2, AlertCircle, ImageIcon, Layers, Tag, Upload, FileText, Sparkles, Image as LucideImage,
  LayoutGrid, List
} from 'lucide-react';
import { 
  listMasterKitProducts, createMasterKitProduct, 
  updateMasterKitProduct, deleteMasterKitProduct, uploadAdminMedia 
} from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const CATEGORY_OPTIONS = [
  'Textbooks & Notebooks',
  'School Uniforms',
  'Stationary Packs',
  'Winter Kit',
  'Initial Kit',
  'Project Kit',
  'General & Accessories'
];

const PRODUCT_TYPES = [
  { value: 'textbook', label: 'Textbook / Book (Requires Subject/Grade)' },
  { value: 'notebook', label: 'Notebook / Copy (Requires Pages/R触)' },
  { value: 'uniform', label: 'School Uniform (Requires Size & Color)' },
  { value: 'stationary', label: 'Stationary Item' },
  { value: 'winter', label: 'Winter Wear (Requires Size & Color)' },
  { value: 'project', label: 'Project Item' },
  { value: 'general', label: 'General Product' },
];

const KitProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORY_OPTIONS[0],
    subcategory: '',
    imageUrl: '',
    productType: 'general',
    description: '',
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listMasterKitProducts({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: search.trim() || undefined,
        limit: 200,
      });
      setProducts(data || []);
    } catch (err) {
      setProducts([]);
      setError(getErrorMessage(err, 'Failed to load master kit products'));
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: CATEGORY_OPTIONS[0],
      subcategory: '',
      imageUrl: '',
      productType: 'general',
      description: '',
    });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id || item.id);
    setFormData({
      name: item.name || '',
      category: item.category || CATEGORY_OPTIONS[0],
      subcategory: item.subcategory || '',
      imageUrl: item.imageUrl || '',
      productType: item.productType || 'general',
      description: item.description || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setFormError('');
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('purpose', 'kit_product_template');
      const attachment = await uploadAdminMedia(data);
      const url = attachment?.url || (attachment?.storageKey ? (attachment.storageKey.startsWith('/uploads/') ? attachment.storageKey : `/uploads/${attachment.storageKey}`) : null);
      if (url) {
        setFormData((prev) => ({ ...prev, imageUrl: url }));
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({ ...prev, imageUrl: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Product Name is required.');
      return;
    }
    if (!formData.category) {
      setFormError('Category is required.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        subcategory: formData.subcategory.trim() || undefined,
        imageUrl: formData.imageUrl || undefined,
        productType: formData.productType,
        description: formData.description.trim() || undefined,
      };

      if (editingId) {
        await updateMasterKitProduct(editingId, payload);
      } else {
        await createMasterKitProduct(payload);
      }

      setShowModal(false);
      await loadProducts();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save master product'));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this master kit product?')) return;
    try {
      await deleteMasterKitProduct(id);
      await loadProducts();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete product'));
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto font-outfit space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#3b2d7d] via-[#4c3a9e] to-[#5942bc] p-7 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shadow-inner">
              <Package size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wide">Master Kit Products Catalogue</h1>
              <p className="text-xs text-purple-100 font-bold mt-0.5">
                Standardized product templates for schools to bundle into Class Kits & Packages
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="relative z-10 px-6 py-3.5 bg-white text-[#3b2d7d] hover:bg-amber-300 hover:text-[#2a1e5c] active:scale-95 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 self-start sm:self-auto uppercase tracking-wider shrink-0"
        >
          <Plus size={16} className="stroke-[3]" />
          <span>Add Master Product</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto scrollbar-none justify-between md:justify-end">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Filter size={12} /> Category:
            </span>
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'All'
                  ? 'bg-[#3b2d7d] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#3b2d7d] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200/80 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#3b2d7d] shadow-sm font-black'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-[#3b2d7d] shadow-sm font-black'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 font-bold flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#3b2d7d]" />
          <span>Loading Master Kit Products...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center bg-white border border-gray-150 rounded-3xl p-8 shadow-sm space-y-3">
          <Package size={48} className="text-gray-300 mx-auto" />
          <h3 className="text-sm font-black text-gray-700">No Master Kit Products Found</h3>
          <p className="text-xs text-gray-400 font-bold max-w-sm mx-auto">
            Click "Add Master Product" to populate product templates for schools to use when creating kits.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Data Table View */
        <div className="bg-white border border-gray-200/80 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full scrollbar-thin">
            <table className="w-full min-w-[640px] text-left text-xs font-semibold text-gray-600 border-collapse select-none">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-4 px-5">#</th>
                  <th className="py-4 px-5">Product Template</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Product Type</th>
                  <th className="py-4 px-5">Description</th>
                  <th className="py-4 px-5 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {products.map((item, idx) => (
                  <tr key={item._id || item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-gray-400 text-xs">{idx + 1}</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl border border-gray-150 p-1 bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon size={18} className="text-gray-300" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 text-xs leading-snug">{item.name}</h4>
                          {item.subcategory && (
                            <span className="text-[10px] font-bold text-gray-400 block mt-0.5">
                              Subcategory: {item.subcategory}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-3 py-1 bg-purple-50 text-[#3b2d7d] border border-purple-100/80 rounded-xl text-[11px] font-black inline-block">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-wider inline-block">
                        {item.productType || 'general'}
                      </span>
                    </td>
                    <td className="py-4 px-5 max-w-xs">
                      <p className="text-[11px] text-gray-500 font-medium line-clamp-2">
                        {item.description || '—'}
                      </p>
                    </td>
                    <td className="py-4 px-5 text-right pr-6">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-xl bg-purple-50 text-[#3b2d7d] hover:bg-purple-100 active:scale-95 transition-all"
                          title="Edit Master Product"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id || item.id)}
                          className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all"
                          title="Delete Master Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Product Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((item) => (
            <div
              key={item._id || item.id}
              className="bg-white border border-gray-150 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                <div className="w-full h-36 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center relative">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-300 gap-1">
                      <ImageIcon size={28} />
                      <span className="text-[9px] font-black uppercase">No Image</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-black text-purple-900 shadow-sm border border-purple-100">
                    {item.productType || 'general'}
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  <span className="text-[9px] font-black text-purple-600 uppercase tracking-wider block">
                    {item.category} {item.subcategory ? `• ${item.subcategory}` : ''}
                  </span>
                  <h3 className="text-xs font-black text-gray-900 leading-snug line-clamp-2">{item.name}</h3>
                  {item.description && (
                    <p className="text-[10px] text-gray-400 font-medium line-clamp-2 mt-1">{item.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 rounded-xl bg-purple-50 text-[#3b2d7d] hover:bg-purple-100 active:scale-95 transition-all"
                  title="Edit Master Product"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item._id || item.id)}
                  className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all"
                  title="Delete Master Product"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Premium Add / Edit Master Product Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
            
            {/* Header Section */}
            <div className="bg-[#0B1528] text-white p-5 px-6 border-b border-gray-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/10 shrink-0">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider leading-none">
                    {editingId ? 'Edit Master Kit Product' : 'Add Master Kit Product'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">
                    Admin catalog template for school kits & packages
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 min-h-0 space-y-5 text-xs bg-[#F9F9FC] scrollbar-thin">
              
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 font-bold text-xs flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Basic Information Block */}
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3.5">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                  <div className="w-5 h-5 rounded-md bg-purple-50 text-[#0B1528] flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">Product Identity</h4>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1 ml-0.5">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. NCERT Mathematics Textbook Class 1"
                    className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#0B1528] transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1 ml-0.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#0B1528] transition-all text-xs cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1 ml-0.5">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      placeholder="e.g. Textbooks / Shirts"
                      className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#0B1528] transition-all text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Product Classification & Rules */}
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3.5">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                  <div className="w-5 h-5 rounded-md bg-indigo-50 text-[#0B1528] flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">Classification & Variation Rules</h4>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1 ml-0.5">
                    Product Type / Variation Parameters
                  </label>
                  <select
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#0B1528] transition-all text-xs cursor-pointer"
                  >
                    {PRODUCT_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 font-medium mt-1.5 ml-0.5">
                    Selecting uniform or winter wear triggers mandatory size/color selection prompts when schools create custom kits.
                  </p>
                </div>
              </div>

              {/* 3. Product Image Section */}
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      3
                    </div>
                    <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">Product Visual Asset</h4>
                  </div>
                  {formData.imageUrl && (
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase">
                      Ready
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
                  <div className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center relative overflow-hidden">
                    {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Product Preview" className="w-full h-full object-contain p-1.5" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 active:scale-90 transition-all"
                          title="Remove Image"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-2 text-gray-400 gap-1">
                        <LucideImage size={24} className="text-gray-300" />
                        <span className="text-[9px] font-bold">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2.5">
                    <label className="w-full px-4 py-2.5 bg-purple-50 hover:bg-purple-100 active:scale-95 text-[#0B1528] font-black rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 border border-purple-200/60 shadow-sm text-xs">
                      {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>{uploadingImage ? 'Uploading Image...' : 'Choose Photo File'}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                    </label>

                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Or Direct Image URL</span>
                      <input
                        type="text"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://example.com/product.jpg or /uploads/..."
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 text-[11px] focus:outline-none focus:border-[#0B1528]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Description Section */}
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3.5">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                  <div className="w-5 h-5 rounded-md bg-purple-50 text-[#0B1528] flex items-center justify-center font-bold">
                    4
                  </div>
                  <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">Product Notes</h4>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Specifications, publisher details, features..."
                    className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#0B1528] transition-all text-xs"
                  />
                </div>
              </div>

            </form>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-gray-50/80 border-t border-gray-150 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold text-gray-400">
                <span className="text-red-500">*</span> Required fields
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={formSubmitting || uploadingImage}
                  className="px-6 py-2.5 bg-[#0B1528] hover:bg-[#1a2942] text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md"
                >
                  {formSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingId ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default KitProductsManagement;
