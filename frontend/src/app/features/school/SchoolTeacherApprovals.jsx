import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Filter, Search, UserPlus, Check, X, 
  MoreVertical, Clock, Users, ArrowUpRight, 
  ThumbsUp, ThumbsDown, CheckCircle2, XCircle, Loader2,
  AlertCircle, Trash2
} from 'lucide-react';
import { listTeachers, setTeacherStatus, createTeacher, deleteTeacher } from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapTeacherForApproval } from '../../../utils/mappers/schoolTeacherMapper';
import { useSchoolId } from '../../../utils/schoolContext';

const SchoolTeacherApprovals = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();

  const [activeTab, setActiveTab] = useState('Approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  // Deletion States
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Add Teacher Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    designation: '',
    department: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const handleAddInputChange = (field, value) => {
    setAddError('');
    let val = value;
    if (field === 'phone') {
      val = value.replace(/\D/g, '').slice(-10);
    }
    setAddFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addFormData.name.trim()) return setAddError('Name is required');
    if (!addFormData.email.trim()) return setAddError('Email is required');
    if (!addFormData.phone || addFormData.phone.length !== 10) return setAddError('Valid 10-digit mobile number is required');
    if (!addFormData.password) return setAddError('Password is required');
    if (addFormData.password.length < 8) return setAddError('Password must be at least 8 characters');
    if (!/\d/.test(addFormData.password)) return setAddError('Password must contain at least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(addFormData.password)) return setAddError('Password must contain at least one special character');

    setAddLoading(true);
    setAddError('');
    try {
      const payload = {
        name: addFormData.name.trim(),
        email: addFormData.email.trim(),
        phone: addFormData.phone.trim(),
        password: addFormData.password,
        autoApprove: true,
      };
      if (addFormData.designation?.trim()) {
        payload.designation = addFormData.designation.trim();
      }
      if (addFormData.department?.trim()) {
        payload.department = addFormData.department.trim();
      }

      await createTeacher(schoolId, payload);
      setIsAddModalOpen(false);
      setAddFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        designation: '',
        department: '',
      });
      loadTeachers();
    } catch (err) {
      setAddError(getErrorMessage(err, 'Failed to create teacher account'));
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete || !schoolId) return;
    setDeleteLoading(true);
    try {
      await deleteTeacher(schoolId, teacherToDelete.mongoId);
      setTeachers(prev => prev.filter(t => t.mongoId !== teacherToDelete.mongoId));
      setTeacherToDelete(null);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete teacher'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const loadTeachers = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      setError('School context is missing. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await listTeachers(schoolId, { limit: 100 });
      setTeachers((data || []).map(mapTeacherForApproval));
    } catch (err) {
      setTeachers([]);
      setError(getErrorMessage(err, 'Unable to load teachers'));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const pendingCount = teachers.filter((t) => t.status === 'Pending').length;
  const approvedCount = teachers.filter((t) => t.status === 'Approved').length;
  const rejectedCount = teachers.filter((t) => t.status === 'Rejected').length;
  const totalCount = teachers.length;

  const handleApprove = async (teacher) => {
    if (!schoolId || !teacher?.mongoId) return;
    setActionId(teacher.mongoId);
    try {
      await setTeacherStatus(schoolId, teacher.mongoId, { approvalStatus: 'approved' });
      setTeachers((prev) =>
        prev.map((t) =>
          t.mongoId === teacher.mongoId ? { ...t, status: 'Approved', statusRaw: 'approved' } : t
        )
      );
      if (selectedTeacher?.mongoId === teacher.mongoId) {
        setSelectedTeacher((prev) => ({ ...prev, status: 'Approved', statusRaw: 'approved' }));
      }
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to approve teacher'));
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (teacher) => {
    if (!schoolId || !teacher?.mongoId) return;
    setActionId(teacher.mongoId);
    try {
      await setTeacherStatus(schoolId, teacher.mongoId, { approvalStatus: 'rejected' });
      setTeachers((prev) =>
        prev.map((t) =>
          t.mongoId === teacher.mongoId ? { ...t, status: 'Rejected', statusRaw: 'rejected' } : t
        )
      );
      if (selectedTeacher?.mongoId === teacher.mongoId) {
        setSelectedTeacher((prev) => ({ ...prev, status: 'Rejected', statusRaw: 'rejected' }));
      }
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to reject teacher'));
    } finally {
      setActionId(null);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.phone.includes(searchQuery) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || t.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-12 font-outfit">
      
      {/* Top Banner Header */}
      <div className="bg-[#3b2d7d] text-white px-6 py-6 sticky top-0 z-50 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => navigate('/school/admin')}
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-xl font-black leading-tight">Teacher Approvals</h1>
              <span className="text-[12px] text-purple-200 font-bold block mt-1">
                Review and approve teacher sign up requests
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-white text-[#3b2d7d] px-4 py-2.5 rounded-full text-xs font-black hover:bg-purple-50 active:scale-95 transition-all shadow-md shrink-0"
          >
            <UserPlus size={16} />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="px-6 py-6 space-y-6">
        
        {/* Stat Cards Grid Column layout perfectly matching mockup */}
        <div className="grid grid-cols-4 bg-white border border-gray-200/80 rounded-[2.2rem] p-5 shadow-sm divide-x divide-gray-100">
          {/* Card 1: Pending */}
          <div className={`flex flex-col items-center text-center p-2 cursor-pointer relative ${activeTab === 'Pending' ? 'after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:bg-[#3b2d7d]' : ''}`} onClick={() => setActiveTab('Pending')}>
            <div className="w-9 h-9 rounded-full bg-purple-50 text-[#3b2d7d] flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <span className="text-base font-black text-deep-purple block mt-2">{pendingCount}</span>
            <span className="text-[8.5px] text-gray-400 font-black uppercase tracking-wider block mt-1">Pending</span>
          </div>

          {/* Card 2: Approved */}
          <div className={`flex flex-col items-center text-center p-2 cursor-pointer relative ${activeTab === 'Approved' ? 'after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:bg-[#3b2d7d]' : ''}`} onClick={() => setActiveTab('Approved')}>
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <span className="text-base font-black text-deep-purple block mt-2">{approvedCount}</span>
            <span className="text-[8.5px] text-gray-400 font-black uppercase tracking-wider block mt-1">Approved</span>
          </div>

          {/* Card 3: Rejected */}
          <div className={`flex flex-col items-center text-center p-2 cursor-pointer relative ${activeTab === 'Rejected' ? 'after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:bg-[#3b2d7d]' : ''}`} onClick={() => setActiveTab('Rejected')}>
            <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
              <XCircle size={16} />
            </div>
            <span className="text-base font-black text-deep-purple block mt-2">{rejectedCount}</span>
            <span className="text-[8.5px] text-gray-400 font-black uppercase tracking-wider block mt-1">Rejected</span>
          </div>

          {/* Card 4: Total */}
          <div 
            className={`flex flex-col items-center text-center p-2 cursor-pointer relative ${activeTab === 'All' ? 'after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:bg-[#3b2d7d]' : ''}`} 
            onClick={() => setActiveTab('All')}
          >
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <span className="text-base font-black text-deep-purple block mt-2">{totalCount}</span>
            <span className="text-[8.5px] text-gray-400 font-black uppercase tracking-wider block mt-1">Total Requests</span>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button type="button" onClick={loadTeachers} className="text-red-700 underline shrink-0">Retry</button>
          </div>
        )}

        {/* Action Row Search */}
        <div className="relative flex items-center w-full">
          <Search size={16} className="absolute left-4.5 text-gray-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email or mobile number..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors placeholder:text-gray-300 leading-relaxed shadow-inner"
          />
        </div>

        {/* Tabs Bar Grid */}
        <div className="grid grid-cols-3 bg-white border border-gray-200/80 rounded-2xl p-1 shadow-sm font-black text-xs text-center">
          <button 
            onClick={() => setActiveTab('Pending')}
            className={`py-3 rounded-xl transition-all ${activeTab === 'Pending' ? 'bg-purple-50 text-[#3b2d7d]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Pending ({pendingCount})
          </button>
          <button 
            onClick={() => setActiveTab('Approved')}
            className={`py-3 rounded-xl transition-all ${activeTab === 'Approved' ? 'bg-purple-50 text-[#3b2d7d]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Approved ({approvedCount})
          </button>
          <button 
            onClick={() => setActiveTab('Rejected')}
            className={`py-3 rounded-xl transition-all ${activeTab === 'Rejected' ? 'bg-purple-50 text-[#3b2d7d]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Dynamic Teacher Lists */}
        <div className="space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-3" />
              <span className="text-xs font-bold">Loading teachers…</span>
            </div>
          )}

          {!loading && filteredTeachers.map((t) => (
            <div 
              key={t.mongoId || t.id}
              className="bg-white border border-gray-200/80 rounded-[2.2rem] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Avatar with dynamic clock circle badge overlay */}
                <div className="relative shrink-0">
                  <img 
                    src={t.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=3b2d7d&color=fff`}
                    alt={t.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-purple-100 shadow-inner"
                  />
                  {t.status === 'Pending' && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-purple-50 text-[#3b2d7d] border border-purple-100 flex items-center justify-center shadow-md">
                      <Clock size={11} className="stroke-[2.5]" />
                    </div>
                  )}
                  {t.status === 'Approved' && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-md">
                      <Check size={11} className="stroke-[3.5]" />
                    </div>
                  )}
                  {t.status === 'Rejected' && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shadow-md">
                      <X size={11} className="stroke-[3.5]" />
                    </div>
                  )}
                </div>

                {/* Details Stack */}
                <div className="min-w-0 space-y-1">
                  <h4 className="text-sm font-black text-deep-purple leading-tight">{t.name}</h4>
                  <div className="text-[11px] text-gray-500 font-bold space-y-0.5">
                    <span className="block leading-relaxed">📞 {t.phone}</span>
                    <span className="block leading-relaxed">✉️ {t.email}</span>
                    <span className="block leading-relaxed font-black text-[#3b2d7d]">🪪 {t.id}</span>
                  </div>
                  <span className="text-[9.5px] text-gray-400 font-bold block pt-1">{t.date}</span>
                </div>
              </div>

              {/* Action Buttons Column */}
              <div className="flex flex-col xs:flex-row md:flex-col items-stretch xs:items-center md:items-end gap-2.5 w-full md:w-auto shrink-0 border-t md:border-none pt-4 md:pt-0">
                
                {/* View Details Primary Action */}
                <button 
                  onClick={() => setSelectedTeacher(t)}
                  className="px-4.5 py-2.5 border border-purple-200 text-[#3b2d7d] hover:bg-purple-50/50 bg-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 active:scale-95 flex-1 xs:flex-initial"
                >
                  View Details
                  <ArrowUpRight size={12} className="stroke-[2.5]" />
                </button>

                {/* Confirm/Decline Grid for Pending list */}
                {t.status === 'Pending' && (
                  <div className="flex items-center gap-2 w-full xs:w-auto">
                    <button 
                      onClick={() => handleApprove(t)}
                      disabled={actionId === t.mongoId}
                      className="flex-1 xs:flex-initial px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-emerald-200 active:scale-95 disabled:opacity-50"
                    >
                      <Check size={11} className="stroke-[3.5]" />
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(t)}
                      disabled={actionId === t.mongoId}
                      className="flex-1 xs:flex-initial px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-rose-200 active:scale-95 disabled:opacity-50"
                    >
                      <X size={11} className="stroke-[3.5]" />
                      Reject
                    </button>
                  </div>
                )}

                {/* Quick badge indicators for other tabs */}
                {t.status === 'Approved' && (
                  <span className="px-3 py-1 bg-emerald-50 text-[10px] font-black text-emerald-600 rounded-lg border border-emerald-100">
                    APPROVED
                  </span>
                )}
                {t.status === 'Rejected' && (
                  <span className="px-3 py-1 bg-rose-50 text-[10px] font-black text-rose-500 rounded-lg border border-rose-100">
                    REJECTED
                  </span>
                )}

              </div>

              {/* Delete button */}
              <button 
                className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-rose-600 active:scale-90 transition-transform"
                onClick={() => setTeacherToDelete(t)}
                title="Delete Teacher"
              >
                <Trash2 size={15} />
              </button>

            </div>
          ))}

          {!loading && filteredTeachers.length === 0 && (
            <div className="text-center py-12 bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm">
              <Users size={36} className="text-gray-300 mx-auto block stroke-[1.5]" />
              <span className="text-xs font-black text-gray-400 block mt-3">No matching teacher requests in this tab</span>
            </div>
          )}
        </div>

      </div>

      {/* Onboarding Details Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[2.2rem] shadow-2xl border border-gray-150 overflow-hidden animate-in zoom-in duration-300 relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header with nice purple/indigo gradient */}
            <div className="bg-gradient-to-r from-[#3b2d7d] to-[#5942bc] text-white px-6 py-5 relative flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase">Teacher Onboarding Details</h3>
                <span className="text-[10px] text-purple-200 font-bold block mt-0.5 font-bold">Registration Form Submission</span>
              </div>
              <button 
                onClick={() => setSelectedTeacher(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white border border-white/10"
              >
                <X size={16} className="stroke-[3]" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 scrollbar-none">
              
              {/* Profile Avatar & Primary Title Header card */}
              <div className="flex items-center gap-5 bg-purple-50/40 p-4 rounded-3xl border border-purple-150/40">
                <img 
                  src={selectedTeacher.avatar} 
                  alt={selectedTeacher.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-base font-black text-deep-purple leading-tight truncate">{selectedTeacher.name}</h4>
                  <span className="text-xs font-black text-[#3b2d7d] block mt-1">{selectedTeacher.designation}</span>
                  <span className="text-[10px] text-gray-400 font-bold block mt-0.5">{selectedTeacher.date}</span>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block font-bold">Application Status</span>
                <div className="flex items-center gap-2">
                  {selectedTeacher.status === 'Pending' && (
                    <span className="px-3.5 py-1.5 bg-amber-50 text-[11px] font-black text-amber-600 rounded-xl border border-amber-100 flex items-center gap-1.5 leading-none">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      PENDING REVIEW
                    </span>
                  )}
                  {selectedTeacher.status === 'Approved' && (
                    <span className="px-3.5 py-1.5 bg-emerald-50 text-[11px] font-black text-emerald-600 rounded-xl border border-emerald-100 flex items-center gap-1.5 leading-none">
                      <Check size={12} className="stroke-[3.5]" />
                      APPROVED & SIGNED UP
                    </span>
                  )}
                  {selectedTeacher.status === 'Rejected' && (
                    <span className="px-3.5 py-1.5 bg-rose-50 text-[11px] font-black text-rose-500 rounded-xl border border-rose-100 flex items-center gap-1.5 leading-none">
                      <X size={12} className="stroke-[3.5]" />
                      REJECTED
                    </span>
                  )}
                </div>
              </div>

              {/* General details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Contact phone */}
                <div className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-150 shadow-inner">
                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block font-bold">Mobile Number</span>
                  <span className="font-black text-deep-purple block mt-1 leading-relaxed">📞 {selectedTeacher.phone}</span>
                </div>

                {/* Contact email */}
                <div className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-150 shadow-inner">
                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block font-bold">Email Address</span>
                  <span className="font-black text-deep-purple block mt-1 leading-relaxed truncate">✉️ {selectedTeacher.email}</span>
                </div>

                {/* Staff ID */}
                <div className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-150 shadow-inner">
                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block font-bold">Requested Staff ID</span>
                  <span className="font-black text-deep-purple block mt-1 leading-relaxed">🪪 {selectedTeacher.id}</span>
                </div>

                {/* Ref Code */}
                <div className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-150 shadow-inner">
                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block font-bold">Invitation Reference</span>
                  <span className="font-black text-deep-purple block mt-1 leading-relaxed">🔑 {selectedTeacher.refCode || 'N/A'}</span>
                </div>

              </div>

              {/* Profile Work/Academics Sections */}
              <div className="space-y-4 text-xs">
                
                {/* Department Info */}
                <div className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-150 shadow-inner">
                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block font-bold">Assigned Department</span>
                  <span className="font-bold text-deep-purple block mt-1 leading-relaxed">{selectedTeacher.department}</span>
                </div>

                {/* Qualifications Info */}
                <div className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-150 shadow-inner">
                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block font-bold">Academic Qualifications</span>
                  <span className="font-bold text-deep-purple block mt-1 leading-relaxed">{selectedTeacher.qualifications}</span>
                </div>

                {/* Experience Info */}
                <div className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-150 shadow-inner">
                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block font-bold">Prior Teaching Experience</span>
                  <span className="font-bold text-deep-purple block mt-1 leading-relaxed">{selectedTeacher.experience}</span>
                </div>

              </div>

            </div>

            {/* Modal Sticky Footer Actions */}
            <div className="bg-gray-50 border-t border-gray-200 p-5 flex items-center gap-3 shrink-0">
              
              <button 
                onClick={() => setSelectedTeacher(null)}
                className="flex-1 py-3.5 border-2 border-gray-300 text-gray-500 hover:bg-gray-100 active:scale-95 bg-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
              >
                Close Profile
              </button>

              {selectedTeacher.status === 'Pending' && (
                <>
                  <button 
                    onClick={() => handleApprove(selectedTeacher)}
                    disabled={actionId === selectedTeacher.mongoId}
                    className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Check size={14} className="stroke-[3]" />
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(selectedTeacher)}
                    disabled={actionId === selectedTeacher.mongoId}
                    className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <X size={14} className="stroke-[3]" />
                    Reject
                  </button>
                </>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#3b2d7d] text-white px-6 py-5 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-black">Add Teacher Account</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {addError && (
                <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{addError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teacher Full Name</label>
                <input 
                  type="text"
                  required
                  value={addFormData.name}
                  onChange={(e) => handleAddInputChange('name', e.target.value)}
                  placeholder="e.g. Mrs. Priya Sen"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none placeholder:text-gray-300"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email ID</label>
                <input 
                  type="email"
                  required
                  value={addFormData.email}
                  onChange={(e) => handleAddInputChange('email', e.target.value)}
                  placeholder="teacher@school.com"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none placeholder:text-gray-300"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                <input 
                  type="tel"
                  required
                  value={addFormData.phone}
                  onChange={(e) => handleAddInputChange('phone', e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none placeholder:text-gray-300"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Temporary Password</label>
                <input 
                  type="text"
                  required
                  value={addFormData.password}
                  onChange={(e) => handleAddInputChange('password', e.target.value)}
                  placeholder="At least 8 chars, 1 number, 1 special char"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none placeholder:text-gray-300"
                />
              </div>

              {/* Designation */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Designation (Optional)</label>
                <input 
                  type="text"
                  value={addFormData.designation}
                  onChange={(e) => handleAddInputChange('designation', e.target.value)}
                  placeholder="e.g. PGT Physics"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none placeholder:text-gray-300"
                />
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Department (Optional)</label>
                <input 
                  type="text"
                  value={addFormData.department}
                  onChange={(e) => handleAddInputChange('department', e.target.value)}
                  placeholder="e.g. Science Department"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none placeholder:text-gray-300"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3.5 border border-gray-200 rounded-2xl text-xs font-black text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-3.5 bg-[#3b2d7d] text-white rounded-2xl text-xs font-black hover:bg-purple-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/10"
                >
                  {addLoading ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-deep-purple">Delete Teacher Account?</h3>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                Are you sure you want to delete the account for <strong>{teacherToDelete.name}</strong>? This action will disable their access.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={deleteLoading}
                onClick={() => setTeacherToDelete(null)}
                className="flex-1 py-3 border border-gray-150 rounded-2xl text-xs font-black text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={deleteLoading}
                onClick={handleDeleteTeacher}
                className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-xs font-black hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolTeacherApprovals;
