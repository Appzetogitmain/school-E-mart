import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { 
  GraduationCap, Film, Plus, Edit3, Trash2, BookOpen, Clock, Play, X, ChevronRight, CheckCircle, Info, Upload, Image as ImageIcon, User, Award, Tag, Loader2
} from 'lucide-react';
import {
  listPlatformCourses,
  createPlatformCourse,
  updatePlatformCourse,
  deletePlatformCourse,
  uploadAdminFile,
  uploadAdminMedia,
} from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapPlatformCourseForAdmin, mapAdminCourseToPayload } from '../../../utils/mappers/adminLmsMapper';
import useAuthReady from '../../../hooks/useAuthReady';

const uploadLmsFile = async (file, purpose, useMedia = false) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', purpose);
  const attachment = useMedia
    ? await uploadAdminMedia(formData)
    : await uploadAdminFile(formData);
  return attachment?.url || attachment?.storageKey || '';
};

const resolveMediaUrl = async (preview, file, label, urlInput = '', existingUrl = '') => {
  const normalizedInput = urlInput?.trim();
  if (normalizedInput) {
    if (!/^https?:\/\//i.test(normalizedInput)) {
      throw new Error(
        `Please provide a valid ${label === 'cover' ? 'cover image' : 'video'} URL starting with http:// or https://`
      );
    }
    return normalizedInput;
  }

  if (
    preview?.startsWith('http://') ||
    preview?.startsWith('https://') ||
    preview?.startsWith('/uploads/')
  ) {
    return preview;
  }

  if (file) {
    const purpose = label === 'video' ? 'lms_video' : 'lms_thumb';
    return uploadLmsFile(file, purpose, label === 'video');
  }

  return existingUrl || '';
};

