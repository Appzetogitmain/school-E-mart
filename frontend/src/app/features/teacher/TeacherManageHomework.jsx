import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, GraduationCap, Users, Calendar, Clock, BookOpen,
  Plus, Pencil, Trash2, Loader2, AlertTriangle, Award, Send,
} from 'lucide-react';
import { listCourses, listAssignments, deleteAssignment, updateAssignment } from '../../../services/lmsApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapAssignmentForHomework, normalizeGrade, parseClassGrade, parseSection } from '../../../utils/mappers/teacherMapper';
import { useTeacherSchoolId } from '../../../utils/teacherContext';
import { useTeacherClassOptions } from '../../../hooks/useTeacherClassOptions';

// The list only carries the display-mapped fields (mapAssignmentForHomework);
// the edit form needs the raw assignment values underneath.
const toEditableHomework = (hw) => ({
  courseId: hw.courseId,
  classGrade: hw.classGrade,
  section: hw.section,
  subject: hw.subject,
  title: hw.raw?.title ?? hw.title,
  description: hw.raw?.description ?? '',
  instructions: hw.raw?.instructions ?? '',
  dueDate: hw.raw?.dueDate ?? hw.dueDate,
  assignedDate: hw.raw?.assignedDate ?? hw.dateAssigned,
  homeworkType: hw.raw?.homeworkType ?? hw.type,
  priority: hw.raw?.priority ?? hw.priority,
  maxScore: hw.raw?.maxScore ?? hw.maxScore,
  reference: hw.raw?.reference || {},
  attachmentsCount: (hw.attachments || []).length,
  bannerAttachmentId: hw.bannerAttachmentId || null,
});

