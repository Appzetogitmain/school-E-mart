import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, HelpCircle, Package, Layers,
  Trash2, Plus, Info, Check, ChevronRight, ChevronUp,
  Upload, Sparkles, TrendingUp
} from 'lucide-react';
import { createKit, updateKit, getKit, listClasses, uploadSchoolFile } from '../../../services/schoolApi';
import { listProducts } from '../../../services/catalogApi';
import { useSchoolId } from '../../../utils/schoolContext';
import { getErrorMessage } from '../../../utils/apiHelpers';

const SchoolCreateKit = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();
  // Same form serves both create and edit; ?kitId= switches it to edit.
  const [searchParams] = useSearchParams();
  const kitId = searchParams.get('kitId');
  const isEditing = Boolean(kitId);
  const [loadingKit, setLoadingKit] = useState(false);

  // Basic Info States
  const [kitName, setKitName] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [includes, setIncludes] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Catalog products available to add to the kit
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');

  // Default added items list in Step 2
  const [items, setItems] = useState([]);

  // Pricing & Stock States
  const [sellingPrice, setSellingPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sku, setSku] = useState('');
  const [kitStatus, setKitStatus] = useState('active');
  const [showOnApp, setShowOnApp] = useState(true);
  const [availableOnline, setAvailableOnline] = useState(true);
  const [allowPreorders, setAllowPreorders] = useState(true);

  // Expandable Accordions States
  const [step3Open, setStep3Open] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await listProducts({ limit: 100 });
        if (!cancelled) setCatalogProducts(data || []);
      } catch {
        if (!cancelled) setCatalogProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      try {
        const list = await listClasses(schoolId);
        setClassesList(list || []);
      } catch (err) {
        console.error('Failed to load classes:', err);
      }
    })();
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !kitId) return undefined;
    let cancelled = false;

    (async () => {
      setLoadingKit(true);
      setError('');
      try {
        const kit = await getKit(schoolId, kitId);
        if (cancelled || !kit) return;

        setKitName(kit.name || '');
        setClassGrade(kit.classGrade || '');
        setCategory(kit.category || '');
        // create() joins description and includes with a blank line; split it back apart
        const [desc = '', inc = ''] = String(kit.description || '').split('\n\n');
        setDescription(desc);
        setIncludes(inc);
        setSellingPrice(kit.pricePaise ? String(Math.round(kit.pricePaise / 100)) : '');
        setMrp(kit.mrpPaise ? String(Math.round(kit.mrpPaise / 100)) : '');
        setKitStatus(kit.status || 'active');
        if (typeof kit.showOnApp === 'boolean') setShowOnApp(kit.showOnApp);
        if (typeof kit.availableOnline === 'boolean') setAvailableOnline(kit.availableOnline);
        if (typeof kit.allowPreorders === 'boolean') setAllowPreorders(kit.allowPreorders);

        setItems(
          (kit.items || []).map((item) => {
            // productId arrives populated on read but is a plain id on write
            const product = item.productId && typeof item.productId === 'object' ? item.productId : null;
            const id = product?._id || item.productId;
            return {
              id,
              productId: id,
              name: product?.name || 'Product',
              detail: product?.brand || 'Catalog product',
              pricePaise: product?.pricePaise || 0,
              qty: item.qty || 1,
              unit: 'Pcs',
            };
          })
        );
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load this kit'));
      } finally {
        if (!cancelled) setLoadingKit(false);
      }
    })();

    return () => { cancelled = true; };
  }, [schoolId, kitId]);

  const costPrice = items.reduce(
    (sum, item) => sum + item.qty * ((item.pricePaise || 0) / 100),
    0
  );
  const parsedSelling = parseInt(sellingPrice) || 0;
  const profit = parsedSelling > 0 ? parsedSelling - costPrice : 0;

  const handleBack = () => {
    navigate('/school/admin');
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    if (!selectedProductToAdd) {
      setError('Please select a product from the list.');
      return;
    }
    const available = catalogProducts.find(
      (p) => String(p._id || p.id) === String(selectedProductToAdd)
    );
    if (!available) {
      setError('Selected product is invalid or not found.');
      return;
    }
    if (items.some((item) => String(item.productId) === String(available._id || available.id))) {
      setError('This product is already added to this kit.');
      return;
    }
    setError('');
    setItems([
      ...items,
      {
        id: available._id || available.id,
        productId: available._id || available.id,
        name: available.name || available.title || 'Product',
        detail: available.brand || 'Catalog product',
        pricePaise: available.pricePaise || 0,
        qty: 1,
        unit: 'Pcs',
      },
    ]);
    setSelectedProductToAdd('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleCreateKit = async (overrideStatus) => {
    setError('');
    if (!kitName.trim()) {
      setError('Kit name is required.');
      return;
    }
    if (!items.length) {
      setError('Add at least one product to the kit.');
      return;
    }
    if (!schoolId) {
      setError('School context is missing. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      let imageId = undefined;
      if (imageFile) {
        const attachment = await uploadSchoolFile(schoolId, imageFile, 'kit_image');
        imageId = attachment?._id || attachment?.id;
      }

      const finalStatus = overrideStatus === 'active' || overrideStatus === 'draft' ? overrideStatus : kitStatus;

      const payload = {
        name: kitName.trim(),
        classGrade: classGrade || undefined,
        category: category || undefined,
        description: [description.trim(), includes.trim()].filter(Boolean).join('\n\n') || undefined,
        // Left undefined when no new file was picked, so editing does not clear the existing image
        imageId,
        items: items.map((item) => ({ productId: item.productId, qty: item.qty })),
        pricePaise: parsedSelling > 0 ? Math.round(parsedSelling * 100) : undefined,
        mrpPaise: parseInt(mrp) > 0 ? Math.round(parseInt(mrp) * 100) : undefined,
        status: finalStatus,
        showOnApp,
        availableOnline,
        allowPreorders,
      };

      if (isEditing) await updateKit(schoolId, kitId, payload);
      else await createKit(schoolId, payload);

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        navigate('/school/kits');
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err, isEditing ? 'Unable to update kit' : 'Unable to create kit'));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-48 font-outfit relative">
      {/* Top Banner Success Notification */}
      {isSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md animate-in fade-in zoom-in slide-in-from-top-2 duration-300">
          <div className="bg-emerald-500 text-white px-5 py-4 rounded-3xl shadow-xl flex items-center gap-3.5 border border-emerald-400/20">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Check size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xs font-black block leading-none">
                {isEditing ? 'Kit Updated Successfully!' : 'Kit Created Successfully!'}
              </span>
              <span className="text-[10px] text-emerald-100 font-bold block mt-1">
                {isEditing ? 'Changes are live for parents.' : 'Ready for parent procurement.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Styled Top Banner Header Area */}
      <div className="bg-[#3b2d7d] text-white px-6 py-6 sticky top-0 z-50 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={handleBack}
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-xl font-black leading-tight">{isEditing ? 'Edit Kit' : 'Create New Kit'}</h1>
              <span className="text-[12px] text-purple-200 font-bold block mt-1">
                {isEditing ? (loadingKit ? 'Loading kit…' : 'Update this student kit') : 'Create a student kit'}
              </span>
            </div>
          </div>
          <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 text-white/95">
            <HelpCircle size={22} />
          </button>
        </div>

        {/* Stepper Progress Bar Strip */}
        <div className="flex items-center justify-between mt-7 px-2">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shadow-md">
              <Package size={16} />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Basic Info</span>
          </div>

          <div className="h-0.5 flex-1 bg-white/20 mx-3 -mt-5" />

          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shadow-md">
              <span className="text-[12px] font-black">2</span>
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Add Items</span>
          </div>

          <div className="h-0.5 flex-1 bg-white/20 mx-3 -mt-5" />

          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shadow-md">
              <span className="text-[12px] font-black">₹</span>
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Pricing & Stock</span>
          </div>
        </div>
      </div>

      {/* Form Content Area */}
      <div className="px-6 py-6 space-y-6">
        
        {/* Step 1: Basic Information */}
        <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-full bg-primary text-white text-[12px] font-black flex items-center justify-center shadow-md">
              1
            </div>
            <h3 className="text-sm font-black text-deep-purple uppercase tracking-wider">
              Basic Information
            </h3>
          </div>

          {/* Kit Name */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider">
                Kit Name <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-gray-400 font-bold">
                {kitName.length}/100
              </span>
            </div>
            <input 
              type="text"
              value={kitName}
              onChange={(e) => setKitName(e.target.value.slice(0, 100))}
              placeholder="Enter kit name"
              className="w-full px-4.5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-300 leading-relaxed"
            />
          </div>

          {/* Select Class/Grade */}
          <div className="space-y-2">
            <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider">
              Select Class / Grade <span className="text-red-500">*</span>
            </label>
            <select 
              value={classGrade}
              onChange={(e) => setClassGrade(e.target.value)}
              className="w-full px-4.5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer leading-relaxed"
            >
              <option value="">Select class or grade</option>
              {classesList.map(c => (
                <option key={c.classGrade} value={c.classGrade}>{c.classGrade}</option>
              ))}
            </select>
          </div>

          {/* Kit Category */}
          <div className="space-y-2">
            <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider">
              Kit Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package size={18} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-450" />
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-12 pr-4.5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer leading-relaxed"
              >
                <option value="">Select category</option>
                <option value="books">Textbooks & Notebooks</option>
                <option value="uniforms">School Uniforms</option>
                <option value="stationery">Stationery Packs</option>
              </select>
            </div>
          </div>

          {/* Kit Description */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider">Kit Description</label>
              <span className="text-[11px] text-gray-400 font-bold">
                {description.length}/300
              </span>
            </div>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              placeholder="Enter kit description..."
              rows={3}
              className="w-full px-4.5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-300 resize-none leading-relaxed"
            />
          </div>

          {/* Kit Image & Kit Includes Block */}
          <div className="grid grid-cols-2 gap-4 pt-1.5">
            <div className="space-y-2">
              <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider">
                Kit Image <span className="text-red-500">*</span>
              </label>
              <div className="border border-dashed border-gray-250 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative bg-gray-50/20 h-32 overflow-hidden">
                <input 
                  type="file" 
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                />
                {imageFile ? (
                  <>
                    <img 
                      src={URL.createObjectURL(imageFile)} 
                      alt="Kit Preview" 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-20">
                      <span className="text-white text-[10px] font-black uppercase tracking-wider">Change Image</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={18} className="text-primary mb-2" />
                    <span className="text-[11px] font-black text-deep-purple block leading-tight truncate w-full px-2">
                      Upload image
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold block mt-1">JPG, PNG (Max 2MB)</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider">Kit Includes</label>
              <textarea 
                value={includes}
                onChange={(e) => setIncludes(e.target.value)}
                placeholder="e.g., Books, Notebooks, Stationery"
                className="w-full px-4.5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-300 resize-none h-32 leading-relaxed"
              />
              <span className="text-[9px] text-gray-400 font-bold block mt-1">Enter key highlights of this kit</span>
            </div>
          </div>
        </div>

        {/* Step 2: Add Items to Kit */}
        <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-[12px] font-black flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="text-sm font-black text-deep-purple uppercase tracking-wider">
                Add Items to Kit
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={selectedProductToAdd}
                onChange={(e) => setSelectedProductToAdd(e.target.value)}
                className="px-3 py-2 border border-gray-250 rounded-xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 max-w-[160px] bg-white cursor-pointer"
              >
                <option value="">Select a product</option>
                {catalogProducts.map(p => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.name || p.title || 'Product'}
                  </option>
                ))}
              </select>
              <button 
                type="button"
                onClick={handleAddItem}
                className="px-3.5 py-2.5 bg-[#3b2d7d] text-white hover:bg-[#2b2061] rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 transition-all shadow-sm shrink-0"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
          </div>

          {/* List of active added items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex items-center justify-between gap-4 hover:bg-gray-100/40 transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-primary shrink-0 font-bold text-sm shadow-inner">
                    📝
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-deep-purple block truncate leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold block mt-1">
                      {item.detail} • ₹{((item.pricePaise || 0) / 100).toFixed(2)} / unit
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Quantity Control Buttons */}
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setItems(items.map(it => it.id === item.id ? { ...it, qty: Math.max(1, it.qty - 1) } : it));
                      }}
                      className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-black text-gray-500 hover:bg-gray-100 active:scale-90 transition-transform"
                    >
                      -
                    </button>
                    <span className="text-xs font-black text-deep-purple w-6 text-center">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setItems(items.map(it => it.id === item.id ? { ...it, qty: it.qty + 1 } : it));
                      }}
                      className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-black text-gray-500 hover:bg-gray-100 active:scale-90 transition-transform"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right shrink-0 min-w-[50px]">
                    <span className="text-xs font-black text-deep-purple block leading-none">
                      ₹{(((item.pricePaise || 0) * item.qty) / 100).toFixed(0)}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold block mt-1">
                      Subtotal
                    </span>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="w-9 h-9 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-550 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Information footer warning banner */}
          <div className="bg-purple-50/40 rounded-2xl p-4 flex items-start gap-3">
            <Info size={16} className="text-primary mt-0.5 shrink-0" />
            <p className="text-[10.5px] text-gray-450 font-semibold leading-relaxed">
              You can add up to 50 items in a kit.
            </p>
          </div>
        </div>

        {/* Step 3: Expandable Pricing & Stock */}
        <div className="bg-white border border-gray-200/80 rounded-[2.2rem] shadow-sm overflow-hidden transition-all">
          <div 
            onClick={() => setStep3Open(!step3Open)}
            className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50/30 transition-all select-none border-b border-gray-150/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-[12px] font-black flex items-center justify-center shadow-md">
                3
              </div>
              <div>
                <span className="text-sm font-black text-deep-purple block leading-none">Pricing & Stock</span>
                <span className="text-[10px] text-gray-400 font-bold block mt-1.5">Set price, stock and availability</span>
              </div>
            </div>
            {step3Open ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
          </div>

          {step3Open && (
            <div className="p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Selling Price & MRP */}
              <div className="grid grid-cols-2 gap-4.5">
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                    Selling Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xs font-black text-gray-400">₹</span>
                    <input 
                      type="number"
                      placeholder="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors leading-relaxed placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider flex items-center justify-between">
                    <span>MRP</span>
                    <Info size={12} className="text-gray-400" />
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xs font-black text-gray-400">₹</span>
                    <input 
                      type="number"
                      placeholder="0"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      className="w-full pl-8 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors leading-relaxed placeholder:text-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Available Quantity & SKU */}
              <div className="grid grid-cols-2 gap-4.5">
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                    Available Stock <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="number"
                      placeholder="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full pl-4 pr-14 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors leading-relaxed placeholder:text-gray-300"
                    />
                    <span className="absolute right-3 px-2 py-0.5 bg-purple-50 text-[9.5px] font-black text-primary rounded-lg border border-purple-100 leading-none">
                      Kits
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                    SKU <span className="text-gray-400 font-bold text-[9px] lowercase">(optional)</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. CLASS5-KIT-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-4.5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors leading-relaxed placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Kit Status & Display Settings */}
              <div className="space-y-6 pt-3">
                {/* Kit Status Segmented Control */}
                <div className="space-y-2.5">
                  <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                    Kit Status
                  </label>
                  <div className="bg-gray-100/80 p-1.5 rounded-2xl flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setKitStatus('active')}
                      className={`flex-1 py-3 text-xs font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                        kitStatus === 'active'
                          ? 'bg-white text-primary shadow-sm scale-[1.01]'
                          : 'text-gray-450 hover:text-gray-600'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${kitStatus === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-gray-300'}`}></span>
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setKitStatus('draft')}
                      className={`flex-1 py-3 text-xs font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                        kitStatus === 'draft'
                          ? 'bg-white text-gray-700 shadow-sm scale-[1.01]'
                          : 'text-gray-455 hover:text-gray-600'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${kitStatus === 'draft' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-gray-300'}`}></span>
                      Draft
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-450 font-bold px-1 flex items-start gap-1.5 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100/80">
                    <Info size={13} className="text-gray-400 mt-0.5 shrink-0" />
                    <span>
                      {kitStatus === 'active'
                        ? 'Active kits are visible to parents on the store and open for ordering immediately.'
                        : 'Draft kits are hidden from parents and saved for later adjustments.'}
                    </span>
                  </p>
                </div>

                {/* Display & Availability Toggles */}
                <div className="space-y-2.5">
                  <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                    Display & Availability
                  </label>
                  <div className="bg-white border border-gray-150 rounded-[2rem] divide-y divide-gray-100 overflow-hidden shadow-sm">
                    {/* Toggle 1 */}
                    <div 
                      onClick={() => setShowOnApp(!showOnApp)}
                      className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/20 active:bg-gray-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-primary flex items-center justify-center shrink-0">
                          <Layers size={18} />
                        </div>
                        <div>
                          <span className="text-xs font-black text-deep-purple block leading-none">Show on Parent App</span>
                          <span className="text-[10px] text-gray-400 font-bold block mt-1.5 leading-none">Visible to parents in the store</span>
                        </div>
                      </div>
                      <div className="relative shrink-0 w-11 h-6">
                        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${showOnApp ? 'bg-primary' : 'bg-gray-250'}`} />
                        <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-sm ${showOnApp ? 'left-[23px]' : 'left-[3px]'}`} />
                      </div>
                    </div>

                    {/* Toggle 2 */}
                    <div 
                      onClick={() => setAvailableOnline(!availableOnline)}
                      className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/20 active:bg-gray-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                          <Package size={18} />
                        </div>
                        <div>
                          <span className="text-xs font-black text-deep-purple block leading-none">Available for Online Ordering</span>
                          <span className="text-[10px] text-gray-400 font-bold block mt-1.5 leading-none">Parents can order this kit online</span>
                        </div>
                      </div>
                      <div className="relative shrink-0 w-11 h-6">
                        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${availableOnline ? 'bg-primary' : 'bg-gray-250'}`} />
                        <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-sm ${availableOnline ? 'left-[23px]' : 'left-[3px]'}`} />
                      </div>
                    </div>

                    {/* Toggle 3 */}
                    <div 
                      onClick={() => setAllowPreorders(!allowPreorders)}
                      className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/20 active:bg-gray-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <span className="text-xs font-black text-deep-purple block leading-none">Allow Pre-orders</span>
                          <span className="text-[10px] text-gray-400 font-bold block mt-1.5 leading-none">Parents can place pre-orders</span>
                        </div>
                      </div>
                      <div className="relative shrink-0 w-11 h-6">
                        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${allowPreorders ? 'bg-primary' : 'bg-gray-250'}`} />
                        <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-sm ${allowPreorders ? 'left-[23px]' : 'left-[3px]'}`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Profit Calculator Box Card */}
                <div className="bg-[#f4fbf7] border border-[#e2f5eb] rounded-3xl p-5 flex items-center justify-between gap-4 mt-5 shadow-inner">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#e2f5eb] text-emerald-500 flex items-center justify-center shrink-0">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-450 font-black block leading-normal uppercase tracking-wider">Cost Price</span>
                      <span className="text-[15px] font-black text-deep-purple block mt-1 leading-normal">₹{costPrice}</span>
                    </div>
                  </div>

                  <div className="h-9 w-px bg-emerald-100/80" />

                  <div>
                    <span className="text-[10px] text-gray-450 font-black block leading-normal uppercase tracking-wider">Selling Price</span>
                    <span className="text-[15px] font-black text-deep-purple block mt-1 leading-normal">₹{parsedSelling}</span>
                  </div>

                  <div className="h-9 w-px bg-emerald-100/80" />

                  <div className="text-right">
                    <span className="text-[10px] text-gray-455 font-black block leading-normal uppercase tracking-wider">Profit per Kit</span>
                    <span className={`text-[15px] font-black block mt-1 leading-normal ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {profit >= 0 ? `+₹${profit}` : `-₹${Math.abs(profit)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Actions Footer Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 bg-white/90 backdrop-blur-md p-5 flex flex-col gap-3.5 z-50 max-w-md mx-auto shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.06)]">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold px-4 py-2.5 rounded-2xl">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleCreateKit('draft')}
            disabled={saving}
            className="flex-1 py-4 border-2 border-gray-300 text-gray-750 rounded-2xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-gray-50 disabled:opacity-60 uppercase tracking-wider"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleCreateKit('active')}
            disabled={saving || loadingKit}
            className="flex-1 py-4 bg-[#3b2d7d] text-white rounded-2xl text-xs font-black shadow-lg shadow-purple-100 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-[#2b2061] disabled:opacity-60 uppercase tracking-wider"
          >
            <Sparkles size={14} />
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Kit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolCreateKit;
