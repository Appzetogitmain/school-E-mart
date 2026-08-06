import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Filter, ChevronDown, X,
  MoreVertical, RefreshCw, GraduationCap, Users, User,
  Calendar, CheckCircle, AlertCircle, Sparkles, Upload,
  Download, Award, Shield, MapPin, Phone, Mail, Loader2, UserPlus, Edit2, Trash2, Camera
} from 'lucide-react';
import { listStudents, registerStudent, updateStudent, listClasses, updateStudentStatus, getAttendanceHistory, uploadSchoolFile } from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapStudentForList, formatClassLabel, calculateAge } from '../../../utils/mappers/schoolStudentMapper';
import { useSchoolId } from '../../../utils/schoolContext';
import { toAbsoluteUrl } from '../../../utils/url';

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
    motherName: '',
    address: '',
    admissionDate: '',
    previousSchool: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    admissionNo: '',
    avatarUrl: '',
  };
  const [addUploadingPhoto, setAddUploadingPhoto] = useState(false);
  const [editUploadingPhoto, setEditUploadingPhoto] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addErrors, setAddErrors] = useState({});
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  // Edit Student Modal state & handlers
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editErrors, setEditErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  const handleFileUpload = async (file, isEdit = false) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (isEdit) setEditError('Please select a valid image file');
      else setAddError('Please select a valid image file');
      return;
    }
    const setUploading = isEdit ? setEditUploadingPhoto : setAddUploadingPhoto;
    const setForm = isEdit ? setEditForm : setAddForm;
    const setErrorState = isEdit ? setEditError : setAddError;

    setUploading(true);
    setErrorState('');
    try {
      const attachment = await uploadSchoolFile(schoolId, file, 'profile_avatar');
      const storageKey = attachment?.storageKey || attachment?.url || attachment?.path || '';
      if (storageKey) {
        setForm((prev) => ({ ...prev, avatarUrl: storageKey }));
      }
    } catch (err) {
      setErrorState(getErrorMessage(err, 'Failed to upload photo'));
    } finally {
      setUploading(false);
    }
  };

  // Detailed Attendance state for selected student
  const [studentAttendanceLogs, setStudentAttendanceLogs] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Delete Student Modal state & handlers
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteStudent = async () => {
    if (!studentToDelete?.mongoId || !schoolId) return;
    setDeleteSubmitting(true);
    setDeleteError('');
    try {
      await deleteStudent(schoolId, studentToDelete.mongoId);
      setStudentToDelete(null);
      if (selectedStudent?.mongoId === studentToDelete.mongoId) {
        setSelectedStudent(null);
      }
      await loadStudents();
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Failed to delete student'));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const loadStudents = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      setError('School context is missing. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await listStudents(schoolId, { limit: 500 });
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

  // Enrolment status had no control anywhere, so a student could never be marked
  // inactive or graduated even though the endpoint has always existed.
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState('');

  const handleStatusChange = async (student, nextStatus) => {
    if (!schoolId || !student) return;
    setStatusSaving(true);
    setStatusError('');
    try {
      // mongoId, not id — the mapper's `id` is the human-readable schoolRefNo
      await updateStudentStatus(schoolId, student.mongoId, nextStatus);
      const label = nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1);
      setSelectedStudent((prev) =>
        prev && prev.mongoId === student.mongoId
          ? { ...prev, status: label, statusRaw: nextStatus }
          : prev
      );
      await loadStudents();
    } catch (err) {
      setStatusError(getErrorMessage(err, 'Unable to update the status'));
    } finally {
      setStatusSaving(false);
    }
  };

  useEffect(() => {
    if (!schoolId || !selectedStudent?.mongoId) {
      setStudentAttendanceLogs([]);
      return;
    }
    let cancelled = false;
    setAttendanceLoading(true);
    (async () => {
      try {
        const res = await getAttendanceHistory(schoolId, {
          studentId: selectedStudent.mongoId,
          limit: 300,
        });
        const logs = Array.isArray(res) ? res : (res?.data || []);
        if (!cancelled) setStudentAttendanceLogs(logs);
      } catch {
        if (!cancelled) setStudentAttendanceLogs([]);
      } finally {
        if (!cancelled) setAttendanceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [schoolId, selectedStudent?.mongoId]);

  const attendanceStats = useMemo(() => {
    if (!studentAttendanceLogs.length) {
      return {
        overallPercentage: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        leaveCount: 0,
        totalDays: 0,
        presentPercent: 0,
        absentPercent: 0,
        latePercent: 0,
        leavePercent: 0,
      };
    }
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    studentAttendanceLogs.forEach((rec) => {
      const st = rec?.status || rec?.attendance?.status;
      if (st === 'present') present += 1;
      else if (st === 'absent') absent += 1;
      else if (st === 'half_day' || st === 'late') late += 1;
      else if (st === 'leave') leave += 1;
    });
    const total = present + absent + late + leave;
    const overall = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
    return {
      overallPercentage: overall,
      presentCount: present,
      absentCount: absent,
      lateCount: late,
      leaveCount: leave,
      totalDays: total,
      presentPercent: total > 0 ? Math.round((present / total) * 100) : 0,
      absentPercent: total > 0 ? Math.round((absent / total) * 100) : 0,
      latePercent: total > 0 ? Math.round((late / total) * 100) : 0,
      leavePercent: total > 0 ? Math.round((leave / total) * 100) : 0,
    };
  }, [studentAttendanceLogs]);

  const openEditModal = (student) => {
    const raw = student.raw || {};
    setEditingStudent(student);
    setEditForm({
      name: raw.name || student.name || '',
      classGrade: raw.classGrade || student.classGrade || '',
      section: raw.section || student.section || '',
      rollNo: raw.rollNo || (student.rollNo !== '—' ? student.rollNo : ''),
      gender: raw.gender || (student.gender === 'Boy' ? 'male' : student.gender === 'Girl' ? 'female' : ''),
      dob: raw.dob ? new Date(raw.dob).toISOString().split('T')[0] : '',
      motherName: raw.motherName || (student.motherName !== '—' ? student.motherName : ''),
      address: raw.address || (student.address !== '—' ? student.address : ''),
      admissionDate: raw.admissionDate ? new Date(raw.admissionDate).toISOString().split('T')[0] : '',
      previousSchool: raw.previousSchool || (student.previousSchool !== '—' ? student.previousSchool : ''),
      parentName: student.parent !== '—' ? student.parent : '',
      parentPhone: student.parentPhone !== '—' ? student.parentPhone : '',
      parentEmail: student.parentEmail !== '—' ? student.parentEmail : '',
      admissionNo: raw.admissionNo || '',
      avatarUrl: raw.avatarUrl || '',
    });
    setEditErrors({});
    setEditError('');
    setEditSuccess(false);
    setShowEditModal(true);
  };

  const handleEditFormChange = (field, value) => {
    const val = field === 'parentPhone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setEditForm((prev) => ({ ...prev, [field]: val }));
    if (editErrors[field]) setEditErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudent?.mongoId || !schoolId) return;

    const errs = {};
    if (!editForm.name.trim()) errs.name = 'Student name is required';
    if (!editForm.classGrade.trim()) errs.classGrade = 'Class/Grade is required';
    if (!editForm.section.trim()) errs.section = 'Section is required';
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setEditSubmitting(true);
    setEditError('');

    try {
      const payload = {
        name: editForm.name.trim(),
        classGrade: editForm.classGrade.trim(),
        section: editForm.section.trim(),
        rollNo: editForm.rollNo.trim() || undefined,
        admissionNo: editForm.admissionNo.trim() || undefined,
        gender: editForm.gender || undefined,
        dob: editForm.dob ? new Date(editForm.dob).toISOString() : undefined,
        motherName: editForm.motherName.trim() || undefined,
        address: editForm.address.trim() || undefined,
        admissionDate: editForm.admissionDate ? new Date(editForm.admissionDate).toISOString() : undefined,
        previousSchool: editForm.previousSchool.trim() || undefined,
        avatarUrl: editForm.avatarUrl || undefined,
      };

      if (editForm.parentPhone && editForm.parentPhone.length === 10) {
        payload.parentPhone = editForm.parentPhone;
        if (editForm.parentName.trim()) payload.parentName = editForm.parentName.trim();
        if (editForm.parentEmail.trim()) payload.parentEmail = editForm.parentEmail.trim();
      }

      const updatedRaw = await updateStudent(schoolId, editingStudent.mongoId, payload);
      const mapped = mapStudentForList(updatedRaw);

      setSelectedStudent(mapped);
      await loadStudents();

      setEditSuccess(true);
      setTimeout(() => {
        setEditSuccess(false);
        setShowEditModal(false);
      }, 1500);
    } catch (err) {
      setEditError(getErrorMessage(err, 'Failed to update student profile'));
    } finally {
      setEditSubmitting(false);
    }
  };

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
      if (addForm.motherName.trim()) payload.motherName = addForm.motherName.trim();
      if (addForm.address.trim()) payload.address = addForm.address.trim();
      if (addForm.admissionDate) payload.admissionDate = addForm.admissionDate;
      if (addForm.previousSchool.trim()) payload.previousSchool = addForm.previousSchool.trim();
      if (addForm.admissionNo.trim()) payload.admissionNo = addForm.admissionNo.trim();
      if (addForm.avatarUrl) payload.avatarUrl = addForm.avatarUrl;

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

  const boysCount = students.filter((s) => (s.gender || '').toLowerCase() === 'boy' || (s.gender || '').toLowerCase() === 'male').length;
  const girlsCount = students.filter((s) => (s.gender || '').toLowerCase() === 'girl' || (s.gender || '').toLowerCase() === 'female').length;
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
      matchesStatTab = (s.gender || '').toLowerCase() === 'boy' || (s.gender || '').toLowerCase() === 'male';
    } else if (activeStatTab === 'Girls') {
      matchesStatTab = (s.gender || '').toLowerCase() === 'girl' || (s.gender || '').toLowerCase() === 'female';
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
            className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all active:scale-95 ${activeStatTab === 'All'
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
            className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all active:scale-95 ${activeStatTab === 'Boys'
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
            className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all active:scale-95 ${activeStatTab === 'Girls'
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



            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-1">
              <button
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-600 active:scale-90 transition-all"
                title="Delete Student"
                onClick={(e) => {
                  e.stopPropagation();
                  setStudentToDelete(student);
                  setDeleteError('');
                }}
              >
                <Trash2 size={15} />
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-50 text-gray-400 active:scale-90 transition-transform"
                title="View Profile"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStudent(student);
                }}
              >
                <MoreVertical size={16} />
              </button>
            </div>

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

              {/* Detailed Attendance Section (Circular Donut Graph) */}
              <div className="bg-[#FAFAFC] border border-gray-150 p-4.5 rounded-3xl shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block">
                    📊 Attendance Overview
                  </span>
                  {attendanceStats.totalDays > 0 && (
                    <span className="text-[10px] bg-purple-50 text-[#3b2d7d] font-black px-2.5 py-0.5 rounded-full border border-purple-100">
                      {attendanceStats.totalDays} Days Recorded
                    </span>
                  )}
                </div>

                {attendanceLoading ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
                    <Loader2 size={16} className="animate-spin text-[#3b2d7d]" />
                    <span>Loading Attendance Breakdown...</span>
                  </div>
                ) : attendanceStats.totalDays === 0 ? (
                  <div className="py-4 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <span className="text-xs font-bold text-gray-500 block">No Attendance Records Logged Yet</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Logs will automatically accumulate as attendance is marked.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-5 pt-0.5">
                    {/* SVG Circular Donut Progress Ring */}
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          stroke="#E5E7EB"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          stroke="url(#studentProfileAttendanceGradient)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="239"
                          strokeDashoffset={239 - (239 * attendanceStats.overallPercentage) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                        />
                        <defs>
                          <linearGradient id="studentProfileAttendanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#34A853" />
                            <stop offset="50%" stopColor="#F2994A" />
                            <stop offset="100%" stopColor="#7F56D9" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-sm font-black text-gray-800 leading-none">
                          {attendanceStats.overallPercentage}%
                        </span>
                        <span className="text-[7.5px] font-black text-gray-400 mt-0.5 uppercase tracking-tight">
                          Overall
                        </span>
                      </div>
                    </div>

                    {/* Stats Legend Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-emerald-50/80 border border-emerald-100 p-2 rounded-xl">
                        <div className="flex items-center gap-1.5 text-[#34A853] font-black text-[9.5px] uppercase">
                          <span className="w-2 h-2 rounded-full bg-[#34A853] shrink-0" />
                          Present
                        </div>
                        <span className="text-xs font-black text-emerald-900 block mt-0.5">
                          {attendanceStats.presentCount} <span className="text-[9px] text-emerald-600 font-bold">({attendanceStats.presentPercent}%)</span>
                        </span>
                      </div>

                      <div className="bg-red-50/80 border border-red-100 p-2 rounded-xl">
                        <div className="flex items-center gap-1.5 text-[#D93025] font-black text-[9.5px] uppercase">
                          <span className="w-2 h-2 rounded-full bg-[#D93025] shrink-0" />
                          Absent
                        </div>
                        <span className="text-xs font-black text-red-900 block mt-0.5">
                          {attendanceStats.absentCount} <span className="text-[9px] text-red-600 font-bold">({attendanceStats.absentPercent}%)</span>
                        </span>
                      </div>

                      <div className="bg-amber-50/80 border border-amber-100 p-2 rounded-xl">
                        <div className="flex items-center gap-1.5 text-[#F2994A] font-black text-[9.5px] uppercase">
                          <span className="w-2 h-2 rounded-full bg-[#F2994A] shrink-0" />
                          Late/Half
                        </div>
                        <span className="text-xs font-black text-amber-900 block mt-0.5">
                          {attendanceStats.lateCount} <span className="text-[9px] text-amber-600 font-bold">({attendanceStats.latePercent}%)</span>
                        </span>
                      </div>

                      <div className="bg-purple-50/80 border border-purple-100 p-2 rounded-xl">
                        <div className="flex items-center gap-1.5 text-[#7F56D9] font-black text-[9.5px] uppercase">
                          <span className="w-2 h-2 rounded-full bg-[#7F56D9] shrink-0" />
                          Leave
                        </div>
                        <span className="text-xs font-black text-purple-900 block mt-0.5">
                          {attendanceStats.leaveCount} <span className="text-[9px] text-purple-600 font-bold">({attendanceStats.leavePercent}%)</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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
                  </div>
                  <div className="mt-2 text-deep-purple font-bold flex items-start gap-1.5">
                    <MapPin size={12} className="text-gray-400 shrink-0 mt-0.5" />
                    <span>Address: <span className="text-gray-600 font-bold">{selectedStudent.address}</span></span>
                  </div>

                  {/* Enrolment status — editable */}
                  <div className="mt-3.5 pt-3.5 border-t border-gray-150">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">
                      🛡️ Enrolment status
                    </span>
                    <div className="flex gap-1.5">
                      {[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'alumni', label: 'Alumni' },
                      ].map((option) => {
                        const isCurrent = (selectedStudent.statusRaw || 'active') === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => !isCurrent && handleStatusChange(selectedStudent, option.value)}
                            disabled={statusSaving || isCurrent}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all active:scale-[0.98] disabled:opacity-60 ${isCurrent
                                ? 'bg-[#3b2d7d] border-[#3b2d7d] text-white'
                                : 'bg-white border-gray-200 text-deep-purple hover:bg-gray-50'
                              }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    {statusSaving && (
                      <p className="text-[10px] font-bold text-gray-400 mt-1.5">Saving…</p>
                    )}
                    {statusError && (
                      <p className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-2.5 py-1.5 mt-1.5">
                        {statusError}
                      </p>
                    )}
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
            <div className="bg-gray-50 border-t border-gray-200 p-5 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedStudent)}
                  className="px-4 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
                >
                  <Edit2 size={14} className="stroke-[2.5]" />
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentToDelete(selectedStudent);
                    setDeleteError('');
                  }}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
                >
                  <Trash2 size={14} className="stroke-[2.5]" />
                  Delete
                </button>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-3 bg-[#3b2d7d] hover:bg-[#5942bc] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-[2.2rem] shadow-2xl border border-gray-150 overflow-hidden animate-in zoom-in duration-300 relative flex flex-col max-h-[92vh]">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#3b2d7d] to-[#5942bc] text-white px-6 py-5 relative flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase">Edit Student Profile</h3>
                <span className="text-[10px] text-purple-200 font-bold block mt-0.5">
                  Update student information & synchronization
                </span>
              </div>
              <button
                type="button"
                onClick={() => !editSubmitting && setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white border border-white/10"
              >
                <X size={16} className="stroke-[3]" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4 text-xs scrollbar-none">

              {editSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>Student profile updated successfully!</span>
                </div>
              )}

              {editError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Student Personal Details */}
              <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-150 space-y-3">
                <span className="text-[10px] font-black text-[#3b2d7d] uppercase tracking-wider block">
                  1. Student Particulars
                </span>

                {/* Profile Photo Upload Field */}
                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200">
                  <div className="relative shrink-0">
                    <img
                      src={editForm.avatarUrl ? toAbsoluteUrl(editForm.avatarUrl) : `https://ui-avatars.com/api/?name=${encodeURIComponent(editForm.name || 'Student')}&background=3b2d7d&color=fff`}
                      alt="Student Profile"
                      className="w-14 h-14 rounded-full object-cover border-2 border-purple-100 shadow-sm"
                    />
                    {editUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                        <Loader2 size={16} className="text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Profile Photo</label>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#3b2d7d] border border-purple-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
                        <Camera size={13} />
                        <span>{editUploadingPhoto ? 'Uploading…' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], true)}
                          disabled={editUploadingPhoto}
                          className="hidden"
                        />
                      </label>
                      {editForm.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => handleEditFormChange('avatarUrl', '')}
                          className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold block mt-1">
                      Allowed JPG, PNG or WEBP (Max 5MB)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Student Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                  />
                  {editErrors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{editErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Class / Grade <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editForm.classGrade}
                      onChange={(e) => {
                        handleEditFormChange('classGrade', e.target.value);
                        handleEditFormChange('section', '');
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                    >
                      <option value="">Select Class</option>
                      {classesList.map((c) => (
                        <option key={c._id || c.classGrade} value={c.classGrade}>
                          {formatClassLabel(c.classGrade)}
                        </option>
                      ))}
                    </select>
                    {editErrors.classGrade && <p className="text-[10px] text-red-500 font-bold mt-1">{editErrors.classGrade}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editForm.section}
                      onChange={(e) => handleEditFormChange('section', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                    >
                      <option value="">Select Section</option>
                      {(classesList.find((c) => c.classGrade === editForm.classGrade)?.sections || allSections).map((s) => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                    {editErrors.section && <p className="text-[10px] text-red-500 font-bold mt-1">{editErrors.section}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={editForm.rollNo}
                      onChange={(e) => handleEditFormChange('rollNo', e.target.value)}
                      placeholder="e.g. 12"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Admission Number</label>
                    <input
                      type="text"
                      value={editForm.admissionNo}
                      onChange={(e) => handleEditFormChange('admissionNo', e.target.value)}
                      placeholder="e.g. ADM-2026-001"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.dob}
                      onChange={(e) => handleEditFormChange('dob', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => handleEditFormChange('gender', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Boy</option>
                      <option value="female">Girl</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => handleEditFormChange('address', e.target.value)}
                    placeholder="Residential address"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                  />
                </div>
              </div>

              {/* Admission & Additional Details */}
              <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-150 space-y-3">
                <span className="text-[10px] font-black text-[#3b2d7d] uppercase tracking-wider block">
                  2. Admission & Family
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Admission Date</label>
                    <input
                      type="date"
                      value={editForm.admissionDate}
                      onChange={(e) => handleEditFormChange('admissionDate', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Previous School</label>
                    <input
                      type="text"
                      value={editForm.previousSchool}
                      onChange={(e) => handleEditFormChange('previousSchool', e.target.value)}
                      placeholder="Previous school name"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    value={editForm.motherName}
                    onChange={(e) => handleEditFormChange('motherName', e.target.value)}
                    placeholder="Mother's full name"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                  />
                </div>
              </div>

              {/* Parent & Login Details */}
              <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-150 space-y-3">
                <span className="text-[10px] font-black text-[#3b2d7d] uppercase tracking-wider block">
                  3. Parent / Guardian Account
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Father / Guardian Name</label>
                  <input
                    type="text"
                    value={editForm.parentName}
                    onChange={(e) => handleEditFormChange('parentName', e.target.value)}
                    placeholder="Father/Guardian name"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Parent Mobile (Login ID)</label>
                    <input
                      type="text"
                      value={editForm.parentPhone}
                      onChange={(e) => handleEditFormChange('parentPhone', e.target.value)}
                      placeholder="10 digit mobile"
                      maxLength={10}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Parent Email</label>
                    <input
                      type="email"
                      value={editForm.parentEmail}
                      onChange={(e) => handleEditFormChange('parentEmail', e.target.value)}
                      placeholder="Email address"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#3b2d7d]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={editSubmitting}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-2.5 bg-[#3b2d7d] hover:bg-[#5942bc] text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 disabled:opacity-60"
                >
                  {editSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>

            </form>
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

                  {/* Profile Photo Upload */}
                  <div className="flex items-center gap-4 bg-purple-50/40 p-3 rounded-2xl border border-purple-100">
                    <div className="relative shrink-0">
                      <img
                        src={addForm.avatarUrl ? toAbsoluteUrl(addForm.avatarUrl) : `https://ui-avatars.com/api/?name=${encodeURIComponent(addForm.name || 'New Student')}&background=3b2d7d&color=fff`}
                        alt="Student Avatar"
                        className="w-14 h-14 rounded-full object-cover border-2 border-purple-200 shadow-sm"
                      />
                      {addUploadingPhoto && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                          <Loader2 size={16} className="text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1">Student Profile Picture</label>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-purple-50 text-[#3b2d7d] border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
                          <Camera size={13} />
                          <span>{addUploadingPhoto ? 'Uploading…' : 'Upload Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], false)}
                            disabled={addUploadingPhoto}
                            className="hidden"
                          />
                        </label>
                        {addForm.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => handleAddFormChange('avatarUrl', '')}
                            className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold block mt-1">
                        Optional (JPG, PNG or WEBP up to 5MB)
                      </span>
                    </div>
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

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-[2.2rem] shadow-2xl border border-gray-150 p-6 space-y-4 animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 leading-tight">Delete Student</h3>
                <span className="text-[11px] text-gray-400 font-bold block mt-0.5">This action will soft-delete the student record.</span>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-600 bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
              Are you sure you want to delete <span className="font-black text-gray-900">{studentToDelete.name}</span> ({studentToDelete.class}, Roll No. {studentToDelete.rollNo})?
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                disabled={deleteSubmitting}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-black rounded-2xl text-xs uppercase tracking-wider hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={deleteSubmitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {deleteSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete Student
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolStudentsPage;
