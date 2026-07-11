import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, User, X, Plus, Check, ChevronDown,
  Loader2, AlertCircle, CheckCircle, Trash2, GraduationCap, BookOpen, Crown
} from 'lucide-react';
import {
  listClasses,
  listSubjects,
  createSubject,
  listTeacherAssignments,
  upsertTeacherAssignment,
  removeTeacherAssignment,
} from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { formatClassLabel } from '../../../utils/mappers/schoolStudentMapper';
import { useSchoolId } from '../../../utils/schoolContext';

// School-side control room for who teaches what: assign teachers to
// class+section with subjects and designate the class teacher. Teachers only
// see (and can act on) the classes assigned here.
const SchoolTeacherAssignments = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();

  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('byClass'); // 'byClass' | 'byTeacher'

  // Assign modal state
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [form, setForm] = useState({
    teacherProfileId: '',
    classGrade: '',
    section: '',
    subjects: [],
    isClassTeacher: false,
  });
  const [newSubject, setNewSubject] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);

  // Remove-confirmation state
  const [toRemove, setToRemove] = useState(null); // { teacher, assignment }
  const [removing, setRemoving] = useState(false);

  const loadData = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      setError('School context is missing. Please log in again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [assignmentData, classData, subjectData] = await Promise.all([
        listTeacherAssignments(schoolId),
        listClasses(schoolId),
        listSubjects(schoolId, { limit: 100 }),
      ]);
      setTeachers(assignmentData || []);
      setClasses(classData || []);
      setSubjects((subjectData.data || []).filter((s) => s.status !== 'inactive'));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load teacher assignments'));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedClass = classes.find((c) => c.classGrade === form.classGrade);
  const modalSections = selectedClass?.sections || [];

  // ── By Class view data: one row per class+section with its teachers ──
  const classRows = useMemo(() => {
    const rows = [];
    classes.forEach((cls) => {
      (cls.sections || []).forEach((section) => {
        const rowTeachers = [];
        let classTeacher = null;
        teachers.forEach((t) => {
          (t.classAssignments || []).forEach((a) => {
            if (a.class === cls.classGrade && a.section === section) {
              rowTeachers.push({ teacher: t, assignment: a });
              if (a.isClassTeacher) classTeacher = t;
            }
          });
        });
        rows.push({
          key: `${cls.classGrade}-${section}`,
          classGrade: cls.classGrade,
          section,
          teachers: rowTeachers,
          classTeacher,
        });
      });
    });
    return rows;
  }, [classes, teachers]);

  const openAssignModal = (preset = {}) => {
    setForm({
      teacherProfileId: preset.teacherProfileId || '',
      classGrade: preset.classGrade || '',
      section: preset.section || '',
      subjects: preset.subjects || [],
      isClassTeacher: preset.isClassTeacher || false,
    });
    setNewSubject('');
    setModalError('');
    setModalSuccess(false);
    setShowModal(true);
  };

  // Editing an existing assignment pre-fills the same modal
  const openEditModal = (teacher, assignment) => {
    openAssignModal({
      teacherProfileId: teacher.teacherProfileId,
      classGrade: assignment.class,
      section: assignment.section,
      subjects: assignment.subjects || [],
      isClassTeacher: assignment.isClassTeacher,
    });
  };

  const toggleSubject = (label) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(label)
        ? prev.subjects.filter((s) => s !== label)
        : [...prev.subjects, label],
    }));
  };

  const handleQuickAddSubject = async () => {
    const label = newSubject.trim();
    if (!label) return;
    const existing = subjects.find((s) => (s.label || '').toLowerCase() === label.toLowerCase());
    if (existing) {
      if (!form.subjects.includes(existing.label)) toggleSubject(existing.label);
      setNewSubject('');
      return;
    }
    setAddingSubject(true);
    try {
      const code = label.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);
      await createSubject(schoolId, { code, label });
      setSubjects((prev) => [...prev, { code, label }]);
      toggleSubject(label);
      setNewSubject('');
    } catch (err) {
      setModalError(getErrorMessage(err, 'Unable to add subject'));
    } finally {
      setAddingSubject(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.teacherProfileId) { setModalError('Select a teacher'); return; }
    if (!form.classGrade) { setModalError('Select a class'); return; }
    if (!form.section) { setModalError('Select a section'); return; }
    if (form.subjects.length === 0 && !form.isClassTeacher) {
      setModalError('Pick at least one subject, or mark as class teacher');
      return;
    }

    setModalSaving(true);
    setModalError('');
    try {
      const updated = await upsertTeacherAssignment(schoolId, form.teacherProfileId, {
        classGrade: form.classGrade,
        section: form.section,
        subjects: form.subjects,
        isClassTeacher: form.isClassTeacher,
      });
      setTeachers(updated);
      setModalSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setModalSuccess(false);
      }, 1200);
    } catch (err) {
      setModalError(getErrorMessage(err, 'Unable to save assignment'));
    } finally {
      setModalSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!toRemove) return;
    setRemoving(true);
    try {
      const updated = await removeTeacherAssignment(schoolId, toRemove.teacher.teacherProfileId, {
        classGrade: toRemove.assignment.class,
        section: toRemove.assignment.section,
      });
      setTeachers(updated);
      setToRemove(null);
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to remove assignment'));
    } finally {
      setRemoving(false);
    }
  };

  const teacherOptions = teachers.map((t) => ({
    id: t.teacherProfileId,
    label: `${t.name}${t.phone ? ` — ${t.phone}` : ''}`,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 font-outfit">

      {/* Header */}
      <div className="bg-[#3b2d7d] text-white px-6 py-6 sticky top-0 z-50 rounded-b-[2rem] shadow-lg flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/school/more')}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-black leading-tight">Class &amp; Teacher Assignments</h1>
            <span className="text-[11px] text-purple-200 font-bold block mt-0.5">
              Decide who teaches which class, subject &amp; who is class teacher
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openAssignModal()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#3b2d7d] rounded-full text-xs font-black hover:bg-purple-50 active:scale-95 transition-all shadow-md shrink-0"
        >
          <Plus size={15} className="stroke-[2.5]" />
          Assign
        </button>
      </div>

      <div className="px-6 pt-6 space-y-5">

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button type="button" onClick={loadData} className="text-red-700 underline shrink-0">Retry</button>
          </div>
        )}

        {/* Info strip */}
        <div className="px-4 py-3 bg-purple-50/60 border border-purple-100 rounded-2xl text-[11px] font-bold text-[#3b2d7d]">
          Teachers only see the classes assigned to them here — attendance, homework and student lists in their app are limited to these classes.
        </div>

        {/* View toggle */}
        <div className="grid grid-cols-2 gap-2 bg-white border border-gray-200 rounded-2xl p-1.5">
          <button
            type="button"
            onClick={() => setViewMode('byClass')}
            className={`py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'byClass' ? 'bg-[#3b2d7d] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            By Class
          </button>
          <button
            type="button"
            onClick={() => setViewMode('byTeacher')}
            className={`py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'byTeacher' ? 'bg-[#3b2d7d] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            By Teacher
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={32} className="animate-spin mb-3" />
            <span className="text-xs font-bold">Loading assignments…</span>
          </div>
        )}

        {/* ── By Class ── */}
        {!loading && viewMode === 'byClass' && (
          <div className="space-y-4">
            {classRows.length === 0 && (
              <div className="text-center py-14 bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm">
                <GraduationCap size={40} className="text-gray-300 mx-auto block stroke-[1.5]" />
                <span className="text-xs font-black text-gray-400 block mt-3">No classes created yet</span>
                <button
                  type="button"
                  onClick={() => navigate('/school/add-class')}
                  className="mt-3 text-[#3b2d7d] underline text-xs font-black"
                >
                  Create a class &amp; section first
                </button>
              </div>
            )}

            {classRows.map((row) => (
              <div key={row.key} className="bg-white border border-gray-200/80 rounded-[2rem] p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-deep-purple">
                      {formatClassLabel(row.classGrade)} — Section {row.section}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                      <Crown size={11} className={row.classTeacher ? 'text-amber-500' : 'text-gray-300'} />
                      Class Teacher:{' '}
                      <span className={row.classTeacher ? 'text-[#3b2d7d] font-black' : 'text-gray-300'}>
                        {row.classTeacher ? row.classTeacher.name : 'Not assigned'}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAssignModal({ classGrade: row.classGrade, section: row.section })}
                    className="shrink-0 flex items-center gap-1 px-3 py-2 bg-purple-50 text-[#3b2d7d] border border-purple-100 rounded-xl text-[10px] font-black hover:bg-purple-100 active:scale-95 transition-all"
                  >
                    <Plus size={12} className="stroke-[3]" />
                    Assign
                  </button>
                </div>

                {row.teachers.length === 0 ? (
                  <span className="text-[11px] font-bold text-gray-300 block">No teachers assigned yet</span>
                ) : (
                  <div className="space-y-2">
                    {row.teachers.map(({ teacher, assignment }) => (
                      <div
                        key={teacher.teacherProfileId}
                        className="flex items-center justify-between gap-3 bg-gray-50/70 border border-gray-100 rounded-2xl px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-black text-deep-purple flex items-center gap-1.5">
                            {teacher.name}
                            {assignment.isClassTeacher && (
                              <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-600 border border-amber-100 text-[8px] font-black rounded-lg px-1.5 py-0.5 uppercase tracking-wider">
                                <Crown size={9} /> Class Teacher
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                            <BookOpen size={10} className="shrink-0" />
                            {(assignment.subjects || []).length ? assignment.subjects.join(', ') : 'No subjects listed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(teacher, assignment)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-purple-50 hover:text-[#3b2d7d] active:scale-90 transition-all"
                            title="Edit assignment"
                          >
                            <BookOpen size={12} className="stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToRemove({ teacher, assignment })}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-600 active:scale-90 transition-all"
                            title="Remove assignment"
                          >
                            <Trash2 size={12} className="stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── By Teacher ── */}
        {!loading && viewMode === 'byTeacher' && (
          <div className="space-y-4">
            {teachers.length === 0 && (
              <div className="text-center py-14 bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm">
                <Users size={40} className="text-gray-300 mx-auto block stroke-[1.5]" />
                <span className="text-xs font-black text-gray-400 block mt-3">No approved teachers yet</span>
              </div>
            )}

            {teachers.map((teacher) => (
              <div key={teacher.teacherProfileId} className="bg-white border border-gray-200/80 rounded-[2rem] p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#3b2d7d]/5 to-purple-50 flex items-center justify-center font-black text-[#3b2d7d] text-xs shrink-0 border border-purple-100/50">
                      {(teacher.name || '?').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-deep-purple truncate">{teacher.name}</h3>
                      <span className="text-[10px] font-bold text-gray-400 block">
                        {teacher.designation || 'Teacher'}{teacher.phone ? ` • ${teacher.phone}` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAssignModal({ teacherProfileId: teacher.teacherProfileId })}
                    className="shrink-0 flex items-center gap-1 px-3 py-2 bg-purple-50 text-[#3b2d7d] border border-purple-100 rounded-xl text-[10px] font-black hover:bg-purple-100 active:scale-95 transition-all"
                  >
                    <Plus size={12} className="stroke-[3]" />
                    Assign
                  </button>
                </div>

                {(teacher.classAssignments || []).length === 0 ? (
                  <span className="text-[11px] font-bold text-gray-300 block">
                    No classes assigned — this teacher sees nothing in their app yet
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {teacher.classAssignments.map((a) => (
                      <div
                        key={`${a.class}-${a.section}`}
                        className={`inline-flex items-center gap-1.5 border text-[10px] font-black rounded-xl pl-2.5 pr-1 py-1 ${a.isClassTeacher ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-purple-50 text-[#3b2d7d] border-purple-100'}`}
                      >
                        {a.isClassTeacher && <Crown size={10} />}
                        <button
                          type="button"
                          onClick={() => openEditModal(teacher, a)}
                          className="hover:underline"
                          title="Edit assignment"
                        >
                          {formatClassLabel(a.class)}-{a.section}
                          {(a.subjects || []).length ? ` • ${a.subjects.join(', ')}` : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => setToRemove({ teacher, assignment: a })}
                          className="w-4.5 h-4.5 rounded-full hover:bg-white/70 flex items-center justify-center active:scale-90 transition-all"
                          title="Remove"
                        >
                          <X size={10} className="stroke-[3]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Assign Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[2.2rem] shadow-2xl border border-gray-150 overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">

            <div className="bg-gradient-to-r from-[#3b2d7d] to-[#5942bc] text-white px-6 py-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase">Assign Teacher</h3>
                <span className="text-[10px] text-purple-200 font-bold block mt-0.5">Class, subjects &amp; class-teacher duty</span>
              </div>
              <button
                type="button"
                onClick={() => !modalSaving && setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white border border-white/10"
              >
                <X size={16} className="stroke-[3]" />
              </button>
            </div>

            {modalSuccess ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h4 className="text-sm font-black text-deep-purple mt-4">Assignment Saved!</h4>
              </div>
            ) : (
              <form onSubmit={handleAssign} className="flex flex-col min-h-0">
                <div className="p-6 overflow-y-auto space-y-4 scrollbar-none text-xs">

                  {modalError && (
                    <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{modalError}</span>
                    </div>
                  )}

                  {/* Teacher */}
                  <div>
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Teacher *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <select
                        value={form.teacherProfileId}
                        onChange={(e) => setForm((p) => ({ ...p, teacherProfileId: e.target.value }))}
                        className="w-full pl-10 pr-8 py-3.5 bg-white border border-gray-200 rounded-2xl font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 appearance-none cursor-pointer"
                      >
                        <option value="">Select teacher</option>
                        {teacherOptions.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {teachers.length === 0 && (
                      <span className="text-[10px] text-amber-600 font-bold block mt-1">
                        No approved teachers found — approve teachers first on the Teachers page.
                      </span>
                    )}
                  </div>

                  {/* Class & Section */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Class *</label>
                      <div className="relative">
                        <select
                          value={form.classGrade}
                          onChange={(e) => setForm((p) => ({ ...p, classGrade: e.target.value, section: '' }))}
                          className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl font-bold text-deep-purple focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Select Class</option>
                          {classes.map((cls) => (
                            <option key={cls.classGrade} value={cls.classGrade}>{formatClassLabel(cls.classGrade)}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Section *</label>
                      <div className="relative">
                        <select
                          value={form.section}
                          onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}
                          disabled={!form.classGrade}
                          className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl font-bold text-deep-purple focus:outline-none appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                        >
                          <option value="">{form.classGrade ? 'Select Section' : 'Pick class first'}</option>
                          {modalSections.map((sec) => (
                            <option key={sec} value={sec}>Section {sec}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-150 space-y-3">
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Subjects Taught</label>
                    {subjects.length === 0 && (
                      <span className="text-[10px] font-bold text-gray-400 block">No subjects yet — add your first one below.</span>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((s) => {
                        const active = form.subjects.includes(s.label);
                        return (
                          <button
                            type="button"
                            key={s.code}
                            onClick={() => toggleSubject(s.label)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all active:scale-95 ${active ? 'bg-[#3b2d7d] text-white border-[#3b2d7d]' : 'bg-white text-gray-500 border-gray-200 hover:border-purple-200'}`}
                          >
                            {active && <Check size={10} className="stroke-[3]" />}
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickAddSubject();
                          }
                        }}
                        placeholder="Add a subject e.g. Mathematics"
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddSubject}
                        disabled={addingSubject || !newSubject.trim()}
                        className="px-4 py-2.5 bg-[#3b2d7d] text-white rounded-xl text-[10px] font-black active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        {addingSubject ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} className="stroke-[3]" />}
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Class teacher toggle */}
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, isClassTeacher: !p.isClassTeacher }))}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.99] ${form.isClassTeacher ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'}`}
                  >
                    <span className="flex items-center gap-2 text-xs font-black text-deep-purple">
                      <Crown size={15} className={form.isClassTeacher ? 'text-amber-500' : 'text-gray-300'} />
                      Make Class Teacher of this section
                    </span>
                    <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.isClassTeacher ? 'bg-amber-500 border-amber-500' : 'border-gray-300'}`}>
                      {form.isClassTeacher && <Check size={12} className="text-white stroke-[3]" />}
                    </span>
                  </button>
                  {form.isClassTeacher && (
                    <span className="text-[10px] text-amber-600 font-bold block -mt-2">
                      Each section has exactly one class teacher — any current class teacher of this section will be replaced.
                    </span>
                  )}
                </div>

                <div className="bg-gray-50 border-t border-gray-200 p-5 flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={modalSaving}
                    className="flex-1 px-6 py-3.5 bg-white border border-gray-200 text-gray-500 font-black rounded-2xl text-xs uppercase tracking-wider active:scale-95 hover:bg-gray-100 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSaving}
                    className="flex-1 px-6 py-3.5 bg-[#3b2d7d] hover:bg-[#5942bc] text-white font-black rounded-2xl text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {modalSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Check size={14} className="stroke-[3]" />
                        Save Assignment
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Remove confirmation ── */}
      {toRemove && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 text-center space-y-4 shadow-2xl animate-in zoom-in duration-200">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-base font-black text-deep-purple">Remove Assignment?</h3>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                <strong>{toRemove.teacher.name}</strong> will lose access to{' '}
                <strong>{formatClassLabel(toRemove.assignment.class)}-{toRemove.assignment.section}</strong> in their app
                (attendance, homework, students).
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={removing}
                onClick={() => setToRemove(null)}
                className="flex-1 py-3 border border-gray-150 rounded-2xl text-xs font-black text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={removing}
                onClick={handleRemove}
                className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-xs font-black hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {removing ? <Loader2 size={16} className="animate-spin" /> : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolTeacherAssignments;
