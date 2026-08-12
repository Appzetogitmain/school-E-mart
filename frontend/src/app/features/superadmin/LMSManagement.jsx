import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  GraduationCap, Film, Plus, Edit3, Trash2, BookOpen, Clock, Play, X, ChevronRight, CheckCircle, Info, Upload, Image as ImageIcon, User, Award, Tag, Loader2, ArrowLeft, Video, Settings, Camera
} from 'lucide-react';
import {
  listPlatformCourses,
  createPlatformCourse,
  updatePlatformCourse,
  deletePlatformCourse,
  listPlatformLessons,
  createPlatformLesson,
  updatePlatformLesson,
  deletePlatformLesson,
  listLmsSubjects,
  createLmsSubject,
  deleteLmsSubject,
  listLmsGrades,
  createLmsGrade,
  deleteLmsGrade,
  listLmsGradeSuggestions,
  uploadAdminMediaWithProgress,
  getLmsSettings,
  updateLmsSettings,
} from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapPlatformCourseForAdmin, mapAdminCourseToPayload } from '../../../utils/mappers/adminLmsMapper';
import useAuthReady from '../../../hooks/useAuthReady';
import { toAbsoluteUrl } from '../../../utils/url';

// A course can target every grade at once rather than one specific class —
// this is a picker-only sentinel, never stored as a deletable grade option.
const ALL_GRADES = 'All Grades';

const uploadLmsFileWithProgress = async (file, purpose, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', purpose);
  const attachment = await uploadAdminMediaWithProgress(formData, onProgress);
  return attachment?.url || attachment?.storageKey || '';
};

const resolveCoverUrl = async (preview, file, urlInput = '', existingUrl = '') => {
  const normalizedInput = urlInput?.trim();
  if (normalizedInput) {
    if (!/^https?:\/\//i.test(normalizedInput)) {
      throw new Error('Please provide a valid cover image URL starting with http:// or https://');
    }
    return normalizedInput;
  }
  if (preview?.startsWith('http://') || preview?.startsWith('https://') || preview?.startsWith('/uploads/')) {
    return preview;
  }
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'lms_thumb');
    const attachment = await uploadAdminMediaWithProgress(formData);
    return attachment?.url || attachment?.storageKey || '';
  }
  return existingUrl || '';
};

