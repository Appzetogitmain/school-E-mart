import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Edit, Trash2, X, Download, Users, BadgeCheck, AlertCircle, Loader2, GraduationCap, Building2,
} from 'lucide-react';
import { listTeachers, updateTeacher, deleteTeacher, listSchools } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapTeacherForAdmin } from '../../../utils/mappers/adminTeacherMapper';

const STATUS_STYLES = {
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

const initials = (value = '') =>
  value.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const inputCls =
  'w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold';
const labelCls = 'text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1';

const TeacherListManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [showCount, setShowCount] = useState(10);

  const [currentPage, setCurrentPage] = useState(1);

  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState('');

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listTeachers({ limit: 100 });
      setTeachers((data || []).map(mapTeacherForAdmin));
    } catch (err) {
      setTeachers([]);
      setError(getErrorMessage(err, 'Unable to load teachers'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
    listSchools({ limit: 100 })
      .then(({ data }) => setSchools(data || []))
      .catch(() => setSchools([]));
  }, [loadTeachers]);

  const openEditModal = (t) => {
    setEditingTeacher(t);
    setEditError('');
    setEditForm({
      name: t.name === 'Teacher' ? '' : t.name,
      email: t.email === '—' ? '' : t.email,
      phone: t.phone === '—' ? '' : t.phone,
      designation: t.designation === '—' ? '' : t.designation,
      department: t.department === '—' ? '' : t.department,
      qualification: t.qualification === '—' ? '' : t.qualification,
      experienceYears: t.raw?.experienceYears != null ? String(t.raw.experienceYears) : '',
      subjectsTaught: t.subjectsList.join(', '),
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    if (!editingTeacher || !editForm) return;
    const f = editForm;

    if (f.phone.trim() && !/^[6-9]\d{9}$/.test(f.phone.trim())) {
      setEditError('Phone must be a 10-digit Indian mobile starting with 6-9.');
      return;
    }
    setEditError('');

    const user = {};
    if (f.name.trim()) user.name = f.name.trim();
    if (f.email.trim()) user.email = f.email.trim();
    if (f.phone.trim()) user.phone = f.phone.trim();

    const payload = {
      ...(Object.keys(user).length ? { user } : {}),
      designation: f.designation.trim(),
      department: f.department.trim(),
      qualification: f.qualification.trim(),
      subjectsTaught: f.subjectsTaught.split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (f.experienceYears !== '') payload.experienceYears = parseFloat(f.experienceYears) || 0;

    try {
      setSaving(true);
      await updateTeacher(editingTeacher.mongoId, payload);
      setIsEditModalOpen(false);
      setEditingTeacher(null);
      await loadTeachers();
    } catch (err) {
      setEditError(getErrorMessage(err, 'Unable to update teacher'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (t) => {
    if (!confirm(`Permanently delete "${t.name}"?\n\nThis removes their login and teacher record. This cannot be undone.`)) return;
    setActionId(t.mongoId);
    try {
      await deleteTeacher(t.mongoId);
      await loadTeachers();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to delete teacher'));
    } finally {
      setActionId(null);
    }
  };

  const handleExport = () => {
    const cols = ['Name', 'Phone', 'Email', 'School', 'Subjects', 'Designation', 'Status'];
    const rows = visibleTeachers.map((t) => [t.name, t.phone, t.email, t.schoolName, t.subjects, t.designation, t.status]);
    const escape = (cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
    const csv = [cols, ...rows].map((r) => r.map(escape).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `teachers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const countFor = (value) =>
    value === 'all' ? teachers.length : teachers.filter((t) => t.statusRaw === value).length;

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.phone.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.schoolName.toLowerCase().includes(q) ||
      t.subjects.toLowerCase().includes(q);
    const matchesSchool = schoolFilter === 'all' || t.schoolId === schoolFilter;
    return matchesSearch && matchesSchool;
  });
  const totalPages = Math.ceil(filteredTeachers.length / showCount) || 1;
  const visibleTeachers = filteredTeachers.slice(
    (currentPage - 1) * showCount,
    currentPage * showCount
  );

  const field = (form, setForm, key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Teacher Management</h1>
          <p className="text-xs text-gray-400 font-bold mt-1.5">
            Every teacher registered across all schools — filter by school, edit, or remove an account.
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        {[
          { label: 'Total Teachers', value: countFor('all'), Icon: Users, tone: 'text-gray-700 bg-gray-50 border-gray-100' },
          { label: 'Approved', value: countFor('approved'), Icon: BadgeCheck, tone: 'text-emerald-600 bg-emerald-50/60 border-emerald-100/60' },
          { label: 'Awaiting Approval', value: countFor('pending'), Icon: AlertCircle, tone: 'text-amber-600 bg-amber-50/60 border-amber-100/60' },
          { label: 'Schools Covered', value: new Set(teachers.map((t) => t.schoolId).filter(Boolean)).size, Icon: Building2, tone: 'text-indigo-600 bg-indigo-50/60 border-indigo-100/60' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200/70 p-4 rounded-2xl flex items-center gap-3 hover:shadow-sm transition-all">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${stat.tone}`}>
              <stat.Icon size={20} className="stroke-[2]" />
            </div>
            <div className="text-left min-w-0">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block truncate">{stat.label}</span>
              <span className="text-2xl font-black text-gray-900 leading-tight mt-0.5 block">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CONTROLS */}
      <div className="bg-white rounded-2xl border border-gray-200/75 p-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none shadow-sm">
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-bold text-gray-400">Show</span>
          <select
            value={showCount}
            onChange={(e) => setShowCount(parseInt(e.target.value, 10))}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            {[10, 25, 50, 100, 10000].map((n) => (
              <option key={n} value={n}>
                {n === 10000 ? 'All' : n}
              </option>
            ))}
          </select>
          <span className="text-xs font-bold text-gray-400">of {filteredTeachers.length} entries</span>

          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ml-2"
          >
            <option value="all">All Schools</option>
            {schools.map((s) => (
              <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, email, school or subject..."
              className="w-full bg-[#F8F9FB]/60 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-gray-400 font-medium"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={visibleTeachers.length === 0}
            className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-extrabold text-gray-700 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={13} className="stroke-[2.5]" />
            <span>EXPORT</span>
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-xs font-bold text-red-700">{error}</span>
          <button
            onClick={loadTeachers}
            className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-[10px] font-black uppercase text-red-700 transition-all hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-[1.25rem] border border-gray-250/60 shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto border border-gray-200/80 rounded-2xl bg-[#FCFDFE]">
          <table className="w-full text-left text-xs font-semibold text-gray-600 border-collapse select-none">
            <thead>
              <tr className="border-b border-gray-250 bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                <th className="py-4 px-5">Teacher</th>
                <th className="py-4 px-5">Phone</th>
                <th className="py-4 px-5">School</th>
                <th className="py-4 px-5">Subject</th>
                <th className="py-4 px-5">Designation</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12">
                    <div className="flex items-center justify-center gap-2 text-xs font-black text-gray-400">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Loading teachers…</span>
                    </div>
                  </td>
                </tr>
              ) : visibleTeachers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-xs font-black text-gray-400">
                    No teacher records found.
                  </td>
                </tr>
              ) : (
                visibleTeachers.map((t) => (
                  <tr key={t.mongoId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        {t.avatar ? (
                          <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover border border-gray-100 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-[9px] font-black text-indigo-600">
                            {initials(t.name)}
                          </div>
                        )}
                        <div className="leading-tight min-w-0">
                          <span className="font-extrabold text-gray-800 text-xs block truncate max-w-[140px]" title={t.name}>
                            {t.name}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold block truncate max-w-[140px]" title={t.email}>
                            {t.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-extrabold text-gray-800 text-xs">{t.phone}</span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1 text-gray-500">
                        <GraduationCap size={11} className="shrink-0 text-gray-300" />
                        <span className="font-bold text-[11px] truncate max-w-[140px]" title={t.schoolName}>
                          {t.schoolName}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-bold text-[11px] text-gray-600 truncate max-w-[160px] block" title={t.subjects}>
                        {t.subjects}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-bold text-[11px] text-gray-600">{t.designation}</span>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${STATUS_STYLES[t.status] || STATUS_STYLES.Pending}`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right pr-6">
                      <div className="flex items-center gap-1.5 ml-auto justify-end">
                        <button
                          onClick={() => openEditModal(t)}
                          title="Edit teacher"
                          className="w-7 h-7 rounded-xl border border-gray-250/60 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center transition-all shrink-0"
                        >
                          <Edit size={12} className="stroke-[2.5]" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(t)}
                          disabled={actionId === t.mongoId}
                          title="Delete teacher"
                          className="w-7 h-7 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
                        >
                          {actionId === t.mongoId ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} className="stroke-[2.5]" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {filteredTeachers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100 select-none">
            <span className="text-xs font-bold text-gray-400">
              Showing {Math.min((currentPage - 1) * showCount + 1, filteredTeachers.length)} to {Math.min(currentPage * showCount, filteredTeachers.length)} of {filteredTeachers.length} entries
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, currentPage - 3),
                Math.min(totalPages, currentPage + 2)
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${currentPage === page ? 'bg-[#0B1528] text-white shadow-xs' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EDIT TEACHER MODAL */}
      {isEditModalOpen && editForm && editingTeacher && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white px-6 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#0B1528]">Edit Teacher</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">{editingTeacher.schoolName}</p>
              </div>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all border border-gray-100">
                <X size={18} />
              </button>
            </div>

            <form id="edit-teacher-form" onSubmit={handleUpdateTeacher} className="p-6 space-y-4 overflow-y-auto text-left flex-1">
              {editError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-red-700">{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Name</label>
                  <input type="text" className={inputCls} {...field(editForm, setEditForm, 'name')} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="tel" className={inputCls} {...field(editForm, setEditForm, 'phone')} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Email</label>
                  <input type="email" className={inputCls} {...field(editForm, setEditForm, 'email')} />
                </div>
                <div>
                  <label className={labelCls}>Designation</label>
                  <input type="text" className={inputCls} {...field(editForm, setEditForm, 'designation')} />
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <input type="text" className={inputCls} {...field(editForm, setEditForm, 'department')} />
                </div>
                <div>
                  <label className={labelCls}>Qualification</label>
                  <input type="text" className={inputCls} {...field(editForm, setEditForm, 'qualification')} />
                </div>
                <div>
                  <label className={labelCls}>Experience (years)</label>
                  <input type="number" min="0" step="1" className={inputCls} {...field(editForm, setEditForm, 'experienceYears')} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Subjects Taught</label>
                  <input type="text" placeholder="e.g. Maths, Science, English" className={inputCls} {...field(editForm, setEditForm, 'subjectsTaught')} />
                  <span className="text-[10px] text-gray-400 font-semibold mt-1 block">Comma-separated.</span>
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-gray-150 flex items-center justify-end gap-2.5 bg-white px-6 shrink-0">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs px-5 py-2.5 rounded-xl transition-all">
                Cancel
              </button>
              <button
                type="submit"
                form="edit-teacher-form"
                disabled={saving}
                className="bg-[#0B1528] hover:bg-gray-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 size={12} className="animate-spin" />}
                <span>{saving ? 'Saving…' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default TeacherListManagement;
