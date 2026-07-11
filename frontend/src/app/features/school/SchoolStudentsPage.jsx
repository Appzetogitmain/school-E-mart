import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Filter, ChevronDown, X,
  MoreVertical, RefreshCw, GraduationCap, Users, User,
  Calendar, CheckCircle, AlertCircle, Sparkles, Upload,
  Download, Award, Shield, MapPin, Phone, Mail, Loader2, UserPlus
} from 'lucide-react';
import { listStudents, registerStudent, listClasses } from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapStudentForList, formatClassLabel, calculateAge } from '../../../utils/mappers/schoolStudentMapper';
import { useSchoolId } from '../../../utils/schoolContext';

const SchoolStudentsPage = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();

  const [activeStatTab, setActiveStatTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [sortBy, setSortBy] = useState('Name (A - Z)');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classesList, setClassesList] = useState([]);

  const emptyForm = {
    name: '',
    classGrade: '',
    section: '',
    rollNo: '',
    gender: '',
    dob: '',
    bloodGroup: '',
    motherName: '',
    address: '',
    admissionDate: '',
    previousSchool: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    admissionNo: '',
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addErrors, setAddErrors] = useState({});
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  const loadStudents = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      setError('School context is missing. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await listStudents(schoolId, { limit: 200 });
      setStudents((data || []).map(mapStudentForList));
    } catch (err) {
      setStudents([]);
      setError(getErrorMessage(err, 'Unable to load students'));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      try {
        const list = await listClasses(schoolId);
        setClassesList(list || []);
      } catch (err) {
        console.error('Failed to load classes:', err);
      }
    })();
  }, [schoolId]);

  const selectedFormClass = classesList.find((c) => c.classGrade === addForm.classGrade);
  const formSections = selectedFormClass?.sections || [];
  const allSections = [...new Set(classesList.flatMap((c) => c.sections || []))].sort();

  const handleAddFormChange = (field, value) => {
    // Parent mobile is the login number — keep it to 10 digits
    const val = field === 'parentPhone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setAddForm((prev) => ({
      ...prev,
      [field]: val,
      // Reset section when class changes since sections belong to a class
      ...(field === 'classGrade' ? { section: '' } : {}),
    }));
    setAddErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const openAddModal = () => {
    // Admission date defaults to today — the usual case for a new enrollment
    setAddForm({ ...emptyForm, admissionDate: new Date().toISOString().split('T')[0] });
    setAddErrors({});
    setAddError('');
    setAddSuccess(false);
    setShowAddModal(true);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    const errs = {};
    if (!addForm.name.trim() || addForm.name.trim().length < 2) errs.name = 'Student name is required (min 2 characters)';
    if (!addForm.dob) errs.dob = 'Date of birth is required';
    else if (new Date(addForm.dob) > new Date()) errs.dob = 'Date of birth cannot be in the future';
    if (!addForm.gender) errs.gender = 'Gender is required';
    if (!addForm.classGrade) errs.classGrade = 'Class is required';
    if (!addForm.section) errs.section = 'Section is required';
    if (!addForm.parentName.trim() || addForm.parentName.trim().length < 2) errs.parentName = 'Parent/Guardian name is required (min 2 characters)';
    if (!/^[6-9]\d{9}$/.test(addForm.parentPhone)) errs.parentPhone = 'Valid 10-digit mobile number is required';
    if (addForm.parentEmail.trim() && !/\S+@\S+\.\S+/.test(addForm.parentEmail.trim())) errs.parentEmail = 'Invalid email address';
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!schoolId) {
      setAddError('School context is missing. Please log in again.');
      return;
    }

    setAddSubmitting(true);
    setAddError('');
    try {
      // The parent's mobile becomes (or matches) the login account — the
      // backend auto-creates/links the parent user, profile and child link
      const payload = {
        name: addForm.name.trim(),
        classGrade: addForm.classGrade,
        section: addForm.section,
        dob: addForm.dob,
        gender: addForm.gender,
        parentName: addForm.parentName.trim(),
        parentPhone: addForm.parentPhone,
      };
      if (addForm.parentEmail.trim()) payload.parentEmail = addForm.parentEmail.trim();
      if (addForm.rollNo.trim()) payload.rollNo = addForm.rollNo.trim();
      if (addForm.bloodGroup) payload.bloodGroup = addForm.bloodGroup;
      if (addForm.motherName.trim()) payload.motherName = addForm.motherName.trim();
      if (addForm.address.trim()) payload.address = addForm.address.trim();
      if (addForm.admissionDate) payload.admissionDate = addForm.admissionDate;
      if (addForm.previousSchool.trim()) payload.previousSchool = addForm.previousSchool.trim();
      if (addForm.admissionNo.trim()) payload.admissionNo = addForm.admissionNo.trim();

      await registerStudent(schoolId, payload);
      setAddSuccess(true);
      await loadStudents();
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess(false);
      }, 1500);
    } catch (err) {
      setAddError(getErrorMessage(err, 'Unable to add student'));
    } finally {
      setAddSubmitting(false);
    }
  };

  const boysCount = students.filter((s) => s.gender === 'Boy' && s.status === 'Active').length;
  const girlsCount = students.filter((s) => s.gender === 'Girl' && s.status === 'Active').length;
  const totalCount = students.length;

  // Filter students based on all states combined
  const filteredStudents = students.filter(s => {
    // 1. Search Query
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.id || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.rollNo || '').includes(searchQuery) ||
                          (s.parentPhone || '').includes(searchQuery);
    
    // 2. Class Filter
    const matchesClass = selectedClass === 'All Classes' || s.classGrade === selectedClass;

    // 3. Section Filter
    const matchesSection = selectedSection === 'All Sections' || s.section === selectedSection;
    
    // 4. Stat Tab Filter (All / Boys / Girls cards)
    let matchesStatTab = true;
    if (activeStatTab === 'Boys') {
      matchesStatTab = s.gender === 'Boy' && s.status === 'Active';
    } else if (activeStatTab === 'Girls') {
      matchesStatTab = s.gender === 'Girl' && s.status === 'Active';
    }

    return matchesSearch && matchesClass && matchesSection && matchesStatTab;
  });

  // Sort logic
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'Name (A - Z)') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'Name (Z - A)') {
      return b.name.localeCompare(a.name);
    } else if (sortBy === 'Roll No (Low - High)') {
      return parseInt(a.rollNo) - parseInt(b.rollNo);
    }
    return 0;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 font-outfit">
      
      {/* Sticky Banner Top Header */}
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
            <h1 className="text-xl font-black leading-tight">Students Directory</h1>
            <span className="text-[11px] text-purple-200 font-bold block mt-0.5">
              School Admission & Enrollment Records
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#3b2d7d] rounded-full text-xs font-black hover:bg-purple-50 active:scale-95 transition-all shadow-md shrink-0"
        >
          <UserPlus size={15} className="stroke-[2.5]" />
          Add Student
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={loadStudents} className="text-red-700 underline shrink-0">Retry</button>
        </div>
      )}

      {/* Metrics Row Grid exactly matching the design style */}
      <div className="px-6 pt-6">
        <div className="grid grid-cols-3 gap-3 w-full">
          
          {/* Card 1: Total Students */}
          <div 
            onClick={() => setActiveStatTab('All')}
            className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all active:scale-95 ${
              activeStatTab === 'All' 
                ? 'bg-purple-50/80 border-[#3b2d7d] text-[#3b2d7d] shadow-sm' 
                : 'bg-white border-gray-200/80 text-deep-purple hover:bg-gray-50'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-purple-50 text-[#3b2d7d] flex items-center justify-center mx-auto shrink-0 border border-purple-100">
              <Users size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Total Students</span>
            <span className="text-sm font-black block mt-0.5">{totalCount}</span>
          </div>

          {/* Card 2: Boys */}
          <div 
            onClick={() => setActiveStatTab('Boys')}
            className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all active:scale-95 ${
              activeStatTab === 'Boys' 
                ? 'bg-blue-50/85 border-blue-500 text-blue-700 shadow-sm' 
                : 'bg-white border-gray-200/80 text-deep-purple hover:bg-gray-50'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shrink-0 border border-blue-100">
              <User size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Boys</span>
            <span className="text-sm font-black block mt-0.5">{boysCount}</span>
          </div>

          {/* Card 3: Girls */}
          <div 
            onClick={() => setActiveStatTab('Girls')}
            className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all active:scale-95 ${
              activeStatTab === 'Girls' 
                ? 'bg-pink-50/85 border-pink-400 text-pink-600 shadow-sm' 
                : 'bg-white border-gray-200/80 text-deep-purple hover:bg-gray-50'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center mx-auto shrink-0 border border-pink-100">
              <User size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Girls</span>
            <span className="text-sm font-black block mt-0.5">{girlsCount}</span>
          </div>

        </div>
      </div>

      {/* Search & Selection Filter controls wrapper */}
      <div className="px-6 pt-6 space-y-4">
        
        {/* Search bar & filter trigger button */}
        <div className="relative flex items-center w-full">
          <Search size={16} className="absolute left-4.5 text-gray-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, admission no., roll no. or parent mobile..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors shadow-inner"
          />
        </div>

        {/* Dropdowns lists block */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          
          {/* Dropdown 1: Class */}
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4.5 py-3.5 bg-white border border-gray-200 rounded-2xl font-bold text-deep-purple focus:outline-none appearance-none cursor-pointer shadow-sm"
            >
              <option value="All Classes">All Classes</option>
              {classesList.map((cls) => (
                <option key={cls.classGrade} value={cls.classGrade}>{formatClassLabel(cls.classGrade)}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Dropdown 2: Section */}
          <div className="relative">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-4.5 py-3.5 bg-white border border-gray-200 rounded-2xl font-bold text-deep-purple focus:outline-none appearance-none cursor-pointer shadow-sm"
            >
              <option value="All Sections">All Sections</option>
              {allSections.map((sec) => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

        </div>

      </div>

      {/* Row count & Sort header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-400">
          Showing 1 – {sortedStudents.length} of {totalCount} students
        </span>
        
        {/* Sort Select options dropdown */}
        <div className="relative flex items-center gap-1.5 text-xs">
          <span className="text-gray-400 font-bold">Sort:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent border-none font-black text-deep-purple focus:outline-none cursor-pointer pr-5"
          >
            <option value="Name (A - Z)">Name (A - Z)</option>
            <option value="Name (Z - A)">Name (Z - A)</option>
            <option value="Roll No (Low - High)">Roll No (Low - High)</option>
          </select>
          <ChevronDown size={12} className="absolute right-0 text-deep-purple pointer-events-none" />
        </div>
      </div>

      {/* Student rows list exactly matching mockup */}
      <div className="px-6 py-4 space-y-4">

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={32} className="animate-spin mb-3" />
            <span className="text-xs font-bold">Loading students…</span>
          </div>
        )}

        {!loading && sortedStudents.map((student) => (
          <div 
            key={student.id}
            onClick={() => setSelectedStudent(student)}
            className="bg-white border border-gray-200/80 rounded-[2rem] p-5 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden cursor-pointer hover:border-purple-200 hover:shadow-md transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-4 min-w-0">
              {/* Student avatar */}
              <img 
                src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=3b2d7d&color=fff`}
                alt={student.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-100 shadow-inner shrink-0"
              />
              
              {/* Info Detail stack */}
              <div className="min-w-0 space-y-1">
                <h3 className="text-sm font-black text-deep-purple leading-tight">{student.name}</h3>
                
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-bold text-gray-400">
                  <span className="text-[#3b2d7d] font-black">{student.class}</span>
                  <span>•</span>
                  <span>Roll No. {student.rollNo}</span>
                </div>

                <span className="text-[10px] text-gray-400 font-bold block pt-0.5">
                  Admission No. <span className="font-bold text-deep-purple/80">{student.id}</span>
                </span>

                <span className="text-[10px] text-gray-400 font-bold block">
                  Parent: <span className="text-deep-purple">{student.parent}</span> • {student.parentPhone}
                </span>
              </div>
            </div>



            {/* Open full profile */}
            <button
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-50 text-gray-400 active:scale-90 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStudent(student);
              }}
            >
              <MoreVertical size={16} />
            </button>

          </div>
        ))}

        {!loading && sortedStudents.length === 0 && (
          <div className="text-center py-16 bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm">
            <GraduationCap size={44} className="text-gray-300 mx-auto block stroke-[1.5]" />
            <span className="text-xs font-black text-gray-400 block mt-3">
              {students.length === 0 ? 'No students enrolled yet' : 'No matching students found in this search filter'}
            </span>
            {students.length === 0 && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-3 bg-[#3b2d7d] text-white rounded-2xl text-xs font-black hover:bg-[#5942bc] active:scale-95 transition-all shadow-md"
              >
                <UserPlus size={14} className="stroke-[2.5]" />
                Add Your First Student
              </button>
            )}
          </div>
        )}

      </div>


      {/* Student Details Card Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[2.2rem] shadow-2xl border border-gray-150 overflow-hidden animate-in zoom-in duration-300 relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#3b2d7d] to-[#5942bc] text-white px-6 py-5 relative flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase">Student Profile Card</h3>
                <span className="text-[10px] text-purple-200 font-bold block mt-0.5">{selectedStudent.class}</span>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white border border-white/10"
              >
                <X size={16} className="stroke-[3]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 scrollbar-none text-xs">
              
              {/* Profile Card Header */}
              <div className="flex items-center gap-5 bg-purple-50/40 p-4 rounded-3xl border border-purple-150/40">
                <img
                  src={selectedStudent.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.name)}&background=3b2d7d&color=fff`}
                  alt={selectedStudent.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-base font-black text-deep-purple leading-tight truncate">{selectedStudent.name}</h4>
                  <span className="text-xs font-black text-[#3b2d7d] block mt-1">{selectedStudent.class} • Roll No. {selectedStudent.rollNo}</span>
                  <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Adm No: {selectedStudent.id}</span>
                </div>
              </div>

              {/* Attendance & Fees Performance Strip */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl shadow-sm text-center">
                  <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider block">Attendance</span>
                  <span className="text-lg font-black text-emerald-700 block mt-1">{selectedStudent.attendance}</span>
                </div>
                <div className={`p-4 rounded-2xl border shadow-sm text-center ${
                  selectedStudent.fees === 'Paid'
                    ? 'bg-blue-50/50 border-blue-100 text-blue-700'
                    : 'bg-amber-50/50 border-amber-100 text-amber-700'
                }`}>
                  <span className="text-[9px] font-black uppercase tracking-wider block">Fee Status</span>
                  <span className="text-lg font-black block mt-1">{selectedStudent.fees}</span>
                </div>
              </div>

              {/* Bio Grid */}
              <div className="space-y-4">
                
                {/* Personal particulars */}
                <div className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-150 shadow-inner">
                  <h4 className="text-[9px] text-gray-400 font-black uppercase tracking-wider block font-bold mb-2">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-deep-purple font-bold">
                    <div>📅 DOB: <span className="text-gray-600 font-bold">{selectedStudent.dob}</span></div>
                    <div>🎂 Age: <span className="text-gray-600 font-bold">{selectedStudent.age !== null && selectedStudent.age !== undefined ? `${selectedStudent.age} years` : '—'}</span></div>
                    <div>⚧️ Gender: <span className="text-gray-600 font-bold">{selectedStudent.gender}</span></div>
                    <div>🩸 Blood Group: <span className="text-gray-600 font-bold">{selectedStudent.bloodGroup}</span></div>
                    <div>🛡️ Status: <span className="text-gray-600 font-bold">{selectedStudent.status}</span></div>
                  </div>
                  <div className="mt-2 text-deep-purple font-bold flex items-start gap-1.5">
                    <MapPin size={12} className="text-gray-400 shrink-0 mt-0.5" />
                    <span>Address: <span className="text-gray-600 font-bold">{selectedStudent.address}</span></span>
                  </div>
                </div>

                {/* Admission particulars */}
                <div className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-150 shadow-inner">
                  <h4 className="text-[9px] text-gray-400 font-black uppercase tracking-wider block font-bold mb-2">Admission Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-deep-purple font-bold">
                    <div>🗓️ Admitted: <span className="text-gray-600 font-bold">{selectedStudent.admissionDate}</span></div>
                    <div>🏫 Prev. School: <span className="text-gray-600 font-bold">{selectedStudent.previousSchool}</span></div>
                  </div>
                </div>

                {/* Parent / Guardian Particulars */}
                <div className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-150 shadow-inner space-y-2">
                  <h4 className="text-[9px] text-gray-400 font-black uppercase tracking-wider block font-bold mb-1">Parent/Guardian & Login Account</h4>
                  <div className="space-y-1 font-bold text-deep-purple">
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-gray-400 shrink-0" />
                      <span>Father / Guardian: <span className="text-gray-600 font-bold">{selectedStudent.parent}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-gray-400 shrink-0" />
                      <span>Mother: <span className="text-gray-600 font-bold">{selectedStudent.motherName}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-gray-400 shrink-0" />
                      <span>Login Mobile: <span className="text-gray-600 font-bold">{selectedStudent.parentPhone}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-gray-400 shrink-0" />
                      <span>Email: <span className="text-gray-600 font-bold truncate">{selectedStudent.parentEmail}</span></span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-5 flex items-center justify-end shrink-0">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#3b2d7d] hover:bg-[#5942bc] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[2.2rem] shadow-2xl border border-gray-150 overflow-hidden animate-in zoom-in duration-300 relative flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#3b2d7d] to-[#5942bc] text-white px-6 py-5 relative flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase">Student Enrollment Form</h3>
                <span className="text-[10px] text-purple-200 font-bold block mt-0.5">Admission record + parent login account in one step</span>
              </div>
              <button
                type="button"
                onClick={() => !addSubmitting && setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white border border-white/10"
              >
                <X size={16} className="stroke-[3]" />
              </button>
            </div>

            {addSuccess ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h4 className="text-sm font-black text-deep-purple mt-4">Student Added Successfully!</h4>
                <span className="text-[11px] text-gray-400 font-bold block mt-1">The students list has been updated.</span>
              </div>
            ) : (
              <form onSubmit={handleAddStudent} className="flex flex-col min-h-0">
                <div className="p-6 overflow-y-auto space-y-4 scrollbar-none text-xs">

                  {addError && (
                    <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{addError}</span>
                    </div>
                  )}

                  {/* ── Section 1: Student Details ── */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="w-5 h-5 rounded-lg bg-[#3b2d7d] text-white flex items-center justify-center text-[9px] font-black shrink-0">1</span>
                    <h4 className="text-[10px] text-[#3b2d7d] font-black uppercase tracking-widest">Student Details</h4>
                    <div className="flex-1 h-px bg-purple-100" />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Student Full Name *</label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={(e) => handleAddFormChange('name', e.target.value)}
                      placeholder="Full name as per records"
                      className={`w-full px-4 py-3.5 bg-white border rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors ${addErrors.name ? 'border-red-300' : 'border-gray-200'}`}
                    />
                    {addErrors.name && <span className="text-[10px] text-red-500 font-bold block mt-1">{addErrors.name}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Date of Birth *</label>
                      <input
                        type="date"
                        value={addForm.dob}
                        onChange={(e) => handleAddFormChange('dob', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3.5 bg-white border rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors ${addErrors.dob ? 'border-red-300' : 'border-gray-200'}`}
                      />
                      {addErrors.dob && <span className="text-[10px] text-red-500 font-bold block mt-1">{addErrors.dob}</span>}
                      {addForm.dob && calculateAge(addForm.dob) !== null && (
                        <span className="text-[10px] text-emerald-600 font-black block mt-1">
                          Age: {calculateAge(addForm.dob)} years
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Gender *</label>
                      <div className="relative">
                        <select
                          value={addForm.gender}
                          onChange={(e) => handleAddFormChange('gender', e.target.value)}
                          className={`w-full px-4 py-3.5 bg-white border rounded-2xl font-bold text-deep-purple focus:outline-none appearance-none cursor-pointer ${addErrors.gender ? 'border-red-300' : 'border-gray-200'}`}
                        >
                          <option value="">Select</option>
                          <option value="male">Boy</option>
                          <option value="female">Girl</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {addErrors.gender && <span className="text-[10px] text-red-500 font-bold block mt-1">{addErrors.gender}</span>}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Blood Group</label>
                    <div className="relative">
                      <select
                        value={addForm.bloodGroup}
                        onChange={(e) => handleAddFormChange('bloodGroup', e.target.value)}
                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl font-bold text-deep-purple focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* ── Section 2: Academic Details ── */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="w-5 h-5 rounded-lg bg-[#3b2d7d] text-white flex items-center justify-center text-[9px] font-black shrink-0">2</span>
                    <h4 className="text-[10px] text-[#3b2d7d] font-black uppercase tracking-widest">Academic Details</h4>
                    <div className="flex-1 h-px bg-purple-100" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Class *</label>
                      <div className="relative">
                        <select
                          value={addForm.classGrade}
                          onChange={(e) => handleAddFormChange('classGrade', e.target.value)}
                          className={`w-full px-4 py-3.5 bg-white border rounded-2xl font-bold text-deep-purple focus:outline-none appearance-none cursor-pointer ${addErrors.classGrade ? 'border-red-300' : 'border-gray-200'}`}
                        >
                          <option value="">Select Class</option>
                          {classesList.map((cls) => (
                            <option key={cls.classGrade} value={cls.classGrade}>{formatClassLabel(cls.classGrade)}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {addErrors.classGrade && <span className="text-[10px] text-red-500 font-bold block mt-1">{addErrors.classGrade}</span>}
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Section *</label>
                      <div className="relative">
                        <select
                          value={addForm.section}
                          onChange={(e) => handleAddFormChange('section', e.target.value)}
                          disabled={!addForm.classGrade}
                          className={`w-full px-4 py-3.5 bg-white border rounded-2xl font-bold text-deep-purple focus:outline-none appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed ${addErrors.section ? 'border-red-300' : 'border-gray-200'}`}
                        >
                          <option value="">{addForm.classGrade ? 'Select Section' : 'Pick class first'}</option>
                          {formSections.map((sec) => (
                            <option key={sec} value={sec}>Section {sec}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {addErrors.section && <span className="text-[10px] text-red-500 font-bold block mt-1">{addErrors.section}</span>}
                    </div>
                  </div>

                  {addForm.classGrade && formSections.length === 0 && (
                    <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl text-[11px] font-bold text-amber-700">
                      This class has no sections yet.{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/school/add-class')}
                        className="underline font-black"
                      >
                        Add a section
                      </button>{' '}
                      to it first — a section is required for enrollment.
                    </div>
                  )}

                  {classesList.length === 0 && (
                    <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl text-[11px] font-bold text-amber-700">
                      No classes found. Please{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/school/add-class')}
                        className="underline font-black"
                      >
                        create a class & section
                      </button>{' '}
                      first, then enroll students into it.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Roll No.</label>
                      <input
                        type="text"
                        value={addForm.rollNo}
                        onChange={(e) => handleAddFormChange('rollNo', e.target.value)}
                        placeholder="e.g. 24"
                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Admission No.</label>
                      <input
                        type="text"
                        value={addForm.admissionNo}
                        onChange={(e) => handleAddFormChange('admissionNo', e.target.value)}
                        placeholder="e.g. ADM-2026-104"
                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Admission Date</label>
                      <input
                        type="date"
                        value={addForm.admissionDate}
                        onChange={(e) => handleAddFormChange('admissionDate', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Previous School</label>
                      <input
                        type="text"
                        value={addForm.previousSchool}
                        onChange={(e) => handleAddFormChange('previousSchool', e.target.value)}
                        placeholder="If transferring (optional)"
                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* ── Section 3: Contact Address ── */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="w-5 h-5 rounded-lg bg-[#3b2d7d] text-white flex items-center justify-center text-[9px] font-black shrink-0">3</span>
                    <h4 className="text-[10px] text-[#3b2d7d] font-black uppercase tracking-widest">Contact Address</h4>
                    <div className="flex-1 h-px bg-purple-100" />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Residential Address</label>
                    <textarea
                      value={addForm.address}
                      onChange={(e) => handleAddFormChange('address', e.target.value)}
                      placeholder="House no., street, area, city, PIN code"
                      rows={2}
                      maxLength={500}
                      className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors resize-none"
                    />
                  </div>

                  {/* ── Section 4: Parent / Guardian & Login Account ── */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="w-5 h-5 rounded-lg bg-[#3b2d7d] text-white flex items-center justify-center text-[9px] font-black shrink-0">4</span>
                    <h4 className="text-[10px] text-[#3b2d7d] font-black uppercase tracking-widest">Parent / Guardian & Login Account</h4>
                    <div className="flex-1 h-px bg-purple-100" />
                  </div>

                  {/* The parent account (login user) is created automatically
                      from these fields */}
                  <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100 space-y-3">

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Father / Guardian Name *</label>
                        <input
                          type="text"
                          value={addForm.parentName}
                          onChange={(e) => handleAddFormChange('parentName', e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className={`w-full px-4 py-3.5 bg-white border rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors ${addErrors.parentName ? 'border-red-300' : 'border-gray-200'}`}
                        />
                        {addErrors.parentName && <span className="text-[10px] text-red-500 font-bold block mt-1">{addErrors.parentName}</span>}
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Mother Name</label>
                        <input
                          type="text"
                          value={addForm.motherName}
                          onChange={(e) => handleAddFormChange('motherName', e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#3b2d7d] font-black uppercase tracking-wider block mb-1.5">Parent Mobile Number * — Login Number</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b2d7d] pointer-events-none" />
                        <input
                          type="tel"
                          value={addForm.parentPhone}
                          onChange={(e) => handleAddFormChange('parentPhone', e.target.value)}
                          placeholder="10-digit mobile number"
                          className={`w-full pl-10 pr-4 py-3.5 bg-white border-2 rounded-2xl text-sm font-black text-deep-purple focus:outline-none focus:border-[#3b2d7d] transition-colors ${addErrors.parentPhone ? 'border-red-300' : 'border-purple-200'}`}
                        />
                      </div>
                      {addErrors.parentPhone && <span className="text-[10px] text-red-500 font-bold block mt-1">{addErrors.parentPhone}</span>}
                      <span className="text-[10px] text-[#3b2d7d] font-bold block mt-1.5 bg-white/70 border border-purple-100 rounded-xl px-3 py-2">
                        🔑 This number is the family's login for the app (OTP login) — the student and parent use this one account. If the number is already registered (e.g. a sibling studies here), this student is linked to that same account.
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Parent Email (Optional)</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="email"
                          value={addForm.parentEmail}
                          onChange={(e) => handleAddFormChange('parentEmail', e.target.value)}
                          placeholder="email@example.com"
                          className={`w-full pl-10 pr-4 py-3.5 bg-white border rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors ${addErrors.parentEmail ? 'border-red-300' : 'border-gray-200'}`}
                        />
                      </div>
                      {addErrors.parentEmail && <span className="text-[10px] text-red-500 font-bold block mt-1">{addErrors.parentEmail}</span>}
                      <span className="text-[10px] text-gray-400 font-bold block mt-1">
                        If provided, a welcome email with login details is sent to the parent.
                      </span>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-200 p-5 flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={addSubmitting}
                    className="flex-1 px-6 py-3.5 bg-white border border-gray-200 text-gray-500 font-black rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addSubmitting}
                    className="flex-1 px-6 py-3.5 bg-[#3b2d7d] hover:bg-[#5942bc] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {addSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Adding…
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} className="stroke-[2.5]" />
                        Add Student
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolStudentsPage;
