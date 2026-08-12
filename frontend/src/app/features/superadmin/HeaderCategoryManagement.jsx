import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Search, Edit, Trash2, X, ChevronRight, Upload,
  ShoppingBag, HelpCircle, Utensils, Home as HomeIcon, Baby, Heart, ShieldAlert, Loader2, Camera
} from 'lucide-react';
import { listHeaderCategories, createHeaderCategory, updateHeaderCategory, deleteHeaderCategory } from '../../../services/catalogApi';
import { uploadAdminFile } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { toAbsoluteUrl } from '../../../utils/url';
import { mapHeaderCategoryForAdmin } from '../../../utils/mappers/categoryAdminMapper';

const HeaderCategoryManagement = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHeaderId, setEditingHeaderId] = useState(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCommission, setFormCommission] = useState('0');
  const [formFees, setFormFees] = useState('0');
  const [formStatus, setFormStatus] = useState('active');
  // `formImage` is the already-uploaded path shown as a preview (from an
  // earlier save, on edit) — never a hand-typed external URL. `formImageFile`
  // is a newly chosen file, uploaded to local disk on submit.
  const [formImage, setFormImage] = useState('');
  const [formImageFile, setFormImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const headerFileInputRef = useRef(null);
  // Shared across both the Add and Edit modals — they're never open at once.
  const headerCameraInputRef = useRef(null);

  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHeaders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listHeaderCategories({ limit: 100 });
      setHeaders((data || []).map(mapHeaderCategoryForAdmin));
    } catch (err) {
      setHeaders([]);
      setError(getErrorMessage(err, 'Unable to load header categories'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHeaders();
  }, [loadHeaders]);

  // Handle name input changes to automatically suggest slug
  const handleNameChange = (val, isEdit = false) => {
    setFormName(val);
    const suggestedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormSlug(suggestedSlug);
  };

  // A chosen file is only uploaded (to local disk, via the admin uploads
  // endpoint) at submit time — never a hand-typed URL, so every header image
  // is guaranteed to live under UPLOADS_DIR.
  const resolveImageUrl = async () => {
    if (!formImageFile) return formImage || undefined;
    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append('file', formImageFile);
      data.append('purpose', 'header_image');
      const attachment = await uploadAdminFile(data);
      return attachment?.url || formImage || undefined;
    } finally {
      setUploadingImage(false);
    }
  };

  // Add Action Handler
  const handleAddHeader = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setLoading(true);
      const imageUrl = await resolveImageUrl();
      await createHeaderCategory({
        name: formName,
        commissionPercent: parseFloat(formCommission) || 0,
        feesFlatPaise: Math.round(parseFloat(formFees) * 100) || 0,
        status: formStatus,
        imageUrl,
      });
      resetForm();
      setIsAddModalOpen(false);
      await loadHeaders();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to create header category'));
    } finally {
      setLoading(false);
    }
  };

  // Open Edit pre-populating attributes
  const openEditModal = (headerItem) => {
    setEditingHeaderId(headerItem.id || headerItem.mongoId);
    setFormName(headerItem.name || '');
    setFormSlug(headerItem.slug || '');
    setFormCommission(
      typeof headerItem.commission === 'string'
        ? headerItem.commission.replace('%', '')
        : String(headerItem.commissionPercent ?? 0)
    );
    setFormFees(
      typeof headerItem.fees === 'string'
        ? headerItem.fees.replace('₹', '')
        : String((headerItem.feesFlatPaise ?? 0) / 100)
    );
    setFormStatus(headerItem.status === 'Active' ? 'active' : 'inactive');
    setFormImage(headerItem.imageUrl || '');
    setFormImageFile(null);
    setIsEditModalOpen(true);
  };

  // Edit Update Action Handler
  const handleUpdateHeader = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !editingHeaderId) return;

    try {
      setLoading(true);
      const imageUrl = await resolveImageUrl();
      await updateHeaderCategory(editingHeaderId, {
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        commissionPercent: parseFloat(formCommission) || 0,
        feesFlatPaise: Math.round(parseFloat(formFees) * 100) || 0,
        status: formStatus,
        imageUrl,
      });
      resetForm();
      setIsEditModalOpen(false);
      await loadHeaders();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to update header category'));
    } finally {
      setLoading(false);
    }
  };

  // Delete Action Handler
  const handleDeleteHeader = async (id) => {
    if (confirm('Are you sure you want to delete this header category?')) {
      try {
        setLoading(true);
        await deleteHeaderCategory(id);
        await loadHeaders();
      } catch (err) {
        alert(getErrorMessage(err, 'Unable to delete header category'));
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormCommission('0');
    setFormFees('0');
    setFormStatus('active');
    setFormImage('');
    setFormImageFile(null);
    setEditingHeaderId(null);
  };

  // Filtered headers by search input box query
  const filteredHeaders = headers.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Renders matching lucide vectors as in user screenshot
  const iconForType = (imageType) => {
    switch (imageType) {
      case 'all':
        return <ShoppingBag className="text-indigo-600 stroke-[2] w-5 h-5" />;
      case 'grocery':
        return <Utensils className="text-amber-600 stroke-[2] w-5 h-5" />;
      case 'kitchen':
        return <HomeIcon className="text-teal-600 stroke-[2] w-5 h-5" />;
      case 'kids':
        return <Baby className="text-pink-600 stroke-[2] w-5 h-5" />;
      case 'pet':
        return <Heart className="text-red-500 stroke-[2] w-5 h-5" />;
      case 'sports':
        return <HelpCircle className="text-sky-600 stroke-[2] w-5 h-5" />;
      default:
        return <ShoppingBag className="text-gray-400 stroke-[2] w-5 h-5" />;
    }
  };

  // A failed local file (deleted/moved) falls back to the generic icon
  // above — never a third-party placeholder image.
  const renderHeaderIcon = (item) => <HeaderIcon item={item} fallback={iconForType(item.imageType)} />;

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Header Categories</h1>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Manage top-level categories</p>
        </div>
        
        {/* + Add New Header Button */}
        <button 
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="bg-black hover:bg-gray-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
        >
          <Plus size={14} className="stroke-[3]" />
          <span>Add New Header</span>
        </button>
      </div>

      {/* 2. DATATABLE MAIN CARD */}
      <div className="bg-white rounded-[1.25rem] border border-gray-250/60 shadow-sm p-6">
        
        {/* Search bar input container */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search header categories..." 
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-gray-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Flat data list layout */}
        <div className="overflow-x-auto border border-gray-200/80 rounded-2xl shadow-inner bg-[#FCFDFE]">
          <table className="w-full text-left text-xs font-semibold text-gray-600 border-collapse select-none">
            <thead>
              <tr className="border-b border-gray-250 bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                <th className="py-4 px-4 w-12 text-center">
                  <input type="checkbox" className="rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5" readOnly />
                </th>
                <th className="py-4 px-4">Image</th>
                <th className="py-4 px-4">Name</th>
                <th className="py-4 px-4">Slug</th>
                <th className="py-4 px-4">Comm (%)</th>
                <th className="py-4 px-4">Fees (₹)</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredHeaders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-xs font-black text-gray-400">
                    No matching header category records found.
                  </td>
                </tr>
              ) : (
                filteredHeaders.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 text-center">
                      <input type="checkbox" className="rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5" readOnly />
                    </td>
                    <td className="py-4 px-4">
                      {/* Image icon avatar container */}
                      <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-150 bg-gray-50 flex items-center justify-center">
                        {renderHeaderIcon(item)}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-black text-gray-900 text-sm tracking-tight">{item.name}</td>
                    <td className="py-4 px-4 font-medium text-gray-400">{item.slug}</td>
                    <td className="py-4 px-4 font-bold text-gray-800">{item.commission}</td>
                    <td className="py-4 px-4 font-bold text-gray-800">{item.fees}</td>
                    <td className="py-4 px-4">
                      {/* Active Status Badge */}
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100/75 text-[9px] font-black uppercase tracking-wider">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right pr-6">
                      <div className="flex items-center gap-1 ml-auto justify-end">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition-all shrink-0"
                        >
                          <Edit size={13} className="stroke-[2.5]" />
                        </button>
                        <button 
                          onClick={() => handleDeleteHeader(item.id)}
                          className="p-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-all shrink-0"
                        >
                          <Trash2 size={13} className="stroke-[2.5]" />
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

      {/* 3. ADD NEW HEADER MODAL PORTAL */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden animate-slide-up flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white px-6 shrink-0">
              <h3 className="text-base font-black text-[#0B1528]">Add New Header</h3>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddHeader} className="p-6 space-y-4 text-left overflow-y-auto max-h-[75vh]">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 block">Header Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value, false)}
                  placeholder="e.g. Grocery, Pet Supplies" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 block">Slug</label>
                <input 
                  type="text" 
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="suggested-slug" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-700 block">Commission (%)</label>
                  <input 
                    type="text" 
                    value={formCommission}
                    onChange={(e) => setFormCommission(e.target.value)}
                    placeholder="e.g. 10" 
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-700 block">Fixed Fees (₹)</label>
                  <input 
                    type="number" 
                    value={formFees}
                    onChange={(e) => setFormFees(e.target.value)}
                    placeholder="e.g. 0" 
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 block">Status</label>
                <select 
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 block">Header Image</label>
                <input
                  type="file"
                  ref={headerFileInputRef}
                  onChange={(e) => setFormImageFile(e.target.files?.[0] || null)}
                  accept=".png,.jpg,.jpeg,.webp"
                  className="hidden"
                />
                {/* capture="environment" opens the device's camera app directly
                    on mobile; desktop browsers that don't support it fall back
                    to the normal file picker, same as the input above. */}
                <input
                  type="file"
                  ref={headerCameraInputRef}
                  onChange={(e) => setFormImageFile(e.target.files?.[0] || null)}
                  accept=".png,.jpg,.jpeg,.webp"
                  capture="environment"
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center gap-3 bg-gray-50/50">
                  {formImageFile ? (
                    <img src={URL.createObjectURL(formImageFile)} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0" />
                  ) : formImage ? (
                    <img src={toAbsoluteUrl(formImage)} alt="Current" className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0" />
                  ) : (
                    <Upload size={18} className="text-gray-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-gray-500 block truncate">
                      {uploadingImage
                        ? 'Uploading…'
                        : formImageFile ? formImageFile.name : formImage ? 'Current image' : 'No image selected'}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => headerCameraInputRef.current?.click()}
                        className="text-[10px] font-black text-[#3b2d7d] hover:underline flex items-center gap-1"
                      >
                        <Camera size={11} /> Take Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => headerFileInputRef.current?.click()}
                        className="text-[10px] font-black text-[#3b2d7d] hover:underline flex items-center gap-1"
                      >
                        <Upload size={11} /> Choose File
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-150 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#0B1528] hover:bg-gray-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-950/10"
                >
                  Save Header
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

      {/* 4. EDIT EXISTING HEADER MODAL PORTAL */}
      {isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden animate-slide-up flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white px-6 shrink-0">
              <h3 className="text-base font-black text-[#0B1528]">Edit Header Category</h3>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateHeader} className="p-6 space-y-4 text-left overflow-y-auto max-h-[75vh]">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 block">Header Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value, true)}
                  placeholder="e.g. Grocery, Pet Supplies" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 block">Slug</label>
                <input 
                  type="text" 
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="suggested-slug" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-700 block">Commission (%)</label>
                  <input 
                    type="text" 
                    value={formCommission}
                    onChange={(e) => setFormCommission(e.target.value)}
                    placeholder="e.g. 10" 
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-700 block">Fixed Fees (₹)</label>
                  <input 
                    type="number" 
                    value={formFees}
                    onChange={(e) => setFormFees(e.target.value)}
                    placeholder="e.g. 0" 
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 block">Status</label>
                <select 
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 block">Header Image</label>
                <input
                  type="file"
                  ref={headerFileInputRef}
                  onChange={(e) => setFormImageFile(e.target.files?.[0] || null)}
                  accept=".png,.jpg,.jpeg,.webp"
                  className="hidden"
                />
                {/* capture="environment" opens the device's camera app directly
                    on mobile; desktop browsers that don't support it fall back
                    to the normal file picker, same as the input above. */}
                <input
                  type="file"
                  ref={headerCameraInputRef}
                  onChange={(e) => setFormImageFile(e.target.files?.[0] || null)}
                  accept=".png,.jpg,.jpeg,.webp"
                  capture="environment"
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center gap-3 bg-gray-50/50">
                  {formImageFile ? (
                    <img src={URL.createObjectURL(formImageFile)} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0" />
                  ) : formImage ? (
                    <img src={toAbsoluteUrl(formImage)} alt="Current" className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0" />
                  ) : (
                    <Upload size={18} className="text-gray-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-gray-500 block truncate">
                      {uploadingImage
                        ? 'Uploading…'
                        : formImageFile ? formImageFile.name : formImage ? 'Current image' : 'No image selected'}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => headerCameraInputRef.current?.click()}
                        className="text-[10px] font-black text-[#3b2d7d] hover:underline flex items-center gap-1"
                      >
                        <Camera size={11} /> Take Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => headerFileInputRef.current?.click()}
                        className="text-[10px] font-black text-[#3b2d7d] hover:underline flex items-center gap-1"
                      >
                        <Upload size={11} /> Choose File
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-150 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#0B1528] hover:bg-gray-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-950/10"
                >
                  Update Header
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

// Module scope so identity stays stable across re-renders. Swaps to the
// lucide fallback icon on a broken image instead of a third-party
// placeholder — a deleted/moved local file just shows the generic icon.
const HeaderIcon = ({ item, fallback }) => {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [item.image]);

  if (!item.image || broken) return fallback;
  return (
    <img
      src={item.image}
      alt={item.name}
      className="w-full h-full object-cover rounded-lg"
      onError={() => setBroken(true)}
    />
  );
};

export default HeaderCategoryManagement;
