import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Plus, Search, Filter, Trash2, Edit3, X, Check, 
  Loader2, AlertCircle, ImageIcon, Layers, Tag, Image as LucideImage 
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
  { value: 'textbook', label: 'Textbook / Book' },
  { value: 'notebook', label: 'Notebook / Copy' },
  { value: 'uniform', label: 'School Uniform (Ask Size & Color)' },
  { value: 'stationary', label: 'Stationary Item' },
  { value: 'winter', label: 'Winter Wear (Ask Size & Color)' },
  { value: 'project', label: 'Project Item' },
  { value: 'general', label: 'General Product' },
];

const KitProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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
      if (attachment?.storageKey) {
        setFormData((prev) => ({ ...prev, imageUrl: attachment.storageKey }));
      }
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to upload product image'));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#3b2d7d] to-[#5942bc] p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Package size={22} className="text-purple-200" />
            <h1 className="text-xl font-black uppercase tracking-wide">Master Kit Products Catalogue</h1>
          </div>
          <p className="text-xs text-purple-200 mt-1 font-bold">
            Create and manage product templates for schools to include in their Class Kits
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-white text-[#3b2d7d] hover:bg-purple-50 active:scale-95 font-black text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto uppercase tracking-wider"
        >
          <Plus size={16} className="stroke-[3]" />
          Add Master Product
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

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
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

      {/* Add / Edit Master Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-[#3b2d7d] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-black uppercase tracking-wider">
                {editingId ? 'Edit Master Kit Product' : 'Add Master Kit Product'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs scrollbar-none">
              
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 font-bold text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. NCERT Mathematics Textbook Grade 1"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g. Textbooks / Shirts"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Type (Defines Attributes Required)</label>
                <select
                  value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                >
                  {PRODUCT_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Image</label>
                <div className="flex items-center gap-3">
                  {formData.imageUrl ? (
                    <div className="w-14 h-14 rounded-xl border border-gray-200 p-1 bg-gray-50 shrink-0 overflow-hidden relative">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                      <LucideImage size={20} />
                    </div>
                  )}

                  <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5">
                    {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Informational details about this product template..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || uploadingImage}
                  className="px-6 py-2.5 bg-[#3b2d7d] hover:bg-[#5942bc] text-white font-black rounded-xl uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-60"
                >
                  {formSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingId ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default KitProductsManagement;
