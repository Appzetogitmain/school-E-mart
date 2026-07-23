import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Package, Layers, Trash2, Plus, Info, Check, ChevronRight,
  Upload, Sparkles, TrendingUp, X, Loader2, AlertCircle, ShoppingBag, Store, Tag,
  Search, Filter, Sliders, DollarSign, Image as LucideImage, Minus, HelpCircle
} from 'lucide-react';
import { 
  createKit, updateKit, getKit, listClasses, listVendors, 
  uploadSchoolFile, listKitCategories, createKitCategory, 
  deleteKitCategory, listMasterKitProductsForSchool 
} from '../../../services/schoolApi';
import { useSchoolId } from '../../../utils/schoolContext';
import { getErrorMessage } from '../../../utils/apiHelpers';

const DEFAULT_CATEGORIES = [
  'Textbooks & Notebooks',
  'School Uniforms',
  'Stationary Packs',
  'Winter Kit',
  'Initial Kit',
  'Project Kit',
];

const STANDARD_UNIFORM_SIZES = ['24', '26', '28', '30', '32', '34', '36', '38', '40', 'S', 'M', 'L', 'XL', 'XXL'];

const SchoolCreateKit = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();
  const [searchParams] = useSearchParams();
  const kitId = searchParams.get('kitId');
  const isEditing = Boolean(kitId);

  const [loadingKit, setLoadingKit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Form Basic Info
  const [kitName, setKitName] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [vendorId, setVendorId] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageId, setExistingImageId] = useState(null);

  // Pricing
  const [sellingPrice, setSellingPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [kitStatus, setKitStatus] = useState('active');

  // Categories & Vendors & Classes lists
  const [categoriesData, setCategoriesData] = useState({ defaults: DEFAULT_CATEGORIES, custom: [], all: DEFAULT_CATEGORIES });
  const [vendorsList, setVendorsList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [masterProducts, setMasterProducts] = useState([]);

  // Category Modal
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  // Master Product Picker Modal
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('All');

  // Kit Items List
  const [items, setItems] = useState([]);

  // Load Dependencies
  const loadInitialData = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [clsList, vList, catRes, mpRes] = await Promise.all([
        listClasses(schoolId).catch(() => []),
        listVendors(schoolId, { limit: 100 }).catch(() => ({ data: [] })),
        listKitCategories(schoolId).catch(() => ({ defaults: DEFAULT_CATEGORIES, custom: [], all: DEFAULT_CATEGORIES })),
        listMasterKitProductsForSchool({ limit: 300 }).catch(() => ({ data: [] })),
      ]);

      setClassesList(clsList || []);
      setVendorsList(vList?.data || []);
      setCategoriesData(catRes || { defaults: DEFAULT_CATEGORIES, custom: [], all: DEFAULT_CATEGORIES });
      setMasterProducts(mpRes?.data || []);

      if (vList?.data?.length && !vendorId) {
        setVendorId(vList.data[0]._id || vList.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load kit form dependencies:', err);
    }
  }, [schoolId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load Existing Kit for Edit Mode
  useEffect(() => {
    if (!schoolId || !kitId) return;
    setLoadingKit(true);
    (async () => {
      try {
        const kit = await getKit(schoolId, kitId);
        if (kit) {
          setKitName(kit.name || '');
          setClassGrade(kit.classGrade || '');
          setCategory(kit.category || DEFAULT_CATEGORIES[0]);
          setVendorId(kit.vendorId?._id || kit.vendorId?.id || kit.vendorId || '');
          setDescription(kit.description || '');
          setSellingPrice(kit.pricePaise ? (kit.pricePaise / 100).toString() : '');
          setMrp(kit.mrpPaise ? (kit.mrpPaise / 100).toString() : '');
          setKitStatus(kit.status || 'active');
          if (kit.imageId?.storageKey || kit.imageUrl) {
            setImagePreview(kit.imageId?.storageKey || kit.imageUrl);
            setExistingImageId(kit.imageId?._id || kit.imageId);
          }
          if (Array.isArray(kit.items)) {
            setItems(kit.items.map((it, idx) => ({
              id: it._id || `item_${idx}`,
              masterProductId: it.masterProductId?._id || it.masterProductId || null,
              name: it.name || it.masterProductId?.name || 'Product',
              category: it.category || it.masterProductId?.category || 'General',
              subcategory: it.subcategory || it.masterProductId?.subcategory || '',
              productType: it.masterProductId?.productType || 'general',
              imageUrl: it.imageUrl || it.masterProductId?.imageUrl || '',
              qty: it.qty || 1,
              attributes: {
                color: it.attributes?.color || '',
                sizes: it.attributes?.sizes || [],
                gender: it.attributes?.gender || 'Unisex',
                publisher: it.attributes?.publisher || '',
                subject: it.attributes?.subject || '',
                packDetails: it.attributes?.packDetails || '',
              }
            })));
          }
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load kit details'));
      } finally {
        setLoadingKit(false);
      }
    })();
  }, [schoolId, kitId]);

  // Image Handler
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Add Custom Category Handler
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      await createKitCategory(schoolId, newCatName.trim());
      setNewCatName('');
      setShowAddCatModal(false);
      const updatedCats = await listKitCategories(schoolId);
      setCategoriesData(updatedCats);
      setCategory(newCatName.trim());
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to add custom category'));
    } finally {
      setCreatingCat(false);
    }
  };

  // Delete Custom Category Handler
  const handleDeleteCategory = async (catObj) => {
    if (!window.confirm(`Delete custom category "${catObj.name}"?`)) return;
    try {
      await deleteKitCategory(schoolId, catObj._id || catObj.id);
      const updatedCats = await listKitCategories(schoolId);
      setCategoriesData(updatedCats);
      if (category === catObj.name) {
        setCategory(DEFAULT_CATEGORIES[0]);
      }
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete category'));
    }
  };

  // Add Master Product to Kit
  const handleAddMasterProduct = (mp) => {
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      masterProductId: mp._id || mp.id,
      name: mp.name,
      category: mp.category,
      subcategory: mp.subcategory || '',
      productType: mp.productType || 'general',
      imageUrl: mp.imageUrl || '',
      qty: 1,
      attributes: {
        color: '',
        sizes: [],
        gender: 'Unisex',
        publisher: '',
        subject: '',
        packDetails: '',
      }
    };
    setItems((prev) => [...prev, newItem]);
    setShowProductPicker(false);
  };

  // Item helpers
  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const updateItemAttribute = (index, attrName, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        attributes: {
          ...copy[index].attributes,
          [attrName]: value,
        }
      };
      return copy;
    });
  };

  const toggleSizeForUniform = (index, size) => {
    setItems((prev) => {
      const copy = [...prev];
      const currentSizes = copy[index].attributes?.sizes || [];
      const updated = currentSizes.includes(size)
        ? currentSizes.filter((s) => s !== size)
        : [...currentSizes, size];
      copy[index] = {
        ...copy[index],
        attributes: {
          ...copy[index].attributes,
          sizes: updated,
        }
      };
      return copy;
    });
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submit
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!kitName.trim()) {
      setError('Please enter a Kit Name.');
      return;
    }
    if (!vendorId) {
      setError('Please select an assigned vendor for kit fulfillment.');
      return;
    }
    if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0) {
      setError('Please enter a valid Selling Price.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product item to the kit.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let uploadedImageId = existingImageId;
      if (imageFile) {
        const attachment = await uploadSchoolFile(schoolId, imageFile, 'kit_image');
        if (attachment?._id || attachment?.id) {
          uploadedImageId = attachment._id || attachment.id;
        }
      }

      const spPaise = Math.round(parseFloat(sellingPrice) * 100);
      const mrpPaiseVal = mrp ? Math.round(parseFloat(mrp) * 100) : spPaise;

      const payload = {
        name: kitName.trim(),
        classGrade: classGrade || undefined,
        category: category || DEFAULT_CATEGORIES[0],
        vendorId,
        description: description.trim() || undefined,
        imageId: uploadedImageId || undefined,
        imageUrl: imagePreview && !imageFile ? imagePreview : undefined,
        pricePaise: spPaise,
        mrpPaise: mrpPaiseVal,
        status: kitStatus,
        items: items.map((it) => ({
          masterProductId: it.masterProductId || undefined,
          name: it.name,
          category: it.category,
          subcategory: it.subcategory,
          imageUrl: it.imageUrl,
          qty: Number(it.qty) || 1,
          attributes: it.attributes,
        })),
      };

      if (isEditing) {
        await updateKit(schoolId, kitId, payload);
      } else {
        await createKit(schoolId, payload);
      }

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/school/kits');
      }, 1500);

    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save kit'));
    } finally {
      setSaving(false);
    }
  };

  const filteredMasterProducts = masterProducts.filter((mp) => {
    const matchesCat = selectedCatFilter === 'All' || mp.category === selectedCatFilter;
    const matchesSearch = !productSearch || mp.name.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const discountPercent = mrp && sellingPrice && Number(mrp) > Number(sellingPrice)
    ? Math.round(((Number(mrp) - Number(sellingPrice)) / Number(mrp)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 font-outfit text-gray-800">
      
      {/* Top Sticky Bar */}
      <div className="bg-white border-b border-gray-200/80 px-6 py-4 shadow-xs sticky top-0 z-30 backdrop-blur-md bg-white/90">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/school/kits')}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all active:scale-95 shrink-0"
              title="Back to Kits"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">
                {isEditing ? 'Edit School Kit' : 'Create New Kit'}
              </h1>
              <p className="text-xs text-gray-400 font-medium mt-1">Single-column structured kit creation form</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/school/kits')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-[#3b2d7d] hover:bg-[#4a3a99] text-white font-black text-xs rounded-xl uppercase tracking-wider flex items-center gap-2 shadow-md shadow-purple-900/10 active:scale-95 disabled:opacity-60 transition-all"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} className="stroke-[3]" />}
              <span>{isEditing ? 'Save Changes' : 'Publish Kit'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Single Column Container */}
      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-10">

        {/* Global Notifications */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200/80 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2.5 shadow-xs animate-in fade-in">
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs font-bold text-emerald-700 flex items-center gap-2.5 shadow-xs animate-in fade-in">
            <Check size={18} className="shrink-0 text-emerald-600" />
            <span>Kit saved successfully! Redirecting to kit list...</span>
          </div>
        )}

        {loadingKit ? (
          <div className="py-24 text-center text-gray-400 font-bold flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#3b2d7d]" />
            <span className="text-xs uppercase tracking-wider font-black">Loading Kit Information...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* SECTION 1: BASIC INFORMATION */}
            <section className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <h2 className="text-base font-black text-gray-900 tracking-tight uppercase">1. Basic Information</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Specify the kit title, target class, and category</p>
              </div>

              <div className="space-y-6">
                
                {/* Field 1: Kit Name */}
                <div className="w-full">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                    Kit Name / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={kitName}
                    onChange={(e) => setKitName(e.target.value)}
                    placeholder="e.g. Class 1 Annual Academic Kit (2026-27)"
                    className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d] focus:bg-white transition-all shadow-xs"
                  />
                </div>

                {/* Field 2: Target Class */}
                <div className="w-full">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                    Target Class / Grade
                  </label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d] focus:bg-white transition-all shadow-xs"
                  >
                    <option value="">Select Target Class / Grade</option>
                    {classesList.map((c) => {
                      const gradeName = typeof c === 'string' ? c : c.name || c.classGrade;
                      return (
                        <option key={gradeName} value={gradeName}>
                          {gradeName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Field 3: Category */}
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                      Kit Category <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCatModal(true)}
                      className="text-xs font-bold text-[#3b2d7d] hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} className="stroke-[3]" /> Add Custom Category
                    </button>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d] focus:bg-white transition-all shadow-xs"
                  >
                    {categoriesData.all.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Category Pills List */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {categoriesData.defaults.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                          category === cat
                            ? 'bg-[#3b2d7d] text-white border-[#3b2d7d] shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}

                    {categoriesData.custom.map((catObj) => (
                      <div
                        key={catObj._id || catObj.id}
                        className={`inline-flex items-center rounded-xl border text-xs font-bold transition-all ${
                          category === catObj.name
                            ? 'bg-[#3b2d7d] text-white border-[#3b2d7d] shadow-sm'
                            : 'bg-purple-50 text-purple-900 border-purple-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setCategory(catObj.name)}
                          className="px-3.5 py-2"
                        >
                          {catObj.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(catObj)}
                          className="pr-2.5 text-red-400 hover:text-red-600"
                          title="Delete Category"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </section>

            {/* SECTION 2: VENDOR & FULFILLMENT */}
            <section className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <h2 className="text-base font-black text-gray-900 tracking-tight uppercase">2. Order Fulfillment Vendor</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Select vendor to directly handle order fulfillment</p>
              </div>

              {/* Field 4: Vendor Dropdown */}
              <div className="w-full space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                  Assigned Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d] focus:bg-white transition-all shadow-xs"
                >
                  <option value="">Select Vendor to fulfill kit orders</option>
                  {vendorsList.map((v) => (
                    <option key={v._id || v.id} value={v._id || v.id}>
                      {v.storeName || v.businessName || v.name} — {v.phone || v.email}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-purple-900/70 font-medium">
                  🔒 Direct Routing: Orders placed for this kit are assigned directly to this vendor for fulfillment.
                </p>
              </div>
            </section>

            {/* SECTION 3: COVER IMAGE & OVERVIEW */}
            <section className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <h2 className="text-base font-black text-gray-900 tracking-tight uppercase">3. Cover Image & Overview</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Kit cover image and instructions for parents</p>
              </div>

              <div className="space-y-6">
                
                {/* Field 5: Cover Image */}
                <div className="w-full">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">Main Cover Image</label>
                  <div className="border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-2xl p-6 text-center hover:border-[#3b2d7d] transition-colors">
                    {imagePreview ? (
                      <div className="relative max-w-xs mx-auto h-40 rounded-xl overflow-hidden group shadow-sm bg-white border border-gray-200">
                        <img src={imagePreview} alt="Kit Cover" className="w-full h-full object-contain p-2" />
                        <label className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs font-bold">
                          Click to Change Image
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center py-4 text-gray-400 hover:text-[#3b2d7d] transition-colors">
                        <Upload size={28} className="mb-2 text-gray-400" />
                        <span className="text-sm font-bold text-gray-800">Upload Kit Main Image</span>
                        <span className="text-xs text-gray-400 mt-0.5">JPEG / PNG up to 10MB</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Field 6: Kit Overview */}
                <div className="w-full">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">Kit Overview & Instructions</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about what is included in this kit, instructions for parents, etc..."
                    className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d] focus:bg-white transition-all shadow-xs"
                  />
                </div>

              </div>
            </section>

            {/* SECTION 4: PRICING & VISIBILITY */}
            <section className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <h2 className="text-base font-black text-gray-900 tracking-tight uppercase">4. Pricing & App Status</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Selling price, MRP, and mobile app visibility</p>
              </div>

              <div className="space-y-6">
                
                {/* Field 7: Selling Price */}
                <div className="w-full">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="1999"
                      className="w-full pl-9 pr-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-black text-gray-900 focus:outline-none focus:border-[#3b2d7d] focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                  <span className="text-xs text-gray-400 mt-1 block">Actual price parent pays.</span>
                </div>

                {/* Field 8: MRP Price */}
                <div className="w-full">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                    MRP Price (₹) <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      placeholder="2499"
                      className="w-full pl-9 pr-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d] focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                  {discountPercent > 0 && (
                    <span className="text-xs font-black text-emerald-600 mt-1 block">
                      Shows {discountPercent}% OFF discount badge on app
                    </span>
                  )}
                </div>

                {/* Field 9: Status */}
                <div className="w-full">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">Publish Status</label>
                  <select
                    value={kitStatus}
                    onChange={(e) => setKitStatus(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d] focus:bg-white transition-all shadow-xs"
                  >
                    <option value="active">Active (Visible on Mobile App)</option>
                    <option value="draft">Draft (Saved for later)</option>
                  </select>
                </div>

              </div>
            </section>

            {/* SECTION 5: PRODUCTS INCLUDED IN THIS KIT */}
            <section className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-gray-150 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-gray-900 tracking-tight uppercase">
                    5. Included Products ({items.length} items)
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Select products from Master Catalogue & set custom item attributes</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowProductPicker(true)}
                  className="px-5 py-3 bg-[#3b2d7d] hover:bg-[#4a3a99] text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm active:scale-95"
                >
                  <Plus size={15} className="stroke-[3]" /> Add Product from Catalogue
                </button>
              </div>

              {items.length === 0 ? (
                <div className="py-14 text-center border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-gray-50/50 space-y-4">
                  <Package size={44} className="text-gray-300 mx-auto" />
                  <div>
                    <h3 className="text-sm font-black text-gray-800">No products added to this kit yet</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                      Click "Add Product from Catalogue" to select textbooks, uniform sets, or stationary items.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProductPicker(true)}
                    className="px-6 py-3 bg-white border border-gray-300 hover:border-[#3b2d7d] text-[#3b2d7d] font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center gap-2"
                  >
                    <Plus size={15} /> Browse Master Catalogue
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-6 bg-gray-50/80 border border-gray-200 rounded-2xl space-y-5 hover:border-purple-300 transition-all shadow-xs"
                    >
                      {/* Product Item Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-xl object-contain bg-white border border-gray-200 p-1.5 shrink-0 shadow-xs" />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-purple-100 text-[#3b2d7d] flex items-center justify-center font-black text-sm shrink-0">
                              {item.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider block">
                              {item.category} {item.subcategory ? `• ${item.subcategory}` : ''} ({item.productType})
                            </span>
                            <h4 className="text-sm font-black text-gray-900">{item.name}</h4>
                          </div>
                        </div>

                        {/* Quantity Stepper & Delete */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-xs">
                            <button
                              type="button"
                              onClick={() => updateItem(index, 'qty', Math.max(1, item.qty - 1))}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-8 text-center text-xs font-black text-gray-900">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateItem(index, 'qty', item.qty + 1)}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Remove Product"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Attributes (Single Column Stack) */}
                      <div className="pt-4 border-t border-gray-200/80 space-y-4">
                        
                        {/* Uniform / Winter Wear Controls */}
                        {(item.productType === 'uniform' || item.productType === 'winter') && (
                          <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                            <div className="w-full">
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">Uniform Color</label>
                              <input
                                type="text"
                                value={item.attributes?.color || ''}
                                onChange={(e) => updateItemAttribute(index, 'color', e.target.value)}
                                placeholder="e.g. Navy Blue / White"
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d]"
                              />
                            </div>

                            <div className="w-full">
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">Gender</label>
                              <div className="flex gap-2">
                                {['Unisex', 'Boy', 'Girl'].map((g) => (
                                  <button
                                    key={g}
                                    type="button"
                                    onClick={() => updateItemAttribute(index, 'gender', g)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                                      (item.attributes?.gender || 'Unisex') === g
                                        ? 'bg-[#3b2d7d] text-white border-[#3b2d7d]'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                    }`}
                                  >
                                    {g}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="w-full">
                              <label className="block text-xs font-bold text-gray-700 mb-2">Available Sizes</label>
                              <div className="flex flex-wrap gap-2">
                                {STANDARD_UNIFORM_SIZES.map((sz) => {
                                  const isSelected = (item.attributes?.sizes || []).includes(sz);
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() => toggleSizeForUniform(index, sz)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                        isSelected
                                          ? 'bg-[#3b2d7d] text-white border-[#3b2d7d] shadow-xs'
                                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                      }`}
                                    >
                                      {sz}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Textbook / Notebook Controls */}
                        {(item.productType === 'textbook' || item.productType === 'notebook') && (
                          <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                            <div className="w-full">
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">Subject</label>
                              <input
                                type="text"
                                value={item.attributes?.subject || ''}
                                onChange={(e) => updateItemAttribute(index, 'subject', e.target.value)}
                                placeholder="e.g. Mathematics / English"
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d]"
                              />
                            </div>

                            <div className="w-full">
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">Publisher / Board</label>
                              <input
                                type="text"
                                value={item.attributes?.publisher || ''}
                                onChange={(e) => updateItemAttribute(index, 'publisher', e.target.value)}
                                placeholder="e.g. NCERT / CBSE"
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d]"
                              />
                            </div>
                          </div>
                        )}

                        {/* General / Stationary Specification */}
                        {item.productType !== 'uniform' && item.productType !== 'winter' && item.productType !== 'textbook' && item.productType !== 'notebook' && (
                          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Specification / Pack Details</label>
                            <input
                              type="text"
                              value={item.attributes?.packDetails || ''}
                              onChange={(e) => updateItemAttribute(index, 'packDetails', e.target.value)}
                              placeholder="e.g. Pack of 5 pencils + eraser + sharpener"
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d]"
                            />
                          </div>
                        )}

                      </div>

                    </div>
                  ))}

                  {/* Add Product Button at Bottom of List */}
                  <button
                    type="button"
                    onClick={() => setShowProductPicker(true)}
                    className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-[#3b2d7d] bg-white rounded-2xl text-[#3b2d7d] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-sm"
                  >
                    <Plus size={16} className="stroke-[3]" /> Add Another Product to Kit
                  </button>
                </div>
              )}

            </section>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/school/kits')}
                className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-4 bg-[#3b2d7d] hover:bg-[#4a3a99] text-white font-black text-sm rounded-xl uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-900/20 active:scale-95 disabled:opacity-60 transition-all"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} className="stroke-[3]" />}
                <span>{isEditing ? 'Save Changes' : 'Publish Kit'}</span>
              </button>
            </div>

          </form>
        )}

      </div>

      {/* Add Custom Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase">Add Custom Kit Category</h3>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Sports Equipment Kit"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={creatingCat}
                className="px-5 py-2 bg-[#3b2d7d] text-white font-black text-xs rounded-xl uppercase tracking-wider"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Product Picker Modal */}
      {showProductPicker && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="bg-[#3b2d7d] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-black uppercase tracking-wider">Select Product from Master Catalogue</h3>
              <button
                onClick={() => setShowProductPicker(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 bg-gray-50 border-b border-gray-150 flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search master products..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d]"
                />
              </div>

              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="w-full sm:w-56 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#3b2d7d]"
              >
                <option value="All">All Categories</option>
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 scrollbar-none">
              {filteredMasterProducts.length === 0 ? (
                <div className="col-span-full py-16 text-center text-gray-400 font-bold text-xs">
                  No master products found matching your search.
                </div>
              ) : (
                filteredMasterProducts.map((mp) => (
                  <div
                    key={mp._id || mp.id}
                    className="bg-white border border-gray-200/80 rounded-2xl p-3.5 shadow-xs hover:border-[#3b2d7d] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-full h-24 bg-gray-50 rounded-xl overflow-hidden p-1.5 flex items-center justify-center mb-2">
                        {mp.imageUrl ? (
                          <img src={mp.imageUrl} alt={mp.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                        ) : (
                          <Package size={28} className="text-gray-300" />
                        )}
                      </div>
                      <span className="text-[9px] font-black text-purple-700 uppercase tracking-wider block">
                        {mp.category}
                      </span>
                      <h4 className="text-xs font-black text-gray-900 line-clamp-2 leading-snug">{mp.name}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddMasterProduct(mp)}
                      className="mt-3 w-full py-2 bg-purple-50 hover:bg-[#3b2d7d] text-[#3b2d7d] hover:text-white font-black text-[10px] uppercase rounded-xl transition-all active:scale-95"
                    >
                      + Add to Kit
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolCreateKit;