const TeacherManageHomework = () => {
  const navigate = useNavigate();
  const schoolId = useTeacherSchoolId();
  const { classLabels, getSections } = useTeacherClassOptions(schoolId);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);

  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [publishingId, setPublishingId] = useState(null);
  const [toast, setToast] = useState('');

  const classes = classLabels;
  const sections = getSections(selectedClass);

  useEffect(() => {
    if (classLabels.length > 0 && !selectedClass) {
      setSelectedClass(classLabels[0]);
      const secs = getSections(classLabels[0]);
      if (secs.length > 0) setSelectedSection(secs[0]);
    }
  }, [classLabels, getSections, selectedClass]);

  const loadHomeworks = useCallback(async () => {
    if (!schoolId || !selectedClass || !selectedSection) {
      setLoading(false);
      setHomeworks([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const grade = parseClassGrade(selectedClass);
      const normalizedGrade = normalizeGrade(grade);
      const section = parseSection(selectedSection);
      const { data: courses } = await listCourses(schoolId, { limit: 50 });
      // Exact normalized match only — a substring check here previously matched "Class 1"
      // against courses titled "Class 10/11/12", leaking other grades' homework in.
      const matchingCourses = (courses || []).filter(
        (course) => normalizeGrade(course.gradeClass) === normalizedGrade
      );

      // A course belonging to a colleague answers 403 — skip it rather than
      // blanking out the whole list.
      const results = await Promise.all(
        matchingCourses.map(async (course) => {
          const courseId = course._id || course.id;
          try {
            const { data: assignments } = await listAssignments(schoolId, courseId, { limit: 50 });
            return (assignments || []).map((assignment) => mapAssignmentForHomework(assignment, course));
          } catch {
            return [];
          }
        })
      );

      const forSection = results
        .flat()
        .filter((row) => !row.section || row.section === section);

      forSection.sort((a, b) => new Date(b.dateAssigned || 0) - new Date(a.dateAssigned || 0));
      setHomeworks(forSection);
    } catch (err) {
      setHomeworks([]);
      setError(getErrorMessage(err, 'Unable to load homework'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedClass, selectedSection]);

  useEffect(() => {
    loadHomeworks();
  }, [loadHomeworks]);

  const handleEdit = (hw) => {
    navigate(`/school/teacher/homework/${hw.id}/edit`, {
      state: { homework: toEditableHomework(hw) },
    });
  };

  // The only reachable way to move a homework from draft to published outside of
  // publishing it fresh from the Add Homework screen.
  const handlePublish = async (hw) => {
    if (!schoolId || publishingId) return;
    setPublishingId(hw.id);
    setError('');
    try {
      await updateAssignment(schoolId, hw.courseId, hw.id, { status: 'published' });
      setHomeworks((prev) =>
        prev.map((item) =>
          item.id === hw.id ? { ...item, raw: { ...item.raw, status: 'published' } } : item
        )
      );
      setToast('Homework published!');
      setTimeout(() => setToast(''), 2200);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to publish homework'));
    } finally {
      setPublishingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete || !schoolId) return;
    setDeletingId(confirmDelete.id);
    setError('');
    try {
      await deleteAssignment(schoolId, confirmDelete.courseId, confirmDelete.id);
      setHomeworks((prev) => prev.filter((hw) => hw.id !== confirmDelete.id));
      setToast('Homework deleted successfully!');
      setTimeout(() => setToast(''), 2200);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete homework'));
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen select-none font-outfit animate-in fade-in duration-300 pb-24 relative">

      {/* Toast */}
      {toast && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-6 duration-300">
          <span className="text-xs font-black">{toast}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="px-6 pt-7 pb-4 bg-white flex items-center justify-between border-b border-gray-100 relative z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/school/teacher/dashboard')}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-full flex items-center justify-center text-deep-purple"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-lg font-black text-deep-purple leading-none">Manage Homework</h1>
            <p className="text-[10px] text-gray-400 font-bold mt-1">Edit or remove homework you've assigned</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/school/teacher/homework')}
          className="w-10 h-10 bg-primary text-white hover:bg-deep-purple active:scale-95 transition-all rounded-full flex items-center justify-center shadow-lg shadow-purple-100"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* 2. Class & Section Selectors */}
      <div className="px-6 mt-4 grid grid-cols-2 gap-4 relative z-30 shrink-0">
        <div className="relative">
          <button
            onClick={() => { setIsClassOpen(!isClassOpen); setIsSectionOpen(false); }}
            className="w-full px-4 py-3.5 bg-white border border-gray-200 hover:border-primary/20 active:bg-gray-50 rounded-2xl text-left flex items-center justify-between shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 text-deep-purple font-bold text-xs">
              <GraduationCap size={16} className="text-primary" />
              <span>{selectedClass}</span>
            </div>
            <span className="text-gray-400 text-xs">▼</span>
          </button>
          {isClassOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsClassOpen(false)} />
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {classes.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => {
                      setSelectedClass(cls);
                      const secs = getSections(cls);
                      setSelectedSection(secs[0] || '');
                      setIsClassOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all ${selectedClass === cls ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setIsSectionOpen(!isSectionOpen); setIsClassOpen(false); }}
            className="w-full px-4 py-3.5 bg-white border border-gray-200 hover:border-primary/20 active:bg-gray-50 rounded-2xl text-left flex items-center justify-between shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 text-deep-purple font-bold text-xs">
              <Users size={16} className="text-primary" />
              <span>{selectedSection}</span>
            </div>
            <span className="text-gray-400 text-xs">▼</span>
          </button>
          {isSectionOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSectionOpen(false)} />
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {sections.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => { setSelectedSection(sec); setIsSectionOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all ${selectedSection === sec ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-3 px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600">
          {error}
        </div>
      )}

      {/* 3. Homework List */}
      <div className="px-6 mt-4 flex-1 space-y-3">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Loader2 size={22} className="animate-spin text-primary" />
            <span className="text-[10px] font-bold text-gray-400">Loading homework…</span>
          </div>
        ) : homeworks.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-2">
            <BookOpen size={26} className="text-gray-300" />
            <span className="text-xs font-bold text-gray-400">No homework assigned yet for this class &amp; section</span>
            <button
              onClick={() => navigate('/school/teacher/homework')}
              className="mt-2 px-5 py-2.5 bg-primary text-white rounded-2xl text-[11px] font-black shadow-lg shadow-purple-100"
            >
              Add Homework
            </button>
          </div>
        ) : (
          homeworks.map((hw) => (
            <div key={hw.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-black text-deep-purple truncate">{hw.title}</h3>
                    {hw.raw?.status === 'draft' && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-[8px] font-black uppercase">Draft</span>
                    )}
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold mt-1">{hw.subject} • {hw.type}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {hw.raw?.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(hw)}
                      disabled={publishingId === hw.id}
                      className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-90 transition-all flex items-center justify-center text-emerald-600 disabled:opacity-50"
                      aria-label="Publish homework"
                      title="Publish"
                    >
                      {publishingId === hw.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(hw)}
                    className="w-8 h-8 rounded-xl bg-purple-50 hover:bg-purple-100 active:scale-90 transition-all flex items-center justify-center text-primary"
                    aria-label="Edit homework"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(hw)}
                    disabled={deletingId === hw.id}
                    className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 active:scale-90 transition-all flex items-center justify-center text-red-500 disabled:opacity-50"
                    aria-label="Delete homework"
                  >
                    {deletingId === hw.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-[9px] font-bold text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Calendar size={11} className="text-primary" />
                  <span>Assigned: {formatDate(hw.dateAssigned)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="text-amber-500" />
                  <span>Due: {formatDate(hw.dueDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award size={11} className="text-emerald-500" />
                  <span>/{hw.maxScore}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in px-6">
          <div className="absolute inset-0" onClick={() => (deletingId ? null : setConfirmDelete(null))} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h3 className="text-sm font-black text-deep-purple">Delete this homework?</h3>
            <p className="text-xs font-bold text-gray-400 mt-2 leading-relaxed">
              "{confirmDelete.title}" and any student submissions for it will be permanently removed. This can't be undone.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={Boolean(deletingId)}
                className="flex-1 py-3.5 border border-gray-200 hover:bg-gray-50 active:scale-98 transition-all rounded-2xl text-xs font-black text-deep-purple disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingId)}
                className="flex-1 py-3.5 bg-red-500 text-white hover:bg-red-600 active:scale-98 transition-all rounded-2xl text-xs font-black shadow-lg shadow-red-100 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deletingId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{deletingId ? 'Deleting…' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManageHomework;
