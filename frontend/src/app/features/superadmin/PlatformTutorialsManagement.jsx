import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  MonitorPlay, Film, Edit3, Trash2, Eye, Play, X, ChevronRight, CheckCircle,
  Upload, Image as ImageIcon, Users, GraduationCap, Building2, Globe2, Camera,
} from 'lucide-react';
import {
  listTutorials, createTutorial, updateTutorial, deleteTutorial,
  uploadAdminFile, uploadAdminMedia,
} from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapTutorialForAdmin, mapAdminTutorialToPayload, AUDIENCE_LABELS } from '../../../utils/mappers/tutorialsMapper';

const getAttachmentId = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object') return ref._id || ref.id;
  return ref;
};

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Everyone (All Roles)', icon: Globe2 },
  { value: 'parent', label: 'Student / Parent', icon: Users },
  { value: 'teacher', label: 'Teacher', icon: GraduationCap },
  { value: 'school', label: 'School Admin', icon: Building2 },
];

const audienceBadgeColor = (audience) => ({
  all: 'bg-indigo-500/90',
  parent: 'bg-emerald-500/90',
  teacher: 'bg-amber-500/90',
  school: 'bg-sky-500/90',
}[audience] || 'bg-indigo-500/90');

const PlatformTutorialsManagement = () => {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState('All');

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [order, setOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');

  const videoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const coverCameraInputRef = useRef(null);

  const [playingVideo, setPlayingVideo] = useState(null);

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const loadTutorials = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listTutorials({ limit: 100 });
      setTutorials((data || []).map(mapTutorialForAdmin));
    } catch {
      setTutorials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTutorials();
  }, [loadTutorials]);

  const uploadFile = async (file, purpose, useMedia = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);
    const attachment = useMedia
      ? await uploadAdminMedia(formData)
      : await uploadAdminFile(formData);
    return attachment?._id || attachment?.id;
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setTitle('');
    setDescription('');
    setTargetAudience('all');
    setOrder('0');
    setIsActive(true);
    setVideoFile(null);
    setVideoPreview('');
    setCoverFile(null);
    setCoverPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a video title.');
      return;
    }
    if (!videoPreview && !videoFile) {
      alert('Please select or upload a video file.');
      return;
    }

    setSaving(true);
    try {
      const existing = isEditing ? tutorials.find((t) => t.id === editId) : null;
      let videoId = getAttachmentId(existing?.raw?.videoId);
      let thumbnailId = getAttachmentId(existing?.raw?.thumbnailId);

      if (videoFile) {
        videoId = await uploadFile(videoFile, 'tutorial_video', true);
      }
      if (coverFile) {
        thumbnailId = await uploadFile(coverFile, 'tutorial_thumb', true);
      }

      if (!videoId) {
        alert('Please upload a video file.');
        return;
      }

      const payload = mapAdminTutorialToPayload({
        title, description, videoId, thumbnailId, targetAudience, order, isActive,
      });

      if (isEditing) {
        const updated = await updateTutorial(existing?.mongoId || editId, payload);
        setTutorials((prev) => prev.map((t) => (t.id === editId ? mapTutorialForAdmin(updated) : t)));
        alert('Tutorial updated successfully!');
      } else {
        const created = await createTutorial(payload);
        setTutorials((prev) => [mapTutorialForAdmin(created), ...prev]);
        alert('Tutorial uploaded successfully!');
      }
      resetForm();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to save tutorial'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tutorial) => {
    setIsEditing(true);
    setEditId(tutorial.id);
    setTitle(tutorial.title);
    setDescription(tutorial.description);
    setTargetAudience(tutorial.targetAudience || 'all');
    setOrder(String(tutorial.order ?? 0));
    setIsActive(tutorial.status === 'Active');
    setVideoPreview(tutorial.videoUrl);
    setCoverPreview(tutorial.thumbnailUrl);
    setVideoFile(null);
    setCoverFile(null);
  };

  const handleDelete = async (tutorial) => {
    if (!window.confirm('Delete this tutorial video? Learners will no longer see it.')) return;
    try {
      await deleteTutorial(tutorial.mongoId || tutorial.id);
      setTutorials((prev) => prev.filter((t) => t.id !== tutorial.id));
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to delete tutorial'));
    }
  };

  const visibleTutorials = audienceFilter === 'All'
    ? tutorials
    : tutorials.filter((t) => t.targetAudience === audienceFilter);

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Platform Tutorials</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              LEARN MORE ABOUT PLATFORM
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">
            Upload "how it works" videos shown on the Profile page of Student/Parent, Teacher and School portals. Target a specific role or publish to everyone at once.
          </p>
        </div>
        <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span className="hover:text-gray-600 cursor-pointer">Home</span>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="text-gray-700">Platform Tutorials</span>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none text-left">
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Published Videos</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1 tabular-nums">
              {tutorials.filter((t) => t.status === 'Active').length}
            </h2>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
            <Film size={20} className="stroke-[2.5]" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Views</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1 tabular-nums">
              {tutorials.reduce((acc, t) => acc + t.views, 0).toLocaleString()}
            </h2>
          </div>
          <div className="bg-sky-50 text-sky-600 p-3 rounded-2xl">
            <Eye size={20} className="stroke-[2.5]" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Drafts</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1 tabular-nums">
              {tutorials.filter((t) => t.status !== 'Active').length}
            </h2>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
            <MonitorPlay size={20} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT: FORM */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 select-none">
            <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">
              {isEditing ? 'Edit Tutorial' : 'Upload Tutorial Video'}
            </h3>
            <MonitorPlay size={16} className="text-indigo-600" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-gray-700">
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Video Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. How to track your order"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Description</label>
              <textarea
                rows={3}
                placeholder="What will they learn from this video?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold leading-relaxed resize-none"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Visible To *</label>
              <div className="grid grid-cols-2 gap-2">
                {AUDIENCE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = targetAudience === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setTargetAudience(opt.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={14} className="shrink-0" />
                      <span className="text-[10px] font-black leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display order */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Display Order</label>
              <input
                type="number"
                min="0"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
              <p className="text-[8px] text-gray-400 font-bold normal-case">Lower numbers show first in the list.</p>
            </div>

            {/* VIDEO FILE */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Video File *</label>
              <input type="file" ref={videoInputRef} accept=".mp4,.mov,.webm,.mkv" onChange={handleVideoFileChange} className="hidden" />
              <div
                onClick={() => videoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all hover:bg-gray-50 ${
                  videoPreview ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-250 bg-white'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5 select-none">
                  {videoPreview ? (
                    <>
                      <CheckCircle size={24} className="text-emerald-500" />
                      <span className="text-emerald-700 font-extrabold text-[10px] uppercase tracking-wide">Video File Loaded!</span>
                      <span className="text-[8px] text-gray-400 truncate max-w-[200px]">
                        {videoFile ? videoFile.name : 'Existing video attached'}
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

            {/* COVER IMAGE */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Thumbnail Cover (optional)</label>
              <input type="file" ref={coverInputRef} accept=".png,.jpg,.jpeg,.webp" onChange={handleCoverFileChange} className="hidden" />
              {/* capture="environment" opens the device's camera app directly
                  on mobile; desktop browsers that don't support it fall back
                  to the normal file picker, same as the input above. */}
              <input type="file" ref={coverCameraInputRef} accept=".png,.jpg,.jpeg,.webp" capture="environment" onChange={handleCoverFileChange} className="hidden" />
              <div
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                  coverPreview ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-250 bg-white'
                }`}
              >
                <div className="flex flex-col items-center gap-2 select-none">
                  {coverPreview ? (
                    <div className="flex items-center gap-3 text-left">
                      <img src={coverPreview} alt="cover thumb" className="w-10 h-10 object-cover rounded-lg border border-emerald-100" />
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
                      className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-300 bg-white text-[10px] font-black text-gray-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Camera size={12} /> Take Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-300 bg-white text-[10px] font-black text-gray-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Upload size={12} /> Choose File
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none pt-1">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
              />
              <span>Published (visible on the learner's Profile page)</span>
            </label>

            <div className="pt-4 space-y-2 select-none">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#0B1528] hover:bg-[#15253F] disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-xs"
              >
                {saving ? 'Saving…' : isEditing ? 'Update Tutorial' : 'Upload Tutorial'}
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

        {/* RIGHT: LIST */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 select-none flex-wrap gap-3">
            <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">Tutorial Videos</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['All', 'all', 'parent', 'teacher', 'school'].map((val, idx) => (
                <button
                  key={idx}
                  onClick={() => setAudienceFilter(val)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${
                    audienceFilter === val
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {val === 'All' ? 'All' : AUDIENCE_LABELS[val]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-sm text-gray-400 font-bold py-12">Loading tutorials…</div>
          ) : visibleTutorials.length === 0 ? (
            <div className="text-center text-sm text-gray-400 font-bold py-12">No tutorial videos yet — upload one to get started.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {visibleTutorials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-150 transition-all flex flex-col group"
                >
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden cursor-pointer select-none">
                    {t.thumbnailUrl ? (
                      <img
                        src={t.thumbnailUrl}
                        alt={t.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <MonitorPlay size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />
                    <div
                      onClick={() => setPlayingVideo(t)}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 text-black hover:bg-indigo-600 hover:text-white p-4 rounded-full shadow-lg transition-all scale-95 group-hover:scale-110"
                    >
                      <Play size={18} className="fill-current stroke-none ml-0.5" />
                    </div>
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                        t.status === 'Active' ? 'bg-emerald-500/90 text-white border-transparent' : 'bg-yellow-500/90 text-white border-transparent'
                      }`}>
                        {t.status}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border text-white border-transparent ${audienceBadgeColor(t.targetAudience)}`}>
                        {AUDIENCE_LABELS[t.targetAudience]}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="text-xs font-black text-[#0B1528] leading-tight line-clamp-1">{t.title}</h4>
                    {t.description && (
                      <p className="text-[9px] text-gray-400 font-semibold line-clamp-2">{t.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                        <Eye size={12} className="text-sky-500" /> {t.views.toLocaleString()} views
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(t)}
                          className="bg-white hover:bg-indigo-50 border border-gray-200 text-gray-700 hover:text-indigo-600 p-2 rounded-xl shadow-xs transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={11} className="stroke-[2.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          className="bg-white hover:bg-rose-50 border border-gray-200 text-gray-700 hover:text-rose-600 p-2 rounded-xl shadow-xs transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={11} className="stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VIDEO PLAYER MODAL */}
      {playingVideo && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none">
          <div className="relative bg-[#0B1528] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setPlayingVideo(null)}
              className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full border border-white/10 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="relative bg-black aspect-video">
              <video src={playingVideo.videoUrl} className="w-full h-full" controls autoPlay playsInline />
            </div>
            <div className="p-5 text-left text-white space-y-1.5">
              <h4 className="text-sm font-black">{playingVideo.title}</h4>
              {playingVideo.description && (
                <p className="text-xs text-gray-300 font-semibold leading-relaxed">{playingVideo.description}</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PlatformTutorialsManagement;
