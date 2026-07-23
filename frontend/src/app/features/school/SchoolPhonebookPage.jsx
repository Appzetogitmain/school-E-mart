import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Plus, Trash2, X, Loader2, Search,
  ShieldAlert, Users, GraduationCap, BookOpen, Eye, EyeOff,
  Star, AlertCircle,
} from 'lucide-react';
import { useSchoolId } from '../../../utils/schoolContext';
import {
  listTeachers,
  updateTeacher,
  listPhonebook,
  createPhonebookEntry,
  updatePhonebookEntry,
  deletePhonebookEntry,
} from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const CATEGORY_META = {
  emergency: { label: 'Emergency', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  medical: { label: 'Medical', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  transport: { label: 'Transport', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  general: { label: 'General', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  other: { label: 'Other', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' },
};

const CATEGORY_OPTIONS = ['emergency', 'medical', 'transport', 'general', 'other'];

const emptyForm = { name: '', phone: '', designation: '', category: 'emergency' };

const SchoolPhonebookPage = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();

  const [activeTab, setActiveTab] = useState('numbers'); // 'numbers' | 'teachers'

  // Emergency / general numbers
  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState('');

  // Teachers
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [teachersError, setTeachersError] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');

  // Add / edit number modal
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Per-row busy state
  const [busyId, setBusyId] = useState(null);

  const loadEntries = useCallback(() => {
    if (!schoolId) return;
    setEntriesLoading(true);
    setEntriesError('');
    listPhonebook(schoolId, { includeInactive: true })
      .then((data) => setEntries(data || []))
      .catch((err) => setEntriesError(getErrorMessage(err, 'Unable to load numbers')))
      .finally(() => setEntriesLoading(false));
  }, [schoolId]);

  const loadTeachers = useCallback(() => {
    if (!schoolId) return;
    setTeachersLoading(true);
    setTeachersError('');
    listTeachers(schoolId, { limit: 100 })
      .then(({ data }) => setTeachers(data || []))
      .catch((err) => setTeachersError(getErrorMessage(err, 'Unable to load teachers')))
      .finally(() => setTeachersLoading(false));
  }, [schoolId]);

  useEffect(() => {
    loadEntries();
    loadTeachers();
  }, [loadEntries, loadTeachers]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (entry) => {
    setForm({
      name: entry.name || '',
      phone: entry.phone || '',
      designation: entry.designation || '',
      category: entry.category || 'general',
    });
    setEditingId(entry._id);
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setFormError('Name and phone number are required');
      return;
    }
    setSaving(true);
    setFormError('');
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      category: form.category,
      designation: form.designation.trim() || undefined,
    };
    try {
      if (editingId) {
        await updatePhonebookEntry(schoolId, editingId, payload);
      } else {
        await createPhonebookEntry(schoolId, payload);
      }
      setShowForm(false);
      loadEntries();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save the number'));
    } finally {
      setSaving(false);
    }
  };

  const toggleEntryStatus = async (entry) => {
    setBusyId(entry._id);
    const next = entry.status === 'active' ? 'inactive' : 'active';
    try {
      await updatePhonebookEntry(schoolId, entry._id, { status: next });
      setEntries((prev) => prev.map((e) => (e._id === entry._id ? { ...e, status: next } : e)));
    } catch (err) {
      setEntriesError(getErrorMessage(err, 'Could not update status'));
    } finally {
      setBusyId(null);
    }
  };

  const removeEntry = async (entry) => {
    if (!window.confirm(`Delete "${entry.name}" from the phonebook?`)) return;
    setBusyId(entry._id);
    try {
      await deletePhonebookEntry(schoolId, entry._id);
      setEntries((prev) => prev.filter((e) => e._id !== entry._id));
    } catch (err) {
      setEntriesError(getErrorMessage(err, 'Could not delete the number'));
    } finally {
      setBusyId(null);
    }
  };

  const toggleTeacherVisibility = async (teacher) => {
    const next = teacher.showInPhonebook === false; // becoming visible
    setBusyId(teacher._id);
    try {
      await updateTeacher(schoolId, teacher._id, { showInPhonebook: next });
      setTeachers((prev) =>
        prev.map((t) => (t._id === teacher._id ? { ...t, showInPhonebook: next } : t))
      );
    } catch (err) {
      setTeachersError(getErrorMessage(err, 'Could not update visibility'));
    } finally {
      setBusyId(null);
    }
  };

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => {
      const name = (t.user?.name || '').toLowerCase();
      const phone = (t.user?.phone || '').toLowerCase();
      const dept = (t.department || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || dept.includes(q);
    });
  }, [teachers, teacherSearch]);

  const describeAssignments = (teacher) => {
    const list = teacher.classAssignments || [];
    if (!list.length) return 'No class assigned';
    return list
      .map((a) => {
        const base = `${a.class}${a.section ? `-${a.section}` : ''}`;
        return a.isClassTeacher ? `${base} (Class Teacher)` : base;
      })
      .join(', ');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-16 font-outfit">
      {/* Header */}
      <div className="bg-[#3b2d7d] text-white px-6 py-6 sticky top-0 z-40 rounded-b-[2rem] shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/school/more')}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-black leading-tight">Phonebook</h1>
            <p className="text-[11px] text-purple-200 font-bold mt-0.5">
              Teacher &amp; emergency numbers for parents
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={() => setActiveTab('numbers')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'numbers' ? 'bg-white text-[#3b2d7d]' : 'bg-white/10 text-white/80'
            }`}
          >
            <ShieldAlert size={14} />
            Emergency Numbers
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'teachers' ? 'bg-white text-[#3b2d7d]' : 'bg-white/10 text-white/80'
            }`}
          >
            <Users size={14} />
            Teachers
          </button>
        </div>
      </div>

      {/* NUMBERS TAB */}
      {activeTab === 'numbers' && (
        <div className="px-6 pt-6 space-y-4">
          <div className="flex items-start gap-2.5 bg-purple-50/60 border border-purple-100 rounded-2xl p-3.5">
            <AlertCircle size={16} className="text-[#3b2d7d] shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
              Add emergency &amp; helpline numbers (ambulance, front office, transport). Every
              parent of this school sees the <span className="text-[#3b2d7d]">active</span> ones.
            </p>
          </div>

          <button
            onClick={openAdd}
            className="w-full flex items-center justify-center gap-2 bg-[#3b2d7d] text-white py-3.5 rounded-2xl text-sm font-black shadow-sm active:scale-[0.98] transition-all"
          >
            <Plus size={18} />
            Add Number
          </button>

          {entriesError && (
            <div className="text-[11px] text-rose-500 font-bold text-center">{entriesError}</div>
          )}

          {entriesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#3b2d7d]" />
            </div>
          ) : entries.length === 0 ? (
            <div className="bg-white border border-gray-200/80 rounded-3xl p-10 flex flex-col items-center text-center shadow-sm">
              <Phone size={34} className="text-gray-300 mb-2" />
              <h4 className="text-sm font-black text-gray-700">No numbers yet</h4>
              <p className="text-[11px] font-bold text-gray-400 mt-1 max-w-[220px]">
                Add your first emergency or helpline number so parents can reach the school.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const meta = CATEGORY_META[entry.category] || CATEGORY_META.general;
                const isActive = entry.status === 'active';
                const busy = busyId === entry._id;
                return (
                  <div
                    key={entry._id}
                    className={`bg-white border border-gray-200/80 rounded-3xl p-4 shadow-sm ${
                      isActive ? '' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl ${meta.bg} ${meta.color} flex items-center justify-center shrink-0`}>
                          <Phone size={18} />
                        </div>
                        <div className="min-w-0" onClick={() => openEdit(entry)} role="button" tabIndex={0}>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-deep-purple truncate">{entry.name}</h4>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${meta.bg} ${meta.color}`}>
                              {meta.label}
                            </span>
                          </div>
                          {entry.designation && (
                            <p className="text-[10px] font-bold text-gray-400 truncate">{entry.designation}</p>
                          )}
                          <p className="text-xs font-black text-[#3b2d7d] mt-0.5">{entry.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => removeEntry(entry)}
                          disabled={busy}
                          className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        {isActive ? 'Visible to parents' : 'Hidden'}
                      </span>
                      <button
                        onClick={() => toggleEntryStatus(entry)}
                        disabled={busy}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          isActive ? 'bg-emerald-500' : 'bg-gray-300'
                        } disabled:opacity-50`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            isActive ? 'translate-x-5' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TEACHERS TAB */}
      {activeTab === 'teachers' && (
        <div className="px-6 pt-6 space-y-4">
          <div className="flex items-start gap-2.5 bg-purple-50/60 border border-purple-100 rounded-2xl p-3.5">
            <AlertCircle size={16} className="text-[#3b2d7d] shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
              Parents only see teachers assigned to <span className="text-[#3b2d7d]">their child's class</span>.
              Numbers come from each teacher's account. Turn a teacher off to hide them from the phonebook.
            </p>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl flex items-center px-3.5 py-2.5 shadow-sm">
            <Search size={16} className="text-gray-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search teachers by name, phone or department"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-gray-700 w-full placeholder-gray-400"
            />
          </div>

          {teachersError && (
            <div className="text-[11px] text-rose-500 font-bold text-center">{teachersError}</div>
          )}

          {teachersLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#3b2d7d]" />
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="bg-white border border-gray-200/80 rounded-3xl p-10 flex flex-col items-center text-center shadow-sm">
              <Users size={34} className="text-gray-300 mb-2" />
              <h4 className="text-sm font-black text-gray-700">No teachers found</h4>
              <p className="text-[11px] font-bold text-gray-400 mt-1 max-w-[220px]">
                Add teachers and assign them to classes to have them appear in the parent phonebook.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeachers.map((teacher) => {
                const visible = teacher.showInPhonebook !== false;
                const busy = busyId === teacher._id;
                const hasClassTeacher = (teacher.classAssignments || []).some((a) => a.isClassTeacher);
                return (
                  <div
                    key={teacher._id}
                    className={`bg-white border border-gray-200/80 rounded-3xl p-4 shadow-sm ${
                      visible ? '' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#3b2d7d] flex items-center justify-center shrink-0">
                          <GraduationCap size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-black text-deep-purple truncate">
                              {teacher.user?.name || '—'}
                            </h4>
                            {hasClassTeacher && (
                              <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 truncate">
                            {teacher.designation || 'Teacher'}
                          </p>
                          <p className="text-xs font-black text-[#3b2d7d] mt-0.5">
                            {teacher.user?.phone || 'No phone on account'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleTeacherVisibility(teacher)}
                        disabled={busy}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-all disabled:opacity-50 ${
                          visible ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                        }`}
                        title={visible ? 'Visible in phonebook' : 'Hidden from phonebook'}
                      >
                        {busy ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : visible ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                      <BookOpen size={13} className="text-gray-300 shrink-0" />
                      <span className="text-[10px] font-bold text-gray-500 truncate">
                        {describeAssignments(teacher)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Number Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="absolute inset-0" onClick={() => !saving && setShowForm(false)} />
          <div className="bg-white rounded-t-[32px] w-full max-w-md shadow-2xl p-6 relative z-10 pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <button
              onClick={() => !saving && setShowForm(false)}
              className="absolute right-6 top-6 w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400"
            >
              <X size={14} />
            </button>

            <h3 className="text-lg font-black text-deep-purple">
              {editingId ? 'Edit Number' : 'Add Number'}
            </h3>
            <p className="text-[11px] font-bold text-gray-400 mt-0.5">
              Shown to parents in the school phonebook
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">
                  Name / Label
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ambulance, Front Office"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#3b2d7d]/40"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. 102 or 9876543210"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#3b2d7d]/40"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const selected = form.category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setForm((f) => ({ ...f, category: cat }))}
                        className={`px-3 py-2 rounded-xl text-[11px] font-black border transition-all ${
                          selected
                            ? `${meta.bg} ${meta.color} ${meta.border}`
                            : 'bg-white text-gray-400 border-gray-200'
                        }`}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">
                  Note / Designation <span className="text-gray-300">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                  placeholder="e.g. 24x7 helpline"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#3b2d7d]/40"
                />
              </div>

              {formError && (
                <div className="text-[11px] text-rose-500 font-bold">{formError}</div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#3b2d7d] text-white py-3.5 rounded-2xl text-sm font-black shadow-sm active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                {editingId ? 'Save Changes' : 'Add Number'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolPhonebookPage;
