import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { 
  Video, Film, Plus, Edit3, Trash2, Heart, Eye, Play, X, ChevronRight, CheckCircle, Info, Upload, Image as ImageIcon, ShoppingBag, Globe, EyeOff, Camera, MessageCircle
} from 'lucide-react';
import { listVendors, listReels, createReel, updateReel, deleteReel, uploadAdminFile, uploadAdminMedia, listAdminReelComments, deleteAdminReelComment } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapReelForAdmin, mapAdminReelToPayload } from '../../../utils/mappers/adminReelsMapper';

const getAttachmentId = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object') return ref._id || ref.id;
  return ref;
};

const ReelsManagement = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [stores, setStores] = useState([]);

  // Form input states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Text Fields
  const [reelTitle, setReelTitle] = useState('');
  const [reelDescription, setReelDescription] = useState('');
  const [storeName, setStoreName] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productMrp, setProductMrp] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [category, setCategory] = useState('All');
  const [targetApp, setTargetApp] = useState('both');

  // File Upload states (handles both raw files and local previews)
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [productFile, setProductFile] = useState(null);
  const [productPreview, setProductPreview] = useState('');

  // Refs for hidden inputs
  const videoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const coverCameraInputRef = useRef(null);
  const productInputRef = useRef(null);
  const productCameraInputRef = useRef(null);

  // Video portal state
  const [playingVideo, setPlayingVideo] = useState(null);

  // Admin comments modal state
  const [selectedReelForComments, setSelectedReelForComments] = useState(null);
  const [reelCommentsList, setReelCommentsList] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const handleOpenCommentsModal = async (reel) => {
    setSelectedReelForComments(reel);
    setCommentsLoading(true);
    try {
      const res = await listAdminReelComments(reel.mongoId || reel.id);
      setReelCommentsList(res.data || []);
    } catch {
      setReelCommentsList([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAdminDeleteComment = async (commentId) => {
    if (!selectedReelForComments || !window.confirm('Delete this user comment?')) return;
    try {
      await deleteAdminReelComment(selectedReelForComments.mongoId || selectedReelForComments.id, commentId);
      setReelCommentsList((prev) => prev.filter((c) => c.id !== commentId));
      setReels((prev) =>
        prev.map((r) =>
          (r.id === selectedReelForComments.id || r.mongoId === selectedReelForComments.id)
            ? { ...r, commentsCount: Math.max(0, (r.commentsCount || 0) - 1) }
            : r
        )
      );
    } catch {
      alert('Failed to delete comment.');
    }
  };

  // Handle Video File selection
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  // Handle Cover File selection
  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
    }
  };

  // Handle Product File selection
  const handleProductFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductFile(file);
      const previewUrl = URL.createObjectURL(file);
      setProductPreview(previewUrl);
    }
  };

  useEffect(() => {
    const loadStores = async () => {
      try {
        const { data } = await listVendors({ limit: 100 });
        const names = (data || []).map((v) => v.storeName || v.businessName || v.name).filter(Boolean);
        setStores(names);
        if (names.length && !storeName) setStoreName(names[0]);
      } catch {
        setStores([]);
      }
    };
    loadStores();
  }, []);

  const loadReels = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listReels({ limit: 100 });
      setReels((data || []).map(mapReelForAdmin));
    } catch {
      setReels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  const uploadFile = async (file, purpose, useMedia = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);
    const attachment = useMedia
      ? await uploadAdminMedia(formData)
      : await uploadAdminFile(formData);
    return attachment?._id || attachment?.id;
  };

  // Form submit handler (Add / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!reelTitle.trim() || !reelDescription.trim()) {
      alert('Please fill out Reel Title and Description.');
      return;
    }

    if (!videoPreview && !videoFile) {
      alert('Please select or upload a Video File.');
      return;
    }

    const coverUrl = coverPreview || '';
    if (!coverUrl) {
      alert('Please upload a cover image.');
      return;
    }
    const prodImgUrl = productPreview || '';
    if (!prodImgUrl) {
      alert('Please upload a product image.');
      return;
    }

    setSaving(true);
    try {
      const existingReel = isEditing ? reels.find((r) => r.id === editId) : null;
      let videoId = getAttachmentId(existingReel?.raw?.videoId);
      let thumbnailId = getAttachmentId(existingReel?.raw?.thumbnailId);
      let productImageId = getAttachmentId(existingReel?.raw?.linkedProduct?.imageId);

      if (videoFile) {
        videoId = await uploadFile(videoFile, 'reel_video', true);
      }
      if (coverFile) {
        thumbnailId = await uploadFile(coverFile, 'reel_thumb', true);
      }
      if (productFile) {
        productImageId = await uploadFile(productFile, 'reel_thumb', true);
      }

      if (!videoId) {
        alert('Please upload a video file.');
        return;
      }
      if (!thumbnailId) {
        alert('Please upload a cover image.');
        return;
      }

      const payload = mapAdminReelToPayload({
        title: reelTitle,
        description: reelDescription,
        videoId,
        thumbnailId,
        storeName,
        category,
        targetApp,
        productTitle,
        productPrice,
        productMrp,
        productUrl,
        productImageId,
        isActive,
      });

      if (isEditing) {
        const updated = await updateReel(existingReel?.mongoId || editId, payload);
        setReels((prev) => prev.map((r) => (r.id === editId ? mapReelForAdmin(updated) : r)));
        alert('Reel updated successfully!');
        resetForm();
      } else {
        const created = await createReel(payload);
        setReels((prev) => [mapReelForAdmin(created), ...prev]);
        alert('Reel uploaded and published to the customer feed!');
        resetForm();
      }
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to save reel'));
    } finally {
      setSaving(false);
    }
  };

  // Trigger edit populated
  const handleEdit = (reel) => {
    setIsEditing(true);
    setEditId(reel.id);
    setReelTitle(reel.title);
    setReelDescription(reel.description);
    setStoreName(reel.storeName);
    setCategory(reel.category || 'All');
    setTargetApp(reel.targetApp || 'both');
    setProductTitle(reel.productTitle);
    setProductPrice(reel.productPrice.toString());
    setProductMrp(reel.productMrp.toString());
    setProductUrl(reel.productUrl);
    setIsActive(reel.status === 'Active');

    // Populate previews
    setVideoPreview(reel.videoUrl);
    setCoverPreview(reel.thumbnailUrl);
    setProductPreview(reel.productImageUrl);
  };

  // Delete handler
  const handleDelete = async (reel) => {
    if (!window.confirm('Are you sure you want to delete this video reel?')) return;
    try {
      await deleteReel(reel.mongoId || reel.id);
      setReels((prev) => prev.filter((r) => r.id !== reel.id));
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to delete reel'));
    }
  };

  // Reset form
  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setReelTitle('');
    setReelDescription('');
    setStoreName('School E-Mart Official');
    setCategory('All');
    setTargetApp('both');
    setProductTitle('');
    setProductPrice('');
    setProductMrp('');
    setProductUrl('');
    setIsActive(true);

    // Reset upload previews
    setVideoFile(null);
    setVideoPreview('');
    setCoverFile(null);
    setCoverPreview('');
    setProductFile(null);
    setProductPreview('');
  };

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Reels Management</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              INTERACTIVE CAMERAS
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Upload local video stories, write details description, and link live marketplace kits or products for direct user checkouts.</p>
        </div>

        {/* Breadcrumb right align */}
        <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span className="hover:text-gray-600 cursor-pointer">Home</span>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="text-gray-700">Reels</span>
        </div>
      </div>

      {/* KPI METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none text-left">
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Active Reels</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1 tabular-nums">
              {reels.filter(r => r.status === 'Active').length}
            </h2>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
            <Film size={20} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Plays / Views</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1 tabular-nums">
              {(reels.reduce((acc, r) => acc + r.views, 0) / 1000).toFixed(1)}K
            </h2>
          </div>
          <div className="bg-sky-50 text-sky-600 p-3 rounded-2xl">
            <Eye size={20} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Likes Received</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1 tabular-nums">
              {(reels.reduce((acc, r) => acc + r.likes, 0) / 1000).toFixed(1)}K
            </h2>
          </div>
          <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl">
            <Heart size={20} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: UPLOAD FORMS PANEL */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 select-none">
            <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">
              {isEditing ? 'Edit Reel Details' : 'Upload Reel Hub'}
            </h3>
            <Video size={16} className="text-indigo-600" />
          </div>


          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-gray-700">
            
            {/* Reel Title */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Reel Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Smart Kit Unboxing 📦"
                value={reelTitle}
                onChange={(e) => setReelTitle(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
            </div>

            {/* Reel Description */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Reel Description / Caption *</label>
              <textarea
                required
                rows={3}
                placeholder="Write caption details here..."
                value={reelDescription}
                onChange={(e) => setReelDescription(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold leading-relaxed resize-none"
              />
            </div>

            {/* Associated Store */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Associated Store / Vendor *</label>
              <select
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer"
              >
                {stores.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Reel Category */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer"
              >
                {['All', 'Kits', 'Uniforms', 'Stationery', 'Activities'].map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Target App Audience */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Target App Audience *</label>
              <select
                value={targetApp}
                onChange={(e) => setTargetApp(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer"
              >
                <option value="both">Both Apps (Parents & Schools)</option>
                <option value="parent">Parent App Only</option>
                <option value="school">School App Only</option>
              </select>
            </div>

            {/* VIDEO FILE UPLOAD ZONE (Not URL) */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Video File *</label>
              <input
                type="file"
                ref={videoInputRef}
                accept=".mp4,.mov,.webm,.mkv"
                onChange={handleVideoFileChange}
                className="hidden"
              />
              
              <div 
                onClick={() => videoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all hover:bg-gray-50 ${
                  videoPreview 
                    ? 'border-emerald-200 bg-emerald-50/20' 
                    : 'border-gray-250 bg-white'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5 select-none">
                  {videoPreview ? (
                    <>
                      <CheckCircle size={24} className="text-emerald-500" />
                      <span className="text-emerald-700 font-extrabold text-[10px] uppercase tracking-wide">Video File Loaded!</span>
                      <span className="text-[8px] text-gray-400 truncate max-w-[200px]">
                        {videoFile ? videoFile.name : 'Sample video attached'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400" />
                      <span className="text-gray-700 font-black">Choose or drag video file</span>
                      <span className="text-[8px] text-gray-400">Accepts mp4, mov, webm formats</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* COVER IMAGE UPLOAD ZONE (Not URL) */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Reel Thumbnail Cover *</label>
              <input
                type="file"
                ref={coverInputRef}
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleCoverFileChange}
                className="hidden"
              />
              {/* capture="environment" opens the device's camera app directly
                  on mobile; desktop browsers that don't support it fall back
                  to the normal file picker, same as the input above. */}
              <input
                type="file"
                ref={coverCameraInputRef}
                accept=".png,.jpg,.jpeg,.webp"
                capture="environment"
                onChange={handleCoverFileChange}
                className="hidden"
              />

              <div
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                  coverPreview
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-gray-250 bg-white'
                }`}
              >
                <div className="flex flex-col items-center gap-2 select-none">
                  {coverPreview ? (
                    <div className="flex items-center gap-3 text-left">
                      <img
                        src={coverPreview}
                        alt="cover thumb"
                        className="w-10 h-10 object-cover rounded-lg border border-emerald-100"
                      />
                      <div>
                        <span className="block text-emerald-700 font-extrabold text-[10px] uppercase tracking-wide">Cover Image Loaded!</span>
                        <span className="block text-[8px] text-gray-400 truncate max-w-[150px]">
                          {coverFile ? coverFile.name : 'Cover preview set'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={24} className="text-gray-400" />
                      <span className="text-gray-700 font-black">Choose a cover image</span>
                      <span className="text-[8px] text-gray-400">Select png or jpeg cover</span>
                    </>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => coverCameraInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300 bg-white text-[10px] font-black text-gray-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Camera size={12} /> Take Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300 bg-white text-[10px] font-black text-gray-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Upload size={12} /> Choose File
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* LINKED PRODUCT SECTION CONTAINER */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
              <div className="flex items-center gap-1.5 border-b border-gray-150 pb-2 mb-1 select-none">
                <ShoppingBag size={14} className="text-indigo-600" />
                <span className="text-[9px] font-black text-indigo-900 uppercase tracking-wide">Linked Product / Kit Banner</span>
              </div>

              {/* Product Title */}
              <div className="space-y-1">
                <label className="block text-[8px] text-gray-400 uppercase tracking-wider font-bold">Product Title</label>
                <input
                  type="text"
                  placeholder="e.g. Complete Class 2 Kit"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[8px] text-gray-400 uppercase tracking-wider font-bold">Selling Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 4299"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] text-gray-400 uppercase tracking-wider font-bold">M.R.P. (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5499"
                    value={productMrp}
                    onChange={(e) => setProductMrp(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>
              </div>

              {/* Product Shop URL Destination */}
              <div className="space-y-1">
                <label className="block text-[8px] text-gray-400 uppercase tracking-wider font-bold">Product Landing URL</label>
                <input
                  type="url"
                  placeholder="https://schoolemart.com/products/class-2"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              {/* Product Preview Image file uploader */}
              <div className="space-y-1">
                <label className="block text-[8px] text-gray-400 uppercase tracking-wider font-bold select-none">Product Image Thumbnail</label>
                <input
                  type="file"
                  ref={productInputRef}
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={handleProductFileChange}
                  className="hidden"
                />
                {/* capture="environment" opens the device's camera app directly
                    on mobile; desktop browsers that don't support it fall back
                    to the normal file picker, same as the input above. */}
                <input
                  type="file"
                  ref={productCameraInputRef}
                  accept=".png,.jpg,.jpeg,.webp"
                  capture="environment"
                  onChange={handleProductFileChange}
                  className="hidden"
                />

                <div
                  className={`border border-dashed rounded-xl p-3 text-center transition-all bg-white ${
                    productPreview ? 'border-emerald-200' : 'border-gray-250'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 select-none">
                    {productPreview ? (
                      <>
                        <img
                          src={productPreview}
                          alt="product cover"
                          className="w-7 h-7 object-cover rounded-md border border-gray-100"
                        />
                        <span className="text-emerald-700 font-extrabold text-[8px] uppercase tracking-wide">Product Image Added</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-bold">Select Product Image</span>
                    )}
                    <button
                      type="button"
                      onClick={() => productCameraInputRef.current?.click()}
                      className="p-1.5 rounded-md border border-gray-200 hover:border-emerald-300 text-gray-500 hover:text-emerald-600 transition-colors"
                      title="Take a photo"
                    >
                      <Camera size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => productInputRef.current?.click()}
                      className="p-1.5 rounded-md border border-gray-200 hover:border-emerald-300 text-gray-500 hover:text-emerald-600 transition-colors"
                      title="Choose file"
                    >
                      <Upload size={12} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Active Switch */}
            <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none pt-1">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
              />
              <span>Active (Publish on customer app feed)</span>
            </label>

            {/* Submit & Reset actions */}
            <div className="pt-4 space-y-2 select-none">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#0B1528] hover:bg-[#15253F] disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-xs"
              >
                {saving ? 'Saving…' : isEditing ? 'Update Reel Details' : 'Upload Reel'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl transition-all"
              >
                Cancel / Reset
              </button>
            </div>

          </form>

        </div>

        {/* RIGHT COLUMN: REELS CARD FEED */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider border-b border-gray-100 pb-3 select-none">
            Active Reels Directory
          </h3>

          {loading ? (
            <div className="text-center text-sm text-gray-400 font-bold py-12">Loading reels…</div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
            {reels.map((r) => (
              <div 
                key={r.id}
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-150 transition-all flex flex-col group"
              >
                
                {/* Smartphone Preview Canvas */}
                <div className="relative aspect-[9/16] w-full bg-slate-900 overflow-hidden cursor-pointer select-none">
                  <img
                    src={r.thumbnailUrl}
                    alt={r.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />

                  {/* Dim Overlay */}
                  <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />

                  {/* Play Trigger */}
                  <div 
                    onClick={() => setPlayingVideo(r)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 text-black hover:bg-indigo-600 hover:text-white p-4 rounded-full shadow-lg transition-all scale-95 group-hover:scale-110"
                  >
                    <Play size={18} className="fill-current stroke-none ml-0.5" />
                  </div>

                  {/* Status tag */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                      r.status === 'Active' 
                        ? 'bg-emerald-500/90 text-white border-transparent' 
                        : 'bg-yellow-500/90 text-white border-transparent'
                    }`}>
                      {r.status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border bg-indigo-500/90 text-white border-transparent">
                      {r.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border bg-purple-600/90 text-white border-transparent">
                      {r.targetApp === 'parent' ? 'Parents App' : r.targetApp === 'school' ? 'School App' : 'Both Apps'}
                    </span>
                  </div>

                  {/* Overlaid details mimicking user app styling */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-4 text-white text-left space-y-1.5 pointer-events-none">
                    <div className="flex items-center gap-1">
                      <span className="bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none">
                        SE
                      </span>
                      <span className="text-[10px] font-black text-white truncate max-w-[120px]">
                        {r.storeName}
                      </span>
                    </div>

                    <h4 className="text-xs font-black leading-tight line-clamp-1 select-text">{r.title}</h4>
                    <p className="text-[9px] text-gray-300 font-semibold line-clamp-2 select-text">{r.description}</p>
                    
                    {/* Tiny Product badge */}
                    {r.productTitle && (
                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/10 select-none">
                        <img 
                          src={r.productImageUrl} 
                          alt="product" 
                          className="w-5 h-5 object-cover rounded"
                        />
                        <div className="text-[8px] leading-tight">
                          <span className="block font-black text-white truncate max-w-[120px]">{r.productTitle}</span>
                          <span className="block font-extrabold text-indigo-400">₹{r.productPrice}</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Card controls and stats logs */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between select-none">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
                    <span className="flex items-center gap-1" title="Likes">
                      <Heart size={12} className="text-rose-500 fill-rose-500" />
                      {r.likes || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenCommentsModal(r)}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer"
                      title="View & moderate user comments"
                    >
                      <MessageCircle size={12} className="text-indigo-500" />
                      {r.commentsCount || 0} comments
                    </button>
                    <span className="flex items-center gap-1" title="Views">
                      <Eye size={12} className="text-sky-500" />
                      {r.views || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEdit(r)}
                      className="bg-white hover:bg-indigo-50 border border-gray-200 text-gray-700 hover:text-indigo-600 p-2 rounded-xl shadow-xs transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={11} className="stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      className="bg-white hover:bg-rose-50 border border-gray-200 text-gray-700 hover:text-rose-600 p-2 rounded-xl shadow-xs transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={11} className="stroke-[2.5]" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
          )}

        </div>

      </div>

      {/* FLOATING VIDEO PLAYER PORTAL (Rendered exactly matching user-app screenshot) */}
      {playingVideo && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
          
          <div className="relative bg-[#0B1528] w-full max-w-[375px] aspect-[9/16] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Top controls and sound icons matching mockup */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between text-white z-50">
              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                className="bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full border border-white/10 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="bg-black/30 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10 text-xs font-black select-none flex items-center gap-1.5">
                ✨ Explore Reels
              </div>

              <div className="bg-black/40 p-2.5 rounded-full border border-white/10 text-white select-none">
                🔊
              </div>
            </div>

            {/* Playable Video viewport */}
            <div className="relative flex-1 bg-black">
              <video
                src={playingVideo.videoUrl}
                className="w-full h-full object-cover"
                controls
                autoPlay
                loop
                playsInline
              />

              {/* Stacked Vertical index (mocked e.g. 1/4) on left aligned from mockup */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
                <div className="bg-black/50 p-2 rounded-full border border-white/15 text-white text-[10px] cursor-pointer">
                  ▲
                </div>
                <div className="bg-black/50 px-2.5 py-1.5 rounded-xl border border-white/15 text-white text-[10px] font-black">
                  1/4
                </div>
                <div className="bg-black/50 p-2 rounded-full border border-white/15 text-white text-[10px] cursor-pointer">
                  ▼
                </div>
              </div>
            </div>

            {/* Dark glassmorphic bottom info panel (Exactly matching your user app screenshot!) */}
            <div className="p-4 bg-gradient-to-t from-black via-black/85 to-transparent text-left text-white space-y-3 relative z-40">
              
              {/* Profile header with checkmark */}
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-black border border-white/15 shadow select-none">
                  SE
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-wide text-white">{playingVideo.storeName}</span>
                    <span className="bg-indigo-500 text-white rounded-full p-0.5 text-[6px] font-black select-none">✓</span>
                  </div>
                  <span className="block text-[8px] text-gray-400 font-bold">{(playingVideo.views / 1000).toFixed(1)}k views</span>
                </div>
              </div>

              {/* Title & Caption */}
              <div className="space-y-1 text-left">
                <h4 className="text-xs font-black text-white">{playingVideo.title}</h4>
                <p className="text-[10px] text-gray-300 font-semibold leading-relaxed line-clamp-3 select-text">
                  {playingVideo.description}
                </p>
              </div>

              {/* Audio tag overlay */}
              <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold select-none pb-2 border-b border-white/5">
                <span>🎵 Original Audio - {playingVideo.storeName}</span>
              </div>

              {/* LINKED PRODUCT SHOPPING CARD (Exactly styled matching screenshot) */}
              {playingVideo.productTitle && (
                <div className="bg-[#1C1F2E]/90 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img 
                        src={playingVideo.productImageUrl} 
                        alt="Product Cover" 
                        className="w-11 h-11 object-cover rounded-xl border border-white/5"
                      />
                      <span className="absolute top-0 left-0 bg-yellow-500 text-black text-[5px] font-black uppercase tracking-wider px-1 py-0.5 rounded-br-lg rounded-tl-xl select-none">
                        RECOMMENDED
                      </span>
                    </div>

                    <div className="text-left leading-snug">
                      <span className="block text-[10px] font-black text-white truncate max-w-[120px]">
                        {playingVideo.productTitle}
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] pt-0.5">
                        <span className="font-extrabold text-[#FED847]">₹{playingVideo.productPrice.toLocaleString()}</span>
                        <span className="text-gray-400 line-through">₹{playingVideo.productMrp.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shop now yellow button */}
                  <a
                    href={playingVideo.productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#FED847] hover:bg-[#FED847]/90 text-[#0B1528] px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    🛍️ Shop Now
                  </a>
                </div>
              )}

            </div>

          </div>

        </div>,
        document.body
      )}

      {/* ADMIN REEL COMMENTS MODAL PORTAL */}
      {selectedReelForComments && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-outfit">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 line-clamp-1">
                  Comments: {selectedReelForComments.title}
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold">
                  Moderate community feedback on this reel
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReelForComments(null)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Comments List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 min-h-[200px]">
              {commentsLoading ? (
                <div className="py-12 text-center text-xs font-semibold text-gray-400 animate-pulse">
                  Loading comments...
                </div>
              ) : reelCommentsList.length === 0 ? (
                <div className="py-12 text-center text-xs font-semibold text-gray-400">
                  No comments posted on this reel yet.
                </div>
              ) : (
                reelCommentsList.map((cmt) => (
                  <div key={cmt.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-150 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-gray-900">{cmt.user?.name || 'User'}</span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase">
                          {cmt.user?.role || 'parent'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium mt-1 leading-relaxed">
                        {cmt.body}
                      </p>
                      <span className="text-[9px] text-gray-400 block mt-1">
                        {new Date(cmt.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAdminDeleteComment(cmt.id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
                      title="Delete Comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReelForComments(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FOOTER COPYRIGHT BAR */}
      <div className="pt-8 pb-4 text-center border-t border-gray-200 select-none">
        <p className="text-[10px] font-bold text-gray-400">
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">School E-Mart</span>
        </p>
      </div>

    </div>
  );
};

export default ReelsManagement;