const LMSManagement = () => {
  const authReady = useAuthReady();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Subjects & Grades options
  const subjects = ['Science', 'Mathematics', 'English', 'Geography', 'Art & Craft', 'History'];
  const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];

  // Form input states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Text Fields
  const [courseTitle, setCourseTitle] = useState('');
  const [subject, setSubject] = useState('Science');
  const [gradeClass, setGradeClass] = useState('Grade 5');
  const [instructor, setInstructor] = useState('');
  const [concepts, setConcepts] = useState('');
  const [duration, setDuration] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [thumbnailUrlInput, setThumbnailUrlInput] = useState('');

  // File Upload states (handles both raw files and local object previews)
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');

  // Refs for hidden inputs
  const videoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Playing Video Modal Portal state
  const [playingCourse, setPlayingCourse] = useState(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listPlatformCourses({ limit: 100 });
      setCourses((data || []).map(mapPlatformCourseForAdmin));
    } catch (err) {
      setCourses([]);
      setError(getErrorMessage(err, 'Unable to load LMS courses'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    loadCourses();
  }, [authReady, loadCourses]);

  // Handlers
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseTitle.trim() || !instructor.trim() || !concepts.trim()) {
      alert('Please fill out Course Title, Instructor, and Key Concepts.');
      return;
    }

    if (!videoUrlInput.trim() && !videoFile && !videoPreview) {
      alert('Please upload a lecture video or provide a video URL.');
      return;
    }

    if (!thumbnailUrlInput.trim() && !coverPreview) {
      alert('Please upload a course cover image or provide a cover image URL.');
      return;
    }

    setSaving(true);
    try {
      const existingCourse = isEditing ? courses.find((c) => c.id === editId) : null;
      const [resolvedVideoUrl, resolvedCoverUrl] = await Promise.all([
        resolveMediaUrl(
          videoPreview,
          videoFile,
          'video',
          videoUrlInput,
          existingCourse?.videoUrl
        ),
        resolveMediaUrl(
          coverPreview,
          coverFile,
          'cover',
          thumbnailUrlInput,
          existingCourse?.thumbnailUrl
        ),
      ]);

      const payload = mapAdminCourseToPayload({
        title: courseTitle,
        subject,
        gradeClass,
        instructor,
        concepts,
        duration,
        videoUrl: resolvedVideoUrl,
        thumbnailUrl: resolvedCoverUrl,
        isActive,
      });

      if (isEditing) {
        const updated = await updatePlatformCourse(editId, payload);
        setCourses((prev) =>
          prev.map((c) => (c.id === editId ? mapPlatformCourseForAdmin(updated) : c))
        );
        alert('LMS course updated successfully!');
        resetForm();
      } else {
        const created = await createPlatformCourse(payload);
        setCourses((prev) => [mapPlatformCourseForAdmin(created), ...prev]);
        alert('LMS course lecture successfully published to the Student Learning Hub!');
        resetForm();
      }
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to save LMS course'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (course) => {
    setIsEditing(true);
    setEditId(course.id);
    setCourseTitle(course.title);
    setSubject(course.subject);
    setGradeClass(course.gradeClass);
    setInstructor(course.instructor);
    setConcepts(course.concepts);
    setDuration(course.duration);
    setIsActive(course.status === 'Active');
    setVideoUrlInput(course.videoUrl?.startsWith('http') ? course.videoUrl : '');
    setThumbnailUrlInput(course.thumbnailUrl?.startsWith('http') ? course.thumbnailUrl : '');

    // Populate previews
    setVideoPreview(course.videoUrl || '');
    setCoverPreview(course.thumbnailUrl || '');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this LMS course?')) return;

    try {
      await deletePlatformCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to delete LMS course'));
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setCourseTitle('');
    setSubject('Science');
    setGradeClass('Grade 5');
    setInstructor('');
    setConcepts('');
    setDuration('');
    setIsActive(true);
    setVideoUrlInput('');
    setThumbnailUrlInput('');

    // Reset upload previews
    setVideoFile(null);
    setVideoPreview('');
    setCoverFile(null);
    setCoverPreview('');
  };

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">LMS (Learning Management)</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              STUDENT HUB
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Manage learning modules, upload class syllabus lectures, register instructors, and detail curriculum concepts.</p>
        </div>

        {/* Breadcrumb right align */}
        <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span className="hover:text-gray-600 cursor-pointer">Home</span>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="text-gray-700">LMS</span>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none text-left">
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Active Lectures</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1 tabular-nums">
              {courses.filter(c => c.status === 'Active').length}
            </h2>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
            <GraduationCap size={20} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Students Enrolled</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1 tabular-nums">
              {courses.reduce((acc, c) => acc + c.studentsEnrolled, 0).toLocaleString()}
            </h2>
          </div>
          <div className="bg-sky-50 text-sky-600 p-3 rounded-2xl">
            <BookOpen size={20} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Avg Course Progress</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1 tabular-nums">
              74.2%
            </h2>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
            <Award size={20} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ADD/EDIT LMS COURSE FORM */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 select-none">
            <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">
              {isEditing ? 'Edit LMS Course' : 'Create LMS Lecture'}
            </h3>
            <GraduationCap size={16} className="text-indigo-600" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-gray-700">
            
            {/* Course Title */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Course Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Introduction to Solar Energy & Cells ☀️"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
            </div>

            {/* Subject Selector */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Subject *</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer"
              >
                {subjects.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Class / Grade Target */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Target Class / Grade *</label>
              <select
                value={gradeClass}
                onChange={(e) => setGradeClass(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer"
              >
                {grades.map((g, idx) => (
                  <option key={idx} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Instructor */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Instructor Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Sarah Jenkins"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
            </div>

            {/* Course Duration */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Lecture Duration (e.g. 45 Mins)</label>
              <input
                type="text"
                placeholder="e.g. 45 Mins"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
            </div>

            {/* Key Concepts description */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Key Concepts Description *</label>
              <textarea
                required
                rows={4}
                placeholder="e.g. Understanding solar cells; Photovoltaic circuits; Slices wholes; ground filtration..."
                value={concepts}
                onChange={(e) => setConcepts(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold leading-relaxed resize-none"
              />
              <span className="block text-[8px] text-gray-400 font-medium">Please separate distinct syllabus key concepts with semicolons (;) to format them inside the user player dashboard!</span>
            </div>

            {/* VIDEO FILE UPLOAD ZONE */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Lecture Video File *</label>
              <input
                type="file"
                ref={videoInputRef}
                accept="video/*"
                onChange={handleVideoFileChange}
                className="hidden"
              />

              <div 
                onClick={() => videoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all hover:bg-gray-50/70 bg-white ${
                  videoPreview ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-250'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5 select-none">
                  {videoPreview ? (
                    <>
                      <CheckCircle size={24} className="text-emerald-500" />
                      <span className="text-emerald-700 font-extrabold text-[10px] uppercase tracking-wide">Lecture Video Loaded!</span>
                      <span className="text-[8px] text-gray-400 truncate max-w-[200px]">
                        {videoFile ? videoFile.name : 'Attached video preset'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400" />
                      <span className="text-gray-700 font-black">Choose lecture video file</span>
                      <span className="text-[8px] text-gray-400">mp4 or mov formats supported</span>
                    </>
                  )}
                </div>
              </div>
              <input
                type="url"
                placeholder="Video URL (optional) — https://example.com/lecture.mp4"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold text-[11px]"
              />
              <span className="block text-[8px] text-gray-400 font-medium">
                Upload a video file or paste a hosted video link to save the lecture.
              </span>
            </div>

            {/* THUMBNAIL COVER IMAGE FILE UPLOAD ZONE */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Course Cover Image *</label>
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                onChange={handleCoverFileChange}
                className="hidden"
              />

              <div 
                onClick={() => coverInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all hover:bg-gray-50/70 bg-white ${
                  coverPreview ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-250'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5 select-none">
                  {coverPreview ? (
                    <div className="flex items-center gap-3 text-left">
                      <img 
                        src={coverPreview} 
                        alt="lms cover preview" 
                        className="w-10 h-10 object-cover rounded-lg border border-emerald-100"
                      />
                      <div>
                        <span className="block text-emerald-700 font-extrabold text-[10px] uppercase tracking-wide">Cover Loaded!</span>
                        <span className="block text-[8px] text-gray-400 truncate max-w-[150px]">
                          {coverFile ? coverFile.name : 'Sample cover preview set'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={24} className="text-gray-400" />
                      <span className="text-gray-700 font-black">Choose course cover image</span>
                      <span className="text-[8px] text-gray-400">Accepts png or jpeg</span>
                    </>
                  )}
                </div>
              </div>
              <input
                type="url"
                placeholder="Cover image URL (optional) — https://example.com/cover.jpg"
                value={thumbnailUrlInput}
                onChange={(e) => setThumbnailUrlInput(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold text-[11px]"
              />
              <span className="block text-[8px] text-gray-400 font-medium">
                Use a URL or upload a cover image file.
              </span>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none pt-1">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
              />
              <span>Active (Publish on Student Learning Hub)</span>
            </label>

            {/* Form actions */}
            <div className="pt-4 space-y-2 select-none">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#0B1528] hover:bg-[#15253F] disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-xs"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>{isEditing ? 'Update Lecture Details' : 'Upload Lecture'}</span>
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

        {/* RIGHT COLUMN: LMS COURSES CATALOG */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider border-b border-gray-100 pb-3 select-none">
            Learning Catalog Directory
          </h3>

          {(!authReady || loading) ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No platform lectures yet. Create one using the form.</p>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {courses.map((c) => (
              <div 
                key={c.id}
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-150 transition-all flex flex-col group"
              >
                
                {/* Course Cover preview with glowing Play */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden cursor-pointer select-none">
                  <img
                    src={c.thumbnailUrl}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />

                  {/* Dimming */}
                  <div className="absolute inset-0 bg-black/35 transition-opacity group-hover:bg-black/45" />

                  {/* Play Overlay */}
                  <div 
                    onClick={() => setPlayingCourse(c)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 text-black hover:bg-indigo-600 hover:text-white p-3.5 rounded-full shadow-lg transition-all scale-95 group-hover:scale-110"
                  >
                    <Play size={16} className="fill-current stroke-none ml-0.5" />
                  </div>

                  {/* Subject and Class label badges overlay */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10">
                      {c.subject}
                    </span>
                    <span className="bg-sky-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10">
                      {c.gradeClass}
                    </span>
                  </div>

                  {/* Enrolled overlay bottom right */}
                  <div className="absolute bottom-3 right-3 bg-black/60 border border-white/10 rounded-lg px-2 py-0.5 text-[8px] font-black text-gray-300">
                    👥 {c.studentsEnrolled.toLocaleString()}
                  </div>
                </div>

                {/* Course Metadata details */}
                <div className="p-4 flex-1 flex flex-col justify-between text-left space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400">
                      <Clock size={11} className="text-gray-300" />
                      <span>{c.duration} Duration</span>
                    </div>

                    <h4 className="text-xs font-black text-gray-900 leading-snug line-clamp-2 select-text">
                      {c.title}
                    </h4>

                    <div className="flex items-center gap-1 text-[9px] text-gray-500 font-semibold pt-1">
                      <User size={10} className="text-gray-300" />
                      <span>Instructor: <span className="text-gray-800 font-bold select-text">{c.instructor}</span></span>
                    </div>
                  </div>

                  {/* Bullet outline preview snippet */}
                  <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-150/50">
                    <span className="block text-[8px] font-black uppercase text-gray-400 tracking-wider mb-1 select-none">Concepts Snippet</span>
                    <p className="text-[9px] text-gray-400 font-semibold leading-relaxed line-clamp-2 select-text">
                      {c.concepts}
                    </p>
                  </div>

                </div>

                {/* Actions bottom footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between select-none">
                  
                  {/* Status Badges */}
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                    c.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                  }`}>
                    {c.status}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEdit(c)}
                      className="bg-white hover:bg-indigo-50 border border-gray-200 text-gray-700 hover:text-indigo-600 p-2 rounded-xl shadow-xs transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={11} className="stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
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

      {/* FLOATING LMS VIDEO PLAYER OVERLAY MODAL */}
      {playingCourse && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
          
          <div className="bg-[#0B1528] w-full max-w-[680px] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Column: Educational video canvas */}
            <div className="relative md:w-3/5 aspect-video md:aspect-auto bg-black flex flex-col justify-center">
              <video
                src={playingCourse.videoUrl}
                className="w-full h-full object-contain"
                controls
                autoPlay
                loop
                playsInline
              />

              <div className="absolute top-4 left-4">
                <span className="bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow">
                  🎓 {playingCourse.subject}
                </span>
              </div>
            </div>

            {/* Right Column: Key Syllabus Concepts & details */}
            <div className="md:w-2/5 p-6 text-white text-left flex flex-col justify-between space-y-4 bg-[#141B2D]">
              
              {/* Header block */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="bg-sky-500/25 border border-sky-400/25 text-sky-300 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                    {playingCourse.gradeClass}
                  </span>
                  
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setPlayingCourse(null)}
                    className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <h4 className="text-sm font-black leading-snug tracking-tight text-white select-text">
                  {playingCourse.title}
                </h4>

                <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold select-none">
                  <User size={11} className="text-gray-500" />
                  <span>Instructor: <span className="text-gray-200 select-text">{playingCourse.instructor}</span></span>
                </div>
              </div>

              {/* key Syllabus concepts outline (custom bullet render splits semicolons) */}
              <div className="flex-1 bg-black/20 border border-white/5 rounded-2xl p-4 overflow-y-auto max-h-[180px] space-y-2">
                <span className="block text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 select-none">
                  📚 Key Concepts covered
                </span>
                
                <ul className="space-y-2 text-[10px] text-gray-300 font-semibold leading-relaxed">
                  {playingCourse.concepts.split(';').map((bullet, idx) => {
                    const cleanText = bullet.trim();
                    if (!cleanText) return null;
                    return (
                      <li key={idx} className="flex items-start gap-2 select-text">
                        <span className="text-indigo-400 mt-0.5">●</span>
                        <span>{cleanText}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Footer specs */}
              <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold pt-3 border-t border-white/5 select-none">
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-gray-500" />
                  Duration: {playingCourse.duration}
                </span>

                <span className="flex items-center gap-1">
                  👥 {playingCourse.studentsEnrolled.toLocaleString()} enrolled
                </span>
              </div>

            </div>

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

export default LMSManagement;
