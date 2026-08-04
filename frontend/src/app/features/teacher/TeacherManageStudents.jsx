import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, User, Phone, Search, X,
  Edit, Save, Calendar, BookOpen, Eye,
  Check, MoreVertical, Trash2, Loader2
} from 'lucide-react';
import {
  listStudents,
  updateStudent,
  deleteStudent,
} from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapStudentForTeacherManage, parseClassGrade, parseSection } from '../../../utils/mappers/teacherMapper';
import { useTeacherSchoolId } from '../../../utils/teacherContext';
import { useTeacherClassOptions } from '../../../hooks/useTeacherClassOptions';

const TeacherManageStudents = () => {
  const navigate = useNavigate();
  const schoolId = useTeacherSchoolId();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Class options come from the teacher's own assignments — the API only
  // returns classes this teacher is permitted to teach
  const { classLabels, getSections, loading: classesLoading, hasClasses } = useTeacherClassOptions(schoolId);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rollNo'); // 'rollNo' or 'name'

  // Dropdowns UI states
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Drawer / Modal Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formRollNo, setFormRollNo] = useState('');
  const [formGender, setFormGender] = useState('Male');
  const [formDob, setFormDob] = useState('');
  const [formFatherName, setFormFatherName] = useState('');
  const [formMotherName, setFormMotherName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAltPhone, setFormAltPhone] = useState('');
  const [formAdmissionNo, setFormAdmissionNo] = useState('');

  // Active Dropdowns inside drawer
  const [formClass, setFormClass] = useState('Class 5');
  const [formSection, setFormSection] = useState('A');

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Actions menu for specific student row
  const [activeActionsMenu, setActiveActionsMenu] = useState(null);

  // Helpers
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Default to the first permitted class/section once assignments load
  useEffect(() => {
    if (!selectedClass && classLabels.length > 0) {
      const firstClass = classLabels[0];
      setSelectedClass(firstClass);
      const sections = getSections(firstClass);
      setSelectedSection(sections[0] || '');
    }
  }, [classLabels, getSections, selectedClass]);

  const loadStudents = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      setError('School context is missing. Please log in again.');
      setStudents([]);
      return;
    }
    if (!selectedClass) {
      setLoading(false);
      setStudents([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const classGrade = parseClassGrade(selectedClass);
      const section = parseSection(selectedSection);
      const { data } = await listStudents(schoolId, { classGrade, section, limit: 200 });
      setStudents((data || []).map(mapStudentForTeacherManage));
    } catch (err) {
      setStudents([]);
      setError(getErrorMessage(err, 'Unable to load students'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedClass, selectedSection]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const buildStudentPayload = () => ({
    name: formName.trim(),
    rollNo: formRollNo.trim(),
    classGrade: parseClassGrade(formClass),
    section: parseSection(formSection),
    gender: formGender === 'Female' ? 'female' : 'male',
    dob: formDob || undefined,
    schoolRefNo: formAdmissionNo.trim() || undefined,
    // Sending parent contact keeps the parent login account linked/updated
    parentName: formFatherName.trim() || undefined,
    parentPhone: formPhone.trim() || undefined,
  });

  // Enrollment happens on the school admin side only; teachers can just edit
  const handleOpenEditDrawer = (student) => {
    setCurrentStudentId(student.id);
    setFormName(student.name);
    setFormRollNo(student.rollNo);
    setFormGender(student.gender);
    setFormDob(student.dob || '');
    setFormFatherName(student.parentName || '');
    setFormMotherName(student.motherName || '');
    setFormPhone(student.phone || '');
    setFormAltPhone(student.altPhone || '');
    setFormAdmissionNo(student.admissionNo || '');
    setFormClass(selectedClass);
    setFormSection(selectedSection);
    setIsDrawerOpen(true);
    setActiveActionsMenu(null);
  };

  const handleDeleteStudent = async (id) => {
    const student = students.find((s) => s.id === id);
    if (!student?.mongoId || !schoolId) return;

    setActiveActionsMenu(null);
    try {
      await deleteStudent(schoolId, student.mongoId);
      triggerToast('Student Removed Successfully!');
      await loadStudents();
    } catch (err) {
      triggerToast(getErrorMessage(err, 'Unable to remove student'));
    }
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formRollNo.trim()) {
      triggerToast('Please fill all required fields (*)');
      return;
    }
    if (!schoolId) {
      triggerToast('School context is missing. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildStudentPayload();
      const student = students.find((s) => s.id === currentStudentId);
      await updateStudent(schoolId, student.mongoId, payload);
      triggerToast('Student Details Updated!');
      setIsDrawerOpen(false);
      await loadStudents();
    } catch (err) {
      triggerToast(getErrorMessage(err, 'Unable to save student'));
    } finally {
      setSaving(false);
    }
  };

  // Computations
  const stats = useMemo(() => {
    const total = students.length;
    const boys = students.filter(s => s.gender === 'Male').length;
    const girls = students.filter(s => s.gender === 'Female').length;
    const parentNumbers = students.filter(s => s.phone).length;
    return { total, boys, girls, parentNumbers };
  }, [students]);

  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.rollNo.includes(query)
      );
    }

    // Sort order
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return parseInt(a.rollNo, 10) - parseInt(b.rollNo, 10);
    });

    return result;
  }, [students, searchQuery, sortBy]);

  // Helper to generate a beautiful gradient letter avatar
  const getAvatarGradient = (name) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'from-purple-500 to-indigo-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600'
    ];
    // Deterministic selection based on name length
    const colorIndex = name.length % colors.length;
    return {
      initials,
      bgClass: colors[colorIndex]
    };
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen select-none font-outfit animate-in fade-in duration-300 pb-20 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-6 duration-300">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <Check size={14} strokeWidth={3} />
          </div>
          <span className="text-xs font-black">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="px-6 pt-7 pb-4 bg-white flex items-center justify-between border-b border-gray-100 relative z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/school/teacher/dashboard')}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-full flex items-center justify-center text-deep-purple mr-1"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-lg font-black text-deep-purple leading-none">Manage Students</h1>
            <p className="text-[10px] text-gray-400 font-bold mt-1">{selectedClass} • {selectedSection}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-xs font-bold">
          <Loader2 size={16} className="animate-spin" />
          Loading students...
        </div>
      )}

      <div className={`space-y-4 px-6 mt-4 relative z-20 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* 2. Dropdown selectors row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Class Dropdown */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => { setIsClassOpen(!isClassOpen); setIsSectionOpen(false); }}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 hover:border-primary/20 active:bg-gray-50 rounded-2xl text-left flex items-center justify-between shadow-sm transition-all"
            >
              <span className="text-xs font-black text-deep-purple">{selectedClass || (classesLoading ? 'Loading…' : 'No class')}</span>
              <span className="text-gray-400 text-xs">▼</span>
            </button>
            {isClassOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsClassOpen(false)} />
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {classLabels.length === 0 ? (
                    <div className="px-4 py-3 text-[11px] font-bold text-gray-400 text-center">No classes assigned to you</div>
                  ) : (
                    classLabels.map(cls => (
                      <button
                        key={cls}
                        type="button"
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
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Section Dropdown */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => { setIsSectionOpen(!isSectionOpen); setIsClassOpen(false); }}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 hover:border-primary/20 active:bg-gray-50 rounded-2xl text-left flex items-center justify-between shadow-sm transition-all"
            >
              <span className="text-xs font-black text-deep-purple">{selectedSection ? `Section ${selectedSection}` : '—'}</span>
              <span className="text-gray-400 text-xs">▼</span>
            </button>
            {isSectionOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSectionOpen(false)} />
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {getSections(selectedClass).length === 0 ? (
                    <div className="px-4 py-3 text-[11px] font-bold text-gray-400 text-center">No sections assigned</div>
                  ) : (
                    getSections(selectedClass).map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => { setSelectedSection(sec); setIsSectionOpen(false); }}
                        className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all ${selectedSection === sec ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                      >
                        Section {sec}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Stat Cards Row */}
        <div className="grid grid-cols-4 gap-2">
          {/* Total Students */}
          <div className="bg-[#F8F6FF] border border-[#E9E4FF] rounded-2xl p-3 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mb-1 shrink-0">
              <Users size={14} className="text-primary" />
            </div>
            <span className="text-sm font-black text-deep-purple leading-none">{stats.total}</span>
            <span className="text-[7px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Total Students</span>
          </div>

          {/* Boys */}
          <div className="bg-[#F3F8FF] border border-[#E1EEFF] rounded-2xl p-3 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-1 shrink-0">
              <User size={14} className="text-blue-500" />
            </div>
            <span className="text-sm font-black text-deep-purple leading-none">{stats.boys}</span>
            <span className="text-[7px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Boys</span>
          </div>

          {/* Girls */}
          <div className="bg-[#FFF5F6] border border-[#FFE2E5] rounded-2xl p-3 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mb-1 shrink-0">
              <User size={14} className="text-rose-500" />
            </div>
            <span className="text-sm font-black text-deep-purple leading-none">{stats.girls}</span>
            <span className="text-[7px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Girls</span>
          </div>

          {/* Parents numbers */}
          <div className="bg-[#F4FBF6] border border-[#E1F7E9] rounded-2xl p-3 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-1 shrink-0">
              <Phone size={14} className="text-emerald-500" />
            </div>
            <span className="text-sm font-black text-deep-purple leading-none">{stats.parentNumbers}</span>
            <span className="text-[7px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Parents Added</span>
          </div>
        </div>

        {/* 4. Action Row */}
        <div className="flex flex-col gap-2.5">
          {/* Search bar */}
          <div className="bg-white border border-gray-200 rounded-2xl px-3.5 py-3 flex items-center gap-2 shadow-sm relative">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-bold text-deep-purple focus:outline-none bg-transparent"
              placeholder="Search by name or roll number..."
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Student enrollment is handled by the school admin — teachers
              only view and edit the roster here */}
          <div className="px-4 py-2.5 bg-purple-50/60 border border-purple-100 rounded-2xl text-[10px] font-bold text-primary">
            New admissions are added by the school office. You can view and update the students of your class here.
          </div>

          {!classesLoading && !hasClasses && (
            <div className="px-4 py-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-center">
              <p className="text-[11px] font-black text-amber-700">No classes assigned to you yet</p>
              <p className="text-[10px] font-bold text-amber-600/80 mt-0.5">
                Your school office assigns classes to teachers. Please contact them to get access.
              </p>
            </div>
          )}
        </div>

        {/* 5. Student List Header Row */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-xs font-black text-deep-purple uppercase tracking-wider">Students ({filteredAndSortedStudents.length})</h2>
          
          <div className="relative">
            <button 
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="text-[10px] font-bold text-primary flex items-center gap-1"
            >
              <span>Sort by: {sortBy === 'name' ? 'Name' : 'Roll No.'}</span>
              <span>▼</span>
            </button>
            {isSortOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSortOpen(false)} />
                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 w-28 animate-in fade-in slide-in-from-top-1 duration-200">
                  <button 
                    type="button"
                    onClick={() => { setSortBy('rollNo'); setIsSortOpen(false); }}
                    className={`w-full px-3 py-1.5 text-left text-[10px] font-bold transition-all ${sortBy === 'rollNo' ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                  >
                    Roll No.
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setSortBy('name'); setIsSortOpen(false); }}
                    className={`w-full px-3 py-1.5 text-left text-[10px] font-bold transition-all ${sortBy === 'name' ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                  >
                    Name
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Roster student card list */}
        <div className="space-y-3">
          {filteredAndSortedStudents.length > 0 ? (
            filteredAndSortedStudents.map(student => {
              const avatar = getAvatarGradient(student.name);
              return (
                <div key={student.id} className="bg-white border border-gray-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm hover:border-primary/20 transition-all relative">
                  
                  {/* Student Details Left */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Roll No badge */}
                    <div className="w-7 h-7 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-primary">{student.rollNo}</span>
                    </div>

                    {/* Gradient initials avatar */}
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${avatar.bgClass} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                      <span className="text-xs font-black tracking-tight">{avatar.initials}</span>
                    </div>

                    {/* Text Details */}
                    <div className="min-w-0 leading-normal">
                      <h4 className="text-xs font-black text-deep-purple truncate">{student.name}</h4>
                      <p className="text-[9px] text-gray-400 font-bold mt-0.5 leading-none">
                        <span className="text-primary/75">Parent:</span> {student.parentName || 'N/A'}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1 mt-1 leading-none">
                        <Phone size={8} className="text-emerald-500 shrink-0" />
                        <span>{student.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions button right */}
                  <div className="flex items-center gap-1.5 relative shrink-0">
                    <button 
                      type="button"
                      onClick={() => handleOpenEditDrawer(student)}
                      className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 active:scale-95 transition-all text-primary rounded-xl flex items-center gap-1.5 border border-primary/10"
                    >
                      <Eye size={13} strokeWidth={2.5} />
                      <span className="text-[10px] font-black">View Details</span>
                    </button>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="bg-white border border-gray-200 border-dashed rounded-2xl py-10 text-center">
              <span className="text-[10px] text-gray-400 font-bold">No students found matching query.</span>
            </div>
          )}
        </div>

      </div>

      {/* Drawer Overlay Backdrop */}
      {isDrawerOpen && (
        <>
          <div 
            className="fixed inset-0 bg-deep-purple/40 backdrop-blur-sm z-[90] transition-all animate-in fade-in duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Add/Edit Student Sliding Sheet */}
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2rem] shadow-2xl z-[100] transition-all animate-in slide-in-from-bottom-24 duration-300 flex flex-col max-h-[88vh] overflow-hidden">
            
            {/* Drawer Drag bar / Header */}
            <div className="flex justify-between items-center px-6 pt-5 pb-3 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-sm font-black text-deep-purple leading-none">Student Information</h3>
                <p className="text-[9px] text-gray-400 font-bold mt-1">Official class & contact details</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center text-gray-450"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable Read-Only Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-24">
              
              {/* Section 1: Student Information */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <User size={12} strokeWidth={2.5} /> Student Information
                </span>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Student Name</label>
                    <span className="text-[11px] font-black text-deep-purple block leading-snug">{formName || '—'}</span>
                  </div>

                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Roll Number</label>
                    <span className="text-[11px] font-black text-deep-purple block leading-snug">{formRollNo || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Gender</label>
                    <span className="text-[11px] font-black text-deep-purple block leading-snug">{formGender || '—'}</span>
                  </div>

                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Date of Birth</label>
                      <span className="text-[10px] font-black text-deep-purple block leading-snug">{formDob || '—'}</span>
                    </div>
                    <Calendar size={13} className="text-gray-400 shrink-0 ml-1.5" />
                  </div>
                </div>
              </div>

              {/* Section 2: Parent Information */}
              <div className="space-y-3 pt-1">
                <span className="text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <Users size={12} strokeWidth={2.5} /> Parent Information
                </span>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Father / Parent Name</label>
                    <span className="text-[11px] font-black text-deep-purple block leading-snug">{formFatherName || '—'}</span>
                  </div>

                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Mother Name</label>
                    <span className="text-[11px] font-black text-deep-purple block leading-snug">{formMotherName || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Parent Phone Number</label>
                    <span className="text-[11px] font-black text-deep-purple block leading-snug">{formPhone || '—'}</span>
                  </div>

                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Alternate Phone</label>
                    <span className="text-[11px] font-black text-deep-purple block leading-snug">{formAltPhone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Academic Information */}
              <div className="space-y-3 pt-1">
                <span className="text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen size={12} strokeWidth={2.5} /> Academic Information
                </span>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5 col-span-1">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Admission No.</label>
                    <span className="text-[11px] font-black text-deep-purple block leading-snug">{formAdmissionNo || '—'}</span>
                  </div>

                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5 relative col-span-1">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Class</label>
                    <span className="text-[11px] font-black text-deep-purple block leading-snug">{formClass || selectedClass}</span>
                  </div>

                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5 relative col-span-1">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Section</label>
                    <span className="text-[11px] font-black text-deep-purple block leading-snug">{formSection ? `Section ${formSection}` : selectedSection}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Drawer Actions Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50 shrink-0">
              <button 
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 active:scale-98 transition-all rounded-[1.8rem] text-xs font-black text-deep-purple flex items-center justify-center gap-2"
              >
                <span>Close</span>
              </button>
            </div>

          </div>
        </>
      )}


    </div>
  );
};

export default TeacherManageStudents;
