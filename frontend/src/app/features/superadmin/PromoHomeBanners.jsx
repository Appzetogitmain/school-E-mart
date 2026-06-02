import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  Plus, Edit3, Trash2, X, Upload, Image as ImageIcon, CheckCircle, ChevronRight, Link as LinkIcon, Tag, Trash 
} from 'lucide-react';

const PromoHomeBanners = () => {
  // Pre-loaded active home banners matching your exact screenshot, populated with target categories
  const [banners, setBanners] = useState([
    {
      id: 1,
      slug: 'healthy_delight',
      category: 'Kits',
      orderRank: 0,
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
      targetUrl: 'https://schoolemart.com/categories/healthy-dairy',
      status: 'Active'
    },
    {
      id: 2,
      slug: 'healthy_delight',
      category: 'Uniforms',
      orderRank: 0,
      imageUrl: 'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=600&q=80',
      targetUrl: 'https://schoolemart.com/categories/milk-farm',
      status: 'Active'
    },
    {
      id: 3,
      slug: 'healthy_delight',
      category: 'Kits',
      orderRank: 1, // Multiple banners for one category (Kits has rank 0 and rank 1!)
      imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80',
      targetUrl: 'https://schoolemart.com/categories/wild-honey',
      status: 'Active'
    }
  ]);

  // Categories list matching user app tags
  const categories = ['All', 'Kits', 'Uniforms', 'Stationery', 'Activities'];

  // Modal active states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form Fields
  const [bannerSlug, setBannerSlug] = useState('');
  const [targetCategory, setTargetCategory] = useState('Kits');
  const [orderRank, setOrderRank] = useState('0');
  const [targetUrl, setTargetUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Upload state: Array of objects representing uploaded images
  // Each object: { id, file, previewUrl }
  const [uploadedImages, setUploadedImages] = useState([]);
  
  // Ref for hidden input
  const fileInputRef = useRef(null);

  // Handle batch file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = files.map((file, index) => ({
        id: Date.now() + index + Math.random(),
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  // Remove a single image from the upload batch
  const handleRemoveUploadedImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  // Open modal for fresh entry
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setBannerSlug('');
    setTargetCategory('Kits');
    setOrderRank('0');
    setTargetUrl('');
    setIsActive(true);
    setUploadedImages([]); // Reset batch list
    setIsModalOpen(true);
  };

  // Open modal for editing existing banner details
  const handleOpenEditModal = (banner) => {
    setIsEditing(true);
    setEditId(banner.id);
    setBannerSlug(banner.slug);
    setTargetCategory(banner.category || 'Kits');
    setOrderRank(banner.orderRank.toString());
    setTargetUrl(banner.targetUrl);
    setIsActive(banner.status === 'Active');
    
    // Set current image as the single item in batch
    setUploadedImages([
      {
        id: banner.id,
        file: null,
        previewUrl: banner.imageUrl
      }
    ]);
    setIsModalOpen(true);
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!bannerSlug.trim()) {
      alert('Please enter a Banner Slug or Identifier.');
      return;
    }

    if (uploadedImages.length === 0) {
      alert('Please select or upload at least one Banner Image.');
      return;
    }

    if (isEditing) {
      // Edit Update mode (Updates the single banner)
      const finalImage = uploadedImages[0].previewUrl;
      setBanners(prev => prev.map(b => {
        if (b.id === editId) {
          return {
            ...b,
            slug: bannerSlug.trim().toLowerCase().replace(/\s+/g, '_'),
            category: targetCategory,
            orderRank: parseInt(orderRank) || 0,
            imageUrl: finalImage,
            targetUrl: targetUrl.trim() || '#',
            status: isActive ? 'Active' : 'Draft'
          };
        }
        return b;
      }));
      alert('Promotional banner updated successfully!');
    } else {
      // Add New mode (Supports batch adding multiple banners!)
      const startRank = parseInt(orderRank) || 0;
      const newBannersList = uploadedImages.map((img, idx) => ({
        id: Date.now() + idx + Math.random(),
        slug: bannerSlug.trim().toLowerCase().replace(/\s+/g, '_'),
        category: targetCategory,
        orderRank: startRank + idx, // Auto-increment sequence ranks cleanly!
        imageUrl: img.previewUrl,
        targetUrl: targetUrl.trim() || '#',
        status: isActive ? 'Active' : 'Draft'
      }));

      setBanners(prev => [...prev, ...newBannersList]);
      alert(`Successfully uploaded ${newBannersList.length} promotional banners for category "${targetCategory}"!`);
    }

    setIsModalOpen(false);
  };

  // Deletion trigger
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this promotional banner?')) {
      setBanners(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Home Banners Hub</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              BATCH ENGINE
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Manage promotional banners for the homepage carousel. Select multiple files to upload in batches!</p>
        </div>

        {/* Add banner trigger */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 bg-[#0B1528] hover:bg-[#15253F] text-white text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all shadow-xs"
        >
          <Plus size={14} className="stroke-[3]" />
          Add New Banner
        </button>
      </div>

      {/* BANNERS CATALOG GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((b) => (
          <div 
            key={b.id}
            className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-150 transition-all flex flex-col group"
          >
            
            {/* Visual banner preview viewport with floating circular tools */}
            <div className="relative aspect-[16/9] w-full bg-gray-100 overflow-hidden select-none">
              <img
                src={b.imageUrl}
                alt={b.slug}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />

              {/* Category tag overlay on top left */}
              <div className="absolute top-3 left-3 flex gap-1.5 select-none">
                <span className="bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow border border-white/10">
                  {b.category || 'All'}
                </span>
                
                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                  b.status === 'Active' 
                    ? 'bg-emerald-500 text-white border-transparent' 
                    : 'bg-yellow-500 text-white border-transparent'
                }`}>
                  {b.status}
                </span>
              </div>

              {/* Absolute circular floating Edit / Delete overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(b)}
                  className="bg-white hover:bg-indigo-50 border border-gray-150 text-gray-700 hover:text-indigo-600 p-2 rounded-full shadow transition-colors cursor-pointer"
                  title="Edit Banner"
                >
                  <Edit3 size={12} className="stroke-[2.5]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="bg-white hover:bg-rose-50 border border-gray-150 text-gray-700 hover:text-rose-600 p-2 rounded-full shadow transition-colors cursor-pointer"
                  title="Delete Banner"
                >
                  <Trash2 size={12} className="stroke-[2.5]" />
                </button>

              </div>

            </div>

            {/* Bottom details block (exactly matching mockup details layout) */}
            <div className="p-4 bg-white flex items-center justify-between border-t border-gray-50 text-left select-none">
              
              <div>
                <h4 className="text-xs font-black text-gray-900 tracking-tight select-text">
                  {b.slug}
                </h4>
                <span className="block text-[8px] text-gray-400 font-extrabold mt-1 select-text">
                  Category: <span className="text-indigo-600 uppercase font-black">{b.category || 'All'}</span>
                </span>
              </div>

              {/* Order index details */}
              <div className="text-right">
                <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">ORDER</span>
                <span className="block text-xs font-black text-gray-800 tabular-nums mt-0.5">
                  #{b.orderRank}
                </span>
              </div>

            </div>

          </div>
        ))}
      </div>

      {/* FLOATING ADD / EDIT BANNER MODAL PORTAL */}
      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
          
          <div className="bg-white w-full max-w-[460px] rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">
                {isEditing ? 'Update Carousel Banner' : 'Batch Upload Carousel Banners'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-gray-700">
              
              {/* IMAGE MULTIPLE FILE UPLOAD ZONE */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">
                  Banner Cover Image(s) *
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple={!isEditing} // Allow multiple images only in "Add" mode
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Clickable Uploader Box */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all border-gray-250 hover:bg-gray-50/70 bg-white"
                >
                  <div className="flex flex-col items-center gap-1.5 select-none">
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-gray-700 font-black">
                      {isEditing ? 'Choose replacement banner image' : 'Choose / select multiple banner files'}
                    </span>
                    <span className="text-[8px] text-gray-400">
                      {isEditing ? 'Select one PNG/JPEG' : 'Select one or more PNG/JPEG image slides'}
                    </span>
                  </div>
                </div>

                {/* Batch Previews grid list */}
                {uploadedImages.length > 0 && (
                  <div className="border border-gray-150 bg-gray-50/50 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-[9px] font-black text-indigo-900 uppercase tracking-wide">
                      <span>Uploaded Slides ({uploadedImages.length})</span>
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[8px]">
                        Queue Ready
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {uploadedImages.map((img) => (
                        <div 
                          key={img.id}
                          className="relative aspect-video rounded-xl border border-gray-200 overflow-hidden bg-white shadow-xs group"
                        >
                          <img 
                            src={img.previewUrl} 
                            alt="preview" 
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Hover deletion hook */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveUploadedImage(img.id);
                            }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
                            title="Remove slide"
                          >
                            <Trash size={12} className="stroke-[2.5]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Choose Category field */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">
                  <Tag size={10} />
                  <span>Choose Target Category *</span>
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer"
                >
                  {categories.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
                <span className="block text-[8px] text-gray-400 font-medium">Allows uploading multiple banners for the same category.</span>
              </div>

              {/* Banner Slug */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Banner Slug Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. healthy_delight"
                  value={bannerSlug}
                  onChange={(e) => setBannerSlug(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
                />
                <span className="block text-[8px] text-gray-400 font-medium">Unique tag name used on front-end categories binding.</span>
              </div>

              {/* Order Rank */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">
                  {isEditing ? 'Sorting Rank Order *' : 'Starting Sort Rank *'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 0"
                  value={orderRank}
                  onChange={(e) => setOrderRank(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
                />
                {!isEditing && (
                  <span className="block text-[8px] text-gray-400 font-medium">Sequence ranks auto-increment cleanly starting from this value.</span>
                )}
              </div>

              {/* Landing URL */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-gray-400 uppercase tracking-wide text-[9px] font-black">
                  <span>Target Landing Link</span>
                  <LinkIcon size={10} className="text-gray-300" />
                </label>
                <input
                  type="url"
                  placeholder="https://schoolemart.com/sale"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
                />
              </div>

              {/* Active Switch */}
              <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
                <span>Active (Publish in homepage sliding carousel)</span>
              </label>

              {/* Submit / Reset Actions */}
              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#0B1528] hover:bg-[#15253F] text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-xs"
                >
                  {isEditing ? 'Update Banner' : 'Create Banners'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-150 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>

        </div>,
        document.body
      )}

      {/* FOOTER COPYRIGHT BAR */}
      <div className="pt-8 pb-4 text-center border-t border-gray-200 select-none">
        <p className="text-[10px] font-bold text-gray-400">
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">Healthy Delight</span>
        </p>
      </div>

    </div>
  );
};

export default PromoHomeBanners;