const LMSManagement = () => {
  const authReady = useAuthReady();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Subjects and Grades are both dynamic, admin-managed lists (not
  // hardcoded) — see the "Manage Subjects" / "Manage Grades" modals further
  // down. Grades differ, since every school defines its own grade/class
  // names — the modal surfaces the real ones in use across schools to add
  // from, instead of the admin guessing labels that may not match anyone.
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false);
  const [newSubjectLabel, setNewSubjectLabel] = useState('');
  const [savingSubject, setSavingSubject] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);
  const [subjectManagerError, setSubjectManagerError] = useState('');

  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [gradeSuggestions, setGradeSuggestions] = useState([]);
  const [isGradeManagerOpen, setIsGradeManagerOpen] = useState(false);
  const [newGradeLabel, setNewGradeLabel] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [deletingGradeId, setDeletingGradeId] = useState(null);
  const [gradeManagerError, setGradeManagerError] = useState('');

  // Course Form input states
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editCourseId, setEditCourseId] = useState(null);

  const [courseTitle, setCourseTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeClass, setGradeClass] = useState(ALL_GRADES);
  const [instructor, setInstructor] = useState('');
  const [concepts, setConcepts] = useState('');
  const [duration, setDuration] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [thumbnailUrlInput, setThumbnailUrlInput] = useState('');

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const coverInputRef = useRef(null);
  const coverCameraInputRef = useRef(null);

  // Lesson Management view state
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  // Add / Edit Lesson form state inside course
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [editLessonId, setEditLessonId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonVideoUrlInput, setLessonVideoUrlInput] = useState('');
  const [lessonVideoFile, setLessonVideoFile] = useState(null);
  const [lessonVideoPreview, setLessonVideoPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const lessonVideoInputRef = useRef(null);

  // LMS Settings (Video upload size limit)
  const [lmsSettings, setLmsSettings] = useState({ maxVideoSizeMB: 500 });
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [newLimitMB, setNewLimitMB] = useState(500);
  const [savingLimit, setSavingLimit] = useState(false);

  // Video Playing Modal state
  const [playingVideoUrl, setPlayingVideoUrl] = useState(null);
  const [playingVideoTitle, setPlayingVideoTitle] = useState('');

  const loadLmsSettings = useCallback(async () => {
    try {
      const res = await getLmsSettings();
      if (res?.maxVideoSizeMB) {
        setLmsSettings(res);
        setNewLimitMB(res.maxVideoSizeMB);
      }
    } catch {
      // Fall back to 500MB default
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    loadLmsSettings();
  }, [authReady, loadLmsSettings]);

  const handleUpdateLmsLimit = async (e) => {
    e.preventDefault();
    const mb = Number(newLimitMB);
    if (!mb || mb < 10 || mb > 5000) {
      alert('Please enter a valid video size limit between 10 MB and 5000 MB');
      return;
    }

    setSavingLimit(true);
    try {
      const updated = await updateLmsSettings({ maxVideoSizeMB: mb });
      setLmsSettings(updated);
      setIsLimitModalOpen(false);
      alert(`Video size limit updated successfully to ${mb} MB!`);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to update video limit'));
    } finally {
      setSavingLimit(false);
    }
  };

  const handleLessonVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMb = lmsSettings.maxVideoSizeMB || 500;
    const maxBytes = maxMb * 1024 * 1024;

    if (file.size > maxBytes) {
      const selectedMb = (file.size / (1024 * 1024)).toFixed(1);
      alert(
        `File Size Limit Exceeded!\n\nThe selected video file "${file.name}" is ${selectedMb} MB, which exceeds the current limit of ${maxMb} MB.\n\nPlease select a smaller file or click "Configure Limit" to increase the maximum allowed size.`
      );
      e.target.value = '';
      return;
    }

    setLessonVideoFile(file);
    setLessonVideoUrlInput('');
    setLessonVideoPreview(URL.createObjectURL(file));
  };

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

  const loadSubjects = useCallback(async () => {
    setSubjectsLoading(true);
    try {
      const data = await listLmsSubjects();
      setSubjects(data || []);
      // Default the course form to the first available subject once loaded,
      // but never override a value the admin (or an edit-in-progress) already set.
      setSubject((prev) => prev || data?.[0]?.label || '');
    } catch {
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    loadSubjects();
  }, [authReady, loadSubjects]);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    const label = newSubjectLabel.trim();
    if (!label) return;

    setSubjectManagerError('');
    setSavingSubject(true);
    try {
      const created = await createLmsSubject({ label });
      setSubjects((prev) => [...prev, created].sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label)));
      setNewSubjectLabel('');
      // A freshly-added subject is almost certainly the one about to be used.
      setSubject(created.label);
    } catch (err) {
      setSubjectManagerError(getErrorMessage(err, 'Unable to add subject'));
    } finally {
      setSavingSubject(false);
    }
  };

  const handleDeleteSubject = async (subjectToDelete) => {
    if (!window.confirm(`Delete the "${subjectToDelete.label}" subject?`)) return;
    setSubjectManagerError('');
    setDeletingSubjectId(subjectToDelete._id);
    try {
      await deleteLmsSubject(subjectToDelete._id);
      setSubjects((prev) => prev.filter((s) => s._id !== subjectToDelete._id));
      if (subject === subjectToDelete.label) {
        setSubject('');
      }
    } catch (err) {
      // e.g. "3 courses still use this subject" — surfaced from the backend guard.
      setSubjectManagerError(getErrorMessage(err, 'Unable to delete subject'));
    } finally {
      setDeletingSubjectId(null);
    }
  };

  const loadGrades = useCallback(async () => {
    setGradesLoading(true);
    try {
      const data = await listLmsGrades();
      setGrades(data || []);
    } catch {
      setGrades([]);
    } finally {
      setGradesLoading(false);
    }
  }, []);

  const loadGradeSuggestions = useCallback(async () => {
    try {
      const data = await listLmsGradeSuggestions();
      setGradeSuggestions(data || []);
    } catch {
      setGradeSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    loadGrades();
    loadGradeSuggestions();
  }, [authReady, loadGrades, loadGradeSuggestions]);

  const addGrade = async (label) => {
    const trimmed = label.trim();
    if (!trimmed) return;

    setGradeManagerError('');
    setSavingGrade(true);
    try {
      const created = await createLmsGrade({ label: trimmed });
      setGrades((prev) => [...prev, created].sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label)));
      setGradeSuggestions((prev) => prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()));
      setNewGradeLabel('');
      setGradeClass(created.label);
    } catch (err) {
      setGradeManagerError(getErrorMessage(err, 'Unable to add grade'));
    } finally {
      setSavingGrade(false);
    }
  };

  const handleAddGrade = (e) => {
    e.preventDefault();
    addGrade(newGradeLabel);
  };

  const handleDeleteGrade = async (gradeToDelete) => {
    if (!window.confirm(`Delete the "${gradeToDelete.label}" grade?`)) return;
    setGradeManagerError('');
    setDeletingGradeId(gradeToDelete._id);
    try {
      await deleteLmsGrade(gradeToDelete._id);
      setGrades((prev) => prev.filter((g) => g._id !== gradeToDelete._id));
      setGradeSuggestions((prev) => [...prev, gradeToDelete.label].sort((a, b) => a.localeCompare(b)));
      if (gradeClass === gradeToDelete.label) {
        setGradeClass(ALL_GRADES);
      }
    } catch (err) {
      // e.g. "3 courses still use this grade" — surfaced from the backend guard.
      setGradeManagerError(getErrorMessage(err, 'Unable to delete grade'));
    } finally {
      setDeletingGradeId(null);
    }
  };

  const loadLessonsForCourse = useCallback(async (courseId) => {
    setLessonsLoading(true);
    try {
      const { data } = await listPlatformLessons(courseId, { limit: 100 });
      setLessons(data || []);
    } catch (err) {
      setLessons([]);
      console.error('Failed to load lessons:', err);
    } finally {
      setLessonsLoading(false);
    }
  }, []);

  const openLessonsManager = (course) => {
    setSelectedCourseForLessons(course);
    resetLessonForm();
    loadLessonsForCourse(course.id);
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };



  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    if (!courseTitle.trim() || !instructor.trim()) {
      alert('Please fill out Course Title and Instructor Name.');
      return;
    }

    setSaving(true);
    try {
      const existingCourse = isEditingCourse ? courses.find((c) => c.id === editCourseId) : null;
      const resolvedCoverUrl = await resolveCoverUrl(
        coverPreview,
        coverFile,
        thumbnailUrlInput,
        existingCourse?.thumbnailUrl
      );

      const payload = mapAdminCourseToPayload({
        title: courseTitle,
        subject,
        gradeClass,
        instructor,
        concepts,
        duration,
        thumbnailUrl: resolvedCoverUrl,
        isActive,
      });

      if (isEditingCourse) {
        const updated = await updatePlatformCourse(editCourseId, payload);
        setCourses((prev) =>
          prev.map((c) => (c.id === editCourseId ? mapPlatformCourseForAdmin(updated) : c))
        );
        alert('LMS course updated successfully!');
        resetCourseForm();
      } else {
        const created = await createPlatformCourse(payload);
        setCourses((prev) => [mapPlatformCourseForAdmin(created), ...prev]);
        alert('LMS course created successfully! Now add video lessons to this course.');
        resetCourseForm();
      }
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to save LMS course'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditCourse = (course) => {
    setIsEditingCourse(true);
    setEditCourseId(course.id);
    setCourseTitle(course.title);
    setSubject(course.subject);
    setGradeClass(course.gradeClass);
    setInstructor(course.instructor);
    setConcepts(course.concepts);
    setDuration(course.duration);
    setIsActive(course.status === 'Active');
    setThumbnailUrlInput(course.thumbnailUrl?.startsWith('http') ? course.thumbnailUrl : '');
    setCoverPreview(course.thumbnailUrl || '');
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this LMS course?')) return;
    try {
      await deletePlatformCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      if (selectedCourseForLessons?.id === id) {
        setSelectedCourseForLessons(null);
      }
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to delete LMS course'));
    }
  };

  const resetCourseForm = () => {
    setIsEditingCourse(false);
    setEditCourseId(null);
    setCourseTitle('');
    setSubject(subjects[0]?.label || '');
    setGradeClass(ALL_GRADES);
    setInstructor('');
    setConcepts('');
    setDuration('');
    setIsActive(true);
    setThumbnailUrlInput('');
    setCoverFile(null);
    setCoverPreview('');
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseForLessons) return;
    if (!lessonTitle.trim()) {
      alert('Please enter a lesson title');
      return;
    }

    if (!lessonVideoUrlInput.trim() && !lessonVideoFile && !lessonVideoPreview) {
      alert('Please upload a video file or provide a video URL');
      return;
    }

    setIsUploadingVideo(true);
    setUploadProgress(0);

    try {
      let videoUrl = lessonVideoUrlInput.trim();
      if (lessonVideoFile) {
        videoUrl = await uploadLmsFileWithProgress(
          lessonVideoFile,
          'lms_video',
          (percent) => setUploadProgress(percent)
        );
      }

      const payload = {
        title: lessonTitle.trim(),
        description: lessonDescription.trim(),
        contentHtml: videoUrl,
        lessonType: 'video',
        visibility: 'visible',
        status: 'published',
      };

      if (isEditingLesson) {
        const updated = await updatePlatformLesson(selectedCourseForLessons.id, editLessonId, payload);
        setLessons((prev) => prev.map((l) => (l._id === editLessonId ? updated : l)));
        alert('Video lesson updated successfully!');
      } else {
        const created = await createPlatformLesson(selectedCourseForLessons.id, payload);
        setLessons((prev) => [...prev, created]);
        alert('Video lesson added successfully!');
      }

      resetLessonForm();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to save lesson'));
    } finally {
      setIsUploadingVideo(false);
      setUploadProgress(0);
    }
  };

  const handleEditLesson = (lesson) => {
    setIsEditingLesson(true);
    setEditLessonId(lesson._id);
    setLessonTitle(lesson.title || '');
    setLessonDescription(lesson.description || '');
    const vUrl = lesson.contentHtml || lesson.videoUrl || '';
    setLessonVideoUrlInput(vUrl.startsWith('http') ? vUrl : '');
    setLessonVideoPreview(vUrl ? toAbsoluteUrl(vUrl) : '');
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this video lesson?')) return;
    try {
      await deletePlatformLesson(selectedCourseForLessons.id, lessonId);
      setLessons((prev) => prev.filter((l) => (l._id || l.id) !== lessonId));
      if (editLessonId === lessonId) {
        resetLessonForm();
      }
      alert('Video lesson deleted successfully!');
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete lesson'));
    }
  };

  const resetLessonForm = () => {
    setIsEditingLesson(false);
    setEditLessonId(null);
    setLessonTitle('');
    setLessonDescription('');
    setLessonVideoUrlInput('');
    setLessonVideoFile(null);
    setLessonVideoPreview('');
    setUploadProgress(0);
  };

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
              <GraduationCap size={20} />
            </span>
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">LMS (Learning Management System)</h1>
          </div>
          <p className="text-xs text-gray-500 font-bold mt-1">Create courses, manage video lectures, and publish directly to the Student/Parent Learning Hub</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewLimitMB(lmsSettings.maxVideoSizeMB || 500);
            setIsLimitModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl font-black text-xs flex items-center gap-2 border border-indigo-200/60 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Settings size={15} className="text-indigo-600" />
          <span>Video Upload Limit: <strong className="text-indigo-900 font-extrabold">{lmsSettings.maxVideoSizeMB || 500} MB</strong></span>
        </button>
      </div>

      {/* TWO COLUMN GRID PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CREATE / EDIT COURSE FORM */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 select-none">
            <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">
              {isEditingCourse ? 'Edit Course Details' : 'Create New Course'}
            </h3>
            <GraduationCap size={16} className="text-indigo-600" />
          </div>

          <form onSubmit={handleCourseSubmit} className="space-y-4 text-xs font-bold text-gray-700">
            
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Subject *</label>
                  <button
                    type="button"
                    onClick={() => setIsSubjectManagerOpen(true)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-[9px] font-black uppercase tracking-wide"
                    title="Add or remove subjects"
                  >
                    <Settings size={10} /> Manage
                  </button>
                </div>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={subjectsLoading}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer disabled:opacity-60"
                >
                  {subjectsLoading ? (
                    <option value="">Loading…</option>
                  ) : subjects.length === 0 ? (
                    <option value="">No subjects yet — click Manage</option>
                  ) : (
                    subjects.map((s) => (
                      <option key={s._id} value={s.label}>{s.label}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Target Grade *</label>
                  <button
                    type="button"
                    onClick={() => setIsGradeManagerOpen(true)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-[9px] font-black uppercase tracking-wide"
                    title="Add or remove grades"
                  >
                    <Settings size={10} /> Manage
                  </button>
                </div>
                <select
                  value={gradeClass}
                  onChange={(e) => setGradeClass(e.target.value)}
                  disabled={gradesLoading}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer disabled:opacity-60"
                >
                  <option value={ALL_GRADES}>{ALL_GRADES}</option>
                  {gradesLoading ? (
                    <option value="" disabled>Loading…</option>
                  ) : (
                    grades.map((g) => (
                      <option key={g._id} value={g.label}>{g.label}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

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

            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Overall Course Duration</label>
              <input
                type="text"
                placeholder="e.g. 4 Hours (12 Lessons)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Key Concepts Description</label>
              <textarea
                rows={3}
                placeholder="e.g. Understanding solar cells; Photovoltaic circuits; Slices wholes..."
                value={concepts}
                onChange={(e) => setConcepts(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold leading-relaxed resize-none"
              />
            </div>

            {/* THUMBNAIL COVER IMAGE */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Course Cover Image *</label>
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
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all bg-white ${
                  coverPreview ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-250'
                }`}
              >
                <div className="flex flex-col items-center gap-2 select-none">
                  {coverPreview ? (
                    <div className="flex items-center gap-3 text-left">
                      <img
                        src={coverPreview.startsWith('blob:') || coverPreview.startsWith('data:') ? coverPreview : toAbsoluteUrl(coverPreview)}
                        alt="lms cover preview"
                        className="w-10 h-10 object-cover rounded-lg border border-emerald-100"
                      />
                      <div>
                        <span className="block text-emerald-700 font-extrabold text-[10px] uppercase tracking-wide">Cover Image Set!</span>
                        <span className="block text-[8px] text-gray-400">Use the buttons below to replace it</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={20} className="text-gray-400" />
                      <span className="text-gray-700 font-black">Choose course cover photo</span>
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
              <input
                type="url"
                placeholder="Or paste image URL (https://...)"
                value={thumbnailUrlInput}
                onChange={(e) => setThumbnailUrlInput(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold text-[11px]"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none pt-1">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
              />
              <span>Published (Visible on Student Learning Hub)</span>
            </label>

            <div className="pt-2 space-y-2 select-none">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#0B1528] hover:bg-[#15253F] disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-xs"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>{isEditingCourse ? 'Update Course Details' : 'Create Course'}</span>
              </button>

              {isEditingCourse && (
                <button
                  type="button"
                  onClick={resetCourseForm}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl transition-all"
                >
                  Cancel Edit
                </button>
              )}
            </div>

          </form>

        </div>

        {/* RIGHT COLUMN: LMS COURSES CATALOG & LESSONS MANAGER */}
        <div className="lg:col-span-7 space-y-6">

          {/* COURSE LIST DIRECTORY */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 select-none">
              <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">
                Platform Courses Directory
              </h3>
              <span className="text-xs font-bold text-gray-400">{courses.length} Courses</span>
            </div>

            {(!authReady || loading) ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-indigo-600" />
              </div>
            ) : error ? (
              <p className="text-sm text-red-500 text-center py-8">{error}</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No platform courses yet. Create one using the form.</p>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {courses.map((c) => (
                <div 
                  key={c.id}
                  className={`bg-white border rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group ${
                    selectedCourseForLessons?.id === c.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 hover:border-indigo-150'
                  }`}
                >
                  
                  {/* Cover preview */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden cursor-pointer select-none">
                    <img
                      src={c.thumbnailUrl ? toAbsoluteUrl(c.thumbnailUrl) : 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80'}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />

                    <div className="absolute inset-0 bg-black/35 transition-opacity group-hover:bg-black/45" />

                    {/* Subject and Class badges */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10">
                        {c.subject}
                      </span>
                      <span className="bg-sky-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10">
                        {c.gradeClass}
                      </span>
                    </div>

                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                      c.status === 'Active' 
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm' 
                        : 'bg-yellow-500 text-white border-yellow-400 shadow-sm'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  {/* Course Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between text-left space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400">
                        <Clock size={11} className="text-gray-300" />
                        <span>{c.duration || 'Flexible duration'}</span>
                      </div>

                      <h4 className="text-xs font-black text-gray-900 leading-snug line-clamp-2 select-text">
                        {c.title}
                      </h4>

                      <div className="flex items-center gap-1 text-[9px] text-gray-500 font-semibold pt-0.5">
                        <User size={10} className="text-gray-300" />
                        <span>Instructor: <span className="text-gray-800 font-bold select-text">{c.instructor}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions bottom footer */}
                  <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between select-none gap-2">
                    
                    <button
                      type="button"
                      onClick={() => openLessonsManager(c)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-xs font-black transition-colors"
                    >
                      <Film size={13} />
                      <span>Manage Videos</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditCourse(c)}
                        className="bg-white hover:bg-indigo-50 border border-gray-200 text-gray-700 hover:text-indigo-600 p-2 rounded-xl shadow-xs transition-colors"
                        title="Edit Course"
                      >
                        <Edit3 size={11} className="stroke-[2.5]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(c.id)}
                        className="bg-white hover:bg-rose-50 border border-gray-200 text-gray-700 hover:text-rose-600 p-2 rounded-xl shadow-xs transition-colors"
                        title="Delete Course"
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

          {/* MANAGING LESSONS & UPLOADING VIDEOS PANEL FOR SELECTED COURSE */}
          {selectedCourseForLessons && (
            <div className="bg-white rounded-3xl border border-indigo-200 p-6 space-y-6 text-left shadow-lg animate-in fade-in">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white p-1.5 rounded-lg">
                    <Film size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">
                      Video Lessons: {selectedCourseForLessons.title}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-bold block">
                      {selectedCourseForLessons.subject} • {selectedCourseForLessons.gradeClass}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCourseForLessons(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Add / Edit Video Lesson Form */}
              <form onSubmit={handleLessonSubmit} className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100 space-y-4 text-xs font-bold text-gray-700">
                <span className="text-[10px] font-black uppercase text-[#3b2d7d] tracking-wider block">
                  {isEditingLesson ? 'Edit Video Lesson' : '+ Add New Video Lesson'}
                </span>

                <div className="space-y-1">
                  <label className="block text-gray-500 text-[10px]">Lesson Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chapter 1: Introduction to Photovoltaic Circuits"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 font-bold text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-500 text-[10px]">Lesson Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Brief summary of what this video lesson covers"
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 font-bold text-xs"
                  />
                </div>

                {/* UPLOAD VIDEO ZONE WITH REAL-TIME PROGRESS BAR */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 font-bold">Upload Video File (MP4/MOV) *</span>
                    <span className="flex items-center gap-1 text-purple-700 font-extrabold bg-purple-100/70 px-2 py-0.5 rounded-md border border-purple-200/50">
                      <span>Max limit: {lmsSettings.maxVideoSizeMB || 500} MB</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewLimitMB(lmsSettings.maxVideoSizeMB || 500);
                          setIsLimitModalOpen(true);
                        }}
                        className="underline text-indigo-700 hover:text-indigo-900 ml-1 font-black cursor-pointer"
                      >
                        Change
                      </button>
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={lessonVideoInputRef}
                    accept=".mp4,.mov,.webm,.mkv"
                    onChange={handleLessonVideoFileChange}
                    className="hidden"
                  />

                  <div 
                    onClick={() => lessonVideoInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all hover:bg-white bg-white/80 ${
                      lessonVideoPreview ? 'border-emerald-300 bg-emerald-50/20' : 'border-purple-200'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1 select-none">
                      {lessonVideoPreview ? (
                        <div className="flex items-center justify-between w-full px-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                            <div className="flex flex-col text-left min-w-0">
                              <span className="text-emerald-800 font-extrabold text-xs">Video Attached!</span>
                              <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                                {lessonVideoFile ? lessonVideoFile.name : 'Uploaded Server Video'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLessonVideoFile(null);
                              setLessonVideoPreview('');
                              setLessonVideoUrlInput('');
                              if (lessonVideoInputRef.current) lessonVideoInputRef.current.value = '';
                            }}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-bold text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                            title="Remove attached video"
                          >
                            <Trash2 size={13} />
                            <span>Remove Video</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload size={20} className="text-purple-600" />
                          <span className="text-purple-900 font-black text-xs">Click to select MP4/MOV video</span>
                          <span className="text-[9px] text-gray-500 font-bold">
                            Max Allowed Size: <strong className="text-purple-700 font-extrabold">{lmsSettings.maxVideoSizeMB || 500} MB</strong> (Server Stream Direct)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* REALTIME UPLOAD PROGRESS BAR */}
                  {isUploadingVideo && (
                    <div className="space-y-1.5 bg-white p-3 rounded-xl border border-indigo-100">
                      <div className="flex items-center justify-between text-xs font-black text-indigo-900">
                        <span>Uploading Video File...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-150 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-200 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-1">
                    <input
                      type="url"
                      placeholder="Or paste external Hosted Video URL (https://...)"
                      value={lessonVideoUrlInput}
                      onChange={(e) => setLessonVideoUrlInput(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {isEditingLesson && (
                    <button
                      type="button"
                      onClick={resetLessonForm}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isUploadingVideo}
                    className="px-5 py-2 bg-[#3b2d7d] hover:bg-[#5942bc] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {isUploadingVideo && <Loader2 size={13} className="animate-spin" />}
                    <span>{isEditingLesson ? 'Update Lesson' : 'Save & Publish Video Lesson'}</span>
                  </button>
                </div>
              </form>

              {/* LIST OF LESSONS IN COURSE */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                  Lessons List ({lessons.length})
                </h4>

                {lessonsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 size={22} className="animate-spin text-indigo-600" />
                  </div>
                ) : lessons.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No video lessons uploaded yet. Add the first lesson above.</p>
                ) : (
                  <div className="space-y-2">
                    {lessons.map((lesson, index) => {
                      const vUrl = lesson.contentHtml || lesson.videoUrl || '';
                      return (
                        <div 
                          key={lesson._id}
                          className="bg-white border border-gray-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-indigo-200 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-purple-50 text-[#3b2d7d] font-black text-xs flex items-center justify-center shrink-0 border border-purple-100">
                              {index + 1}
                            </span>
                            <div>
                              <h5 className="text-xs font-black text-gray-900 leading-tight">{lesson.title}</h5>
                              {lesson.description && (
                                <span className="text-[10px] text-gray-400 font-bold block mt-0.5">{lesson.description}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {vUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPlayingVideoUrl(toAbsoluteUrl(vUrl));
                                  setPlayingVideoTitle(lesson.title);
                                }}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[11px] rounded-xl flex items-center gap-1 transition-colors"
                              >
                                <Play size={12} className="fill-current stroke-none" />
                                <span>Preview</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleEditLesson(lesson)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit3 size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteLesson(lesson._id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* FLOATING LMS VIDEO PLAYER OVERLAY MODAL */}
      {playingVideoUrl && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
          <div className="bg-[#0B1528] w-full max-w-[720px] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-4 bg-[#141B2D] text-white flex items-center justify-between border-b border-white/10">
              <h4 className="text-xs font-black tracking-wide truncate">{playingVideoTitle || 'Video Preview'}</h4>
              <button
                type="button"
                onClick={() => setPlayingVideoUrl(null)}
                className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <video
                src={playingVideoUrl}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* MANAGE SUBJECTS MODAL */}
      {isSubjectManagerOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

            <div className="p-5 bg-[#0B1528] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Tag size={15} />
                <h4 className="text-sm font-black tracking-wide">Manage Subjects</h4>
              </div>
              <button
                type="button"
                onClick={() => { setIsSubjectManagerOpen(false); setSubjectManagerError(''); setNewSubjectLabel(''); }}
                className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="p-4 border-b border-gray-100 flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={newSubjectLabel}
                onChange={(e) => setNewSubjectLabel(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
              />
              <button
                type="submit"
                disabled={savingSubject || !newSubjectLabel.trim()}
                className="flex items-center gap-1 bg-[#0B1528] hover:bg-[#15253F] disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all shrink-0"
              >
                {savingSubject ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Add
              </button>
            </form>

            {subjectManagerError && (
              <p className="px-4 pt-3 text-[10px] font-bold text-red-600">{subjectManagerError}</p>
            )}

            <div className="p-4 space-y-2 overflow-y-auto">
              {subjectsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-indigo-600" />
                </div>
              ) : subjects.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No subjects yet — add the first one above.</p>
              ) : (
                subjects.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5"
                  >
                    <span className="text-xs font-bold text-gray-800">{s.label}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(s)}
                      disabled={deletingSubjectId === s._id}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                      title={`Delete "${s.label}"`}
                    >
                      {deletingSubjectId === s._id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* MANAGE GRADES MODAL */}
      {isGradeManagerOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

            <div className="p-5 bg-[#0B1528] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <GraduationCap size={15} />
                <h4 className="text-sm font-black tracking-wide">Manage Grades</h4>
              </div>
              <button
                type="button"
                onClick={() => { setIsGradeManagerOpen(false); setGradeManagerError(''); setNewGradeLabel(''); }}
                className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddGrade} className="p-4 border-b border-gray-100 flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="e.g. Class 9 or Nursery"
                value={newGradeLabel}
                onChange={(e) => setNewGradeLabel(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
              />
              <button
                type="submit"
                disabled={savingGrade || !newGradeLabel.trim()}
                className="flex items-center gap-1 bg-[#0B1528] hover:bg-[#15253F] disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all shrink-0"
              >
                {savingGrade ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Add
              </button>
            </form>

            {gradeManagerError && (
              <p className="px-4 pt-3 text-[10px] font-bold text-red-600">{gradeManagerError}</p>
            )}

            {/* Real grade/class names schools actually use — every school
                names its own grades, so this beats the admin guessing. */}
            {gradeSuggestions.length > 0 && (
              <div className="px-4 pt-3 space-y-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Suggested from schools</span>
                <div className="flex flex-wrap gap-1.5">
                  {gradeSuggestions.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => addGrade(label)}
                      disabled={savingGrade}
                      className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={9} /> {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 space-y-2 overflow-y-auto">
              {gradesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-indigo-600" />
                </div>
              ) : grades.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No grades yet — add the first one above.</p>
              ) : (
                grades.map((g) => (
                  <div
                    key={g._id}
                    className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5"
                  >
                    <span className="text-xs font-bold text-gray-800">{g.label}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGrade(g)}
                      disabled={deletingGradeId === g._id}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                      title={`Delete "${g.label}"`}
                    >
                      {deletingGradeId === g._id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* CONFIGURE VIDEO UPLOAD LIMIT MODAL */}
      {isLimitModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-white w-full max-w-md rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col">

            <div className="p-5 bg-[#0B1528] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-indigo-400" />
                <h4 className="text-sm font-black tracking-wide">Configure Video Upload Limit</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsLimitModalOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleUpdateLmsLimit} className="p-6 space-y-5 text-xs font-bold text-gray-700">
              <p className="text-gray-500 leading-relaxed">
                Set the maximum video file size limit allowed for LMS video lesson uploads. Admin can adjust this limit anytime as needed.
              </p>

              {/* QUICK PRESET CHIPS */}
              <div className="space-y-2">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Quick Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 250, 500, 1000, 2000, 5000].map((mb) => (
                    <button
                      key={mb}
                      type="button"
                      onClick={() => setNewLimitMB(mb)}
                      className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        Number(newLimitMB) === mb
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {mb >= 1000 ? `${mb / 1000} GB (${mb}MB)` : `${mb} MB`}
                    </button>
                  ))}
                </div>
              </div>

              {/* CUSTOM MB INPUT */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Maximum Limit (MB) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    required
                    value={newLimitMB}
                    onChange={(e) => setNewLimitMB(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    placeholder="e.g. 500"
                  />
                  <span className="text-gray-500 font-extrabold">MB</span>
                </div>
                <span className="text-[10px] text-gray-400 block font-normal">
                  Minimum: 10 MB, Maximum: 5000 MB (5 GB)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsLimitModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLimit}
                  className="px-5 py-2.5 bg-[#0B1528] hover:bg-[#1a2942] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
                >
                  {savingLimit && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Limit</span>
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
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">School E-Mart</span>
        </p>
      </div>

    </div>
  );
};

export default LMSManagement;
