import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, GraduationCap, Users, 
  CheckCircle, Clock, Search, FileText, Check, 
  Eye, Award, MessageSquare, X, ChevronDown, BookOpen,
  CheckCircle2, AlertCircle, FileCheck, Loader2
} from 'lucide-react';
import { listStudents } from '../../../services/schoolApi';
import { listCourses, listAssignments, listSubmissions, evaluateSubmission } from '../../../services/lmsApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import {
  mapAssignmentForHomework,
  mapSubmissionForCheck,
  parseClassGrade,
  parseSection,
} from '../../../utils/mappers/teacherMapper';
import { gradeToScore } from '../../../utils/teacherApiHelpers';
import { useTeacherSchoolId } from '../../../utils/teacherContext';

const TeacherCheckHomework = () => {
  const navigate = useNavigate();
  const schoolId = useTeacherSchoolId();

  const classes = ['Class 5', 'Class 6', 'Class 7'];
  const sections = ['Section A', 'Section B', 'Section C'];
  const [selectedClass, setSelectedClass] = useState('Class 5');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);

  const [homeworks, setHomeworks] = useState([]);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [isHomeworkDropdownOpen, setIsHomeworkDropdownOpen] = useState(false);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [loadingHomeworks, setLoadingHomeworks] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [error, setError] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const loadHomeworks = useCallback(async () => {
    if (!schoolId) {
      setLoadingHomeworks(false);
      setError('School context is missing. Please log in again.');
      setHomeworks([]);
      setSelectedHomework(null);
      return;
    }

    setLoadingHomeworks(true);
    setError('');
    try {
      const grade = parseClassGrade(selectedClass);
      const { data: courses } = await listCourses(schoolId, { limit: 50 });
      const matchingCourses = (courses || []).filter(
        (course) => course.gradeClass === grade || course.title?.includes(grade)
      );

      const assignmentRows = [];
      for (const course of matchingCourses) {
        const courseId = course._id || course.id;
        const { data: assignments } = await listAssignments(schoolId, courseId, { limit: 50 });
        (assignments || []).forEach((assignment) => {
          assignmentRows.push(mapAssignmentForHomework(assignment, course));
        });
      }

      setHomeworks(assignmentRows);
      setSelectedHomework(assignmentRows[0] || null);
    } catch (err) {
      setHomeworks([]);
      setSelectedHomework(null);
      setError(getErrorMessage(err, 'Unable to load homework'));
    } finally {
      setLoadingHomeworks(false);
    }
  }, [schoolId, selectedClass]);

  useEffect(() => {
    loadHomeworks();
  }, [loadHomeworks]);

  const loadSubmissions = useCallback(async () => {
    if (!schoolId || !selectedHomework?.id || !selectedHomework?.courseId) {
      setSubmissionsList([]);
      return;
    }

    setLoadingSubmissions(true);
    try {
      const classGrade = parseClassGrade(selectedClass);
      const section = parseSection(selectedSection);
      const [{ data: apiSubmissions }, { data: students }] = await Promise.all([
        listSubmissions(schoolId, selectedHomework.courseId, selectedHomework.id, { limit: 100 }),
        listStudents(schoolId, { classGrade, section, limit: 100 }),
      ]);

      const studentMap = Object.fromEntries(
        (students || []).map((student) => [student._id?.toString?.(), student])
      );
      const submittedIds = new Set(
        (apiSubmissions || []).map((item) => item.studentId?.toString?.())
      );

      const mappedSubs = (apiSubmissions || []).map((item) =>
        mapSubmissionForCheck(item, studentMap)
      );
      const pending = (students || [])
        .filter((student) => !submittedIds.has(student._id?.toString?.()))
        .map((student) =>
          mapSubmissionForCheck({ student, status: 'pending' }, studentMap)
        );

      setSubmissionsList(
        [...mappedSubs, ...pending].sort((a, b) => (a.roll || 0) - (b.roll || 0))
      );
    } catch (err) {
      setSubmissionsList([]);
      setError(getErrorMessage(err, 'Unable to load submissions'));
    } finally {
      setLoadingSubmissions(false);
    }
  }, [schoolId, selectedHomework, selectedClass, selectedSection]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Selected student for checking
  const [activeStudent, setActiveStudent] = useState(null);
  const [feedbackGrade, setFeedbackGrade] = useState('A');
  const [feedbackRemarks, setFeedbackRemarks] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Submitted', 'Not Submitted', 'Checked'
  
  // Full image preview state
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const activeSubmissionsList = submissionsList;

  // Filter students based on search query & status filter
  const filteredSubmissions = activeSubmissionsList.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || sub.roll.toString() === searchQuery;
    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    return sub.status === statusFilter;
  });

  // Dynamic status counters
  const totalSubmissions = activeSubmissionsList.length;
  const submittedCount = activeSubmissionsList.filter(s => s.status === 'Submitted').length;
  const checkedCount = activeSubmissionsList.filter(s => s.status === 'Checked').length;
  const pendingCount = activeSubmissionsList.filter(s => s.status === 'Not Submitted').length;

  const handleOpenCheckPanel = (student) => {
    setActiveStudent(student);
    setFeedbackGrade(student.grade || 'A');
    setFeedbackRemarks(student.remarks || '');
  };

  const handleSaveReview = async () => {
    if (!activeStudent || !selectedHomework || !schoolId) return;
    if (!activeStudent.mongoId) {
      setError('This student has not submitted homework yet.');
      return;
    }

    setSavingReview(true);
    setError('');
    try {
      await evaluateSubmission(
        schoolId,
        selectedHomework.courseId,
        selectedHomework.id,
        activeStudent.mongoId,
        {
          score: gradeToScore(feedbackGrade),
          feedback: feedbackRemarks.trim() || undefined,
        }
      );

      setShowToast(true);
      setActiveStudent(null);
      await loadSubmissions();
      setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save review'));
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen select-none font-outfit animate-in fade-in duration-300 pb-20 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-6 duration-300">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <Check size={14} strokeWidth={3} />
          </div>
          <span className="text-xs font-black">Homework Checked & Graded Successfully!</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="px-6 pt-7 pb-4 bg-white flex items-center justify-between border-b border-gray-100 relative z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/school/teacher/dashboard')}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-full flex items-center justify-center text-deep-purple"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-lg font-black text-deep-purple leading-none">Check Homework</h1>
            <p className="text-[10px] text-gray-400 font-bold mt-1">Grade and review class homework submissions</p>
          </div>
        </div>
      </div>

      {/* 2. Select Class & Section Selectors */}
      <div className="px-6 mt-4 grid grid-cols-2 gap-4 relative z-30 shrink-0">
        {/* Class Dropdown */}
        <div className="relative">
          <button 
            onClick={() => { setIsClassDropdownOpen(!isClassDropdownOpen); setIsSectionDropdownOpen(false); setIsHomeworkDropdownOpen(false); }}
            className="w-full px-4 py-3.5 bg-white border border-gray-200 hover:border-primary/20 active:bg-gray-50 rounded-2xl text-left flex items-center justify-between shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 text-deep-purple font-bold text-xs">
              <GraduationCap size={16} className="text-primary" />
              <span>{selectedClass}</span>
            </div>
            <span className="text-gray-400 text-xs">▼</span>
          </button>

          {isClassDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsClassDropdownOpen(false)} />
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {classes.map(cls => (
                  <button 
                    key={cls}
                    onClick={() => { setSelectedClass(cls); setIsClassDropdownOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all ${selectedClass === cls ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Section Dropdown */}
        <div className="relative">
          <button 
            onClick={() => { setIsSectionDropdownOpen(!isSectionDropdownOpen); setIsClassDropdownOpen(false); setIsHomeworkDropdownOpen(false); }}
            className="w-full px-4 py-3.5 bg-white border border-gray-200 hover:border-primary/20 active:bg-gray-50 rounded-2xl text-left flex items-center justify-between shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 text-deep-purple font-bold text-xs">
              <Users size={16} className="text-primary" />
              <span>{selectedSection}</span>
            </div>
            <span className="text-gray-400 text-xs">▼</span>
          </button>

          {isSectionDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSectionDropdownOpen(false)} />
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {sections.map(sec => (
                  <button 
                    key={sec}
                    onClick={() => { setSelectedSection(sec); setIsSectionDropdownOpen(false); }}
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

      {/* 3. Homework Assignment Dropdown */}
      <div className="px-6 mt-4 relative z-20 shrink-0">
        <label className="text-[10px] font-bold text-gray-400 block mb-1">Select Assigned Homework</label>
        <button 
          onClick={() => { setIsHomeworkDropdownOpen(!isHomeworkDropdownOpen); setIsClassDropdownOpen(false); setIsSectionDropdownOpen(false); }}
          disabled={loadingHomeworks || homeworks.length === 0}
          className="w-full px-4 py-4 bg-white border border-gray-200 hover:border-primary/20 active:bg-gray-50 rounded-2xl text-left flex items-center justify-between shadow-sm transition-all disabled:opacity-60"
        >
          <div className="flex items-center gap-3 text-deep-purple font-black text-xs">
            {loadingHomeworks ? <Loader2 size={18} className="animate-spin text-primary" /> : <BookOpen size={18} className="text-primary" />}
            <div className="flex flex-col">
              <span>{selectedHomework?.title || (loadingHomeworks ? 'Loading homework...' : 'No homework found')}</span>
              {selectedHomework && (
                <span className="text-[9px] font-bold text-gray-400 mt-0.5">{selectedHomework.subject} • {selectedHomework.type}</span>
              )}
            </div>
          </div>
          <span className="text-gray-400 text-xs">▼</span>
        </button>

        {isHomeworkDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsHomeworkDropdownOpen(false)} />
            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
              {homeworks.map(hw => (
                <button 
                  key={hw.id}
                  onClick={() => { setSelectedHomework(hw); setIsHomeworkDropdownOpen(false); }}
                  className={`w-full px-4 py-3 text-left text-xs font-bold border-b border-gray-50 transition-all ${selectedHomework?.id === hw.id ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                >
                  <div className="font-black">{hw.title}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5 font-bold">{hw.subject} • Assigned: {hw.dateAssigned}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedHomework && (
      <div className="mx-6 mt-3 px-4 py-3 bg-[#F6F4FD] rounded-2xl border border-[#E9E4FC] flex items-center justify-between text-[10px] text-deep-purple/80 font-bold shrink-0">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-primary" />
          <span>Assigned: {selectedHomework.dateAssigned ? new Date(selectedHomework.dateAssigned).toLocaleDateString() : '—'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-amber-500" />
          <span>Due: {selectedHomework.dueDate ? new Date(selectedHomework.dueDate).toLocaleDateString() : '—'}</span>
        </div>
      </div>
      )}

      {/* 4. Stat Cards Grid for Submissions */}
      <div className="px-6 mt-4 grid grid-cols-4 gap-2 shrink-0">
        {/* Total Card */}
        <button 
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-200 outline-none border ${
            statusFilter === 'all' 
              ? 'border-[#6A47DE] ring-2 ring-[#6A47DE]/20 scale-105 font-black shadow-md shadow-purple-100' 
              : 'border-gray-200 opacity-80 hover:opacity-100 scale-95'
          }`}
        >
          <Users size={16} className="text-[#6A47DE]" />
          <span className="text-sm font-black text-deep-purple mt-1.5 leading-none">{totalSubmissions}</span>
          <span className="text-[8px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Students</span>
        </button>

        {/* Submitted Card */}
        <button 
          onClick={() => setStatusFilter('Submitted')}
          className={`bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-200 outline-none border ${
            statusFilter === 'Submitted' 
              ? 'border-amber-500 ring-2 ring-amber-500/20 scale-105 font-black shadow-md shadow-orange-55' 
              : 'border-gray-200 opacity-80 hover:opacity-100 scale-95'
          }`}
        >
          <Clock size={16} className="text-amber-500" />
          <span className="text-sm font-black text-deep-purple mt-1.5 leading-none">{submittedCount}</span>
          <span className="text-[8px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Pending check</span>
        </button>

        {/* Checked Card */}
        <button 
          onClick={() => setStatusFilter('Checked')}
          className={`bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-200 outline-none border ${
            statusFilter === 'Checked' 
              ? 'border-[#34A853] ring-2 ring-[#34A853]/20 scale-105 font-black shadow-md shadow-green-100' 
              : 'border-gray-200 opacity-80 hover:opacity-100 scale-95'
          }`}
        >
          <CheckCircle2 size={16} className="text-[#34A853]" />
          <span className="text-sm font-black text-deep-purple mt-1.5 leading-none">{checkedCount}</span>
          <span className="text-[8px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Checked</span>
        </button>

        {/* Not Submitted Card */}
        <button 
          onClick={() => setStatusFilter('Not Submitted')}
          className={`bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-200 outline-none border ${
            statusFilter === 'Not Submitted' 
              ? 'border-[#E04F5F] ring-2 ring-[#E04F5F]/20 scale-105 font-black shadow-md shadow-red-100' 
              : 'border-gray-200 opacity-80 hover:opacity-100 scale-95'
          }`}
        >
          <AlertCircle size={16} className="text-[#E04F5F]" />
          <span className="text-sm font-black text-deep-purple mt-1.5 leading-none">{pendingCount}</span>
          <span className="text-[8px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Not Submitted</span>
        </button>
      </div>

      {/* 5. Search Bar */}
      <div className="px-6 mt-4 shrink-0">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 hover:border-primary/20 focus:border-primary/30 focus:outline-none rounded-2xl text-xs font-bold text-deep-purple placeholder-gray-400 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* 6. Submissions Roster */}
      <div className="mx-6 mt-4 flex-1 overflow-y-auto">
        <div className="border-b border-gray-200/80 pb-3.5 px-2 flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-wider">
          <span>Student Name</span>
          <span>Status / Action</span>
        </div>

        <div className="divide-y divide-gray-200/40 pb-6">
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.map((stud) => {
              let statusPill = null;
              if (stud.status === 'Submitted') {
                statusPill = (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[9px] font-black uppercase">
                    Pending check
                  </span>
                );
              } else if (stud.status === 'Checked') {
                statusPill = (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-primary bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100 uppercase">
                      Grade: {stud.grade}
                    </span>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[9px] font-black uppercase">
                      Checked
                    </span>
                  </div>
                );
              } else {
                statusPill = (
                  <span className="px-2.5 py-1 bg-red-50 text-red-500 border border-red-150 rounded-xl text-[9px] font-black uppercase">
                    Unsubmitted
                  </span>
                );
              }

              return (
                <div 
                  key={stud.roll} 
                  onClick={() => stud.status !== 'Not Submitted' && handleOpenCheckPanel(stud)}
                  className={`py-3.5 px-2 flex items-center justify-between transition-colors ${stud.status !== 'Not Submitted' ? 'cursor-pointer hover:bg-gray-100/40 active:bg-gray-100/70' : 'opacity-65'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-black text-deep-purple">
                      {stud.avatar ? (
                        <img src={stud.avatar} alt={stud.name} className="w-full h-full object-cover" />
                      ) : (
                        stud.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-deep-purple leading-tight">{stud.name}</h4>
                      <p className="text-[9px] text-gray-400 font-bold mt-1">Roll No: {stud.roll} {stud.submittedAt && `• ${stud.submittedAt}`}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {statusPill}
                    {stud.status !== 'Not Submitted' && (
                      <button className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-deep-purple hover:bg-gray-100">
                        {stud.status === 'Checked' ? <FileCheck size={14} className="text-emerald-500" /> : <Eye size={14} className="text-primary" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-gray-400">No submissions found matching filters</span>
            </div>
          )}
        </div>
      </div>

      {/* 7. Detailed Review Panel (Side-sheet Drawer overlay) */}
      {activeStudent && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
          {/* Dismiss trigger */}
          <div className="absolute inset-0 z-10" onClick={() => setActiveStudent(null)} />

          <div className="relative z-20 w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                  <img src={activeStudent.avatar} alt={activeStudent.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-deep-purple leading-tight">Grade Homework</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{activeStudent.name} • Roll: {activeStudent.roll}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveStudent(null)}
                className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Submitted files preview section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Submitted Files</h4>
                <div className="grid grid-cols-2 gap-3.5">
                  {activeStudent.files && activeStudent.files.map((file, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setPreviewImageUrl(file.url)}
                      className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 hover:border-primary cursor-pointer transition-all shadow-sm flex flex-col group relative"
                    >
                      <div className="aspect-video w-full bg-gray-200 relative overflow-hidden flex-1">
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                        <span className="absolute inset-0 bg-black/10 group-hover:bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye size={20} className="text-white" />
                        </span>
                      </div>
                      <div className="p-2 bg-white flex items-center gap-2">
                        <FileText size={12} className="text-primary shrink-0" />
                        <span className="text-[9px] font-bold text-deep-purple truncate flex-1 leading-none">{file.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 font-bold block mt-1">Click image to expand / view full-size file.</p>
              </div>

              {/* Enter Grade/Score */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Award size={14} className="text-primary" />
                  <span>Grade / Evaluation *</span>
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {['A+', 'A', 'B+', 'B', 'C'].map(g => (
                    <button
                      key={g}
                      onClick={() => setFeedbackGrade(g)}
                      className={`py-3 rounded-2xl text-xs font-black border transition-all active:scale-95 ${
                        feedbackGrade === g 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-purple-100' 
                          : 'bg-white text-deep-purple border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback remarks input */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={14} className="text-primary" />
                  <span>Feedback Remarks</span>
                </h4>
                <textarea
                  placeholder="e.g. Excellent solution flow, clear and precise formulas shown."
                  value={feedbackRemarks}
                  onChange={(e) => setFeedbackRemarks(e.target.value.slice(0, 150))}
                  className="w-full p-4 bg-gray-50/50 border border-gray-200 focus:border-primary/20 focus:outline-none rounded-2xl text-xs font-bold text-deep-purple placeholder-gray-450 h-28 resize-none transition-all shadow-sm"
                />
                <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold mt-1 px-1">
                  <span>Keep comments constructive for students</span>
                  <span>{feedbackRemarks.length}/150</span>
                </div>
              </div>

            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-gray-100 flex gap-4 bg-white shrink-0">
              <button 
                onClick={() => setActiveStudent(null)}
                className="flex-1 py-4 border border-gray-200 hover:bg-gray-50 active:scale-98 transition-all rounded-3xl text-xs font-black text-deep-purple"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveReview}
                className="flex-1 py-4 bg-primary text-white hover:bg-deep-purple active:scale-98 transition-all rounded-3xl text-xs font-black shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
              >
                <Check size={14} strokeWidth={2.5} />
                <span>Save Review</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 8. Full Image Preview lightbox modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
          {/* Close lightbox on backing screen tap */}
          <div className="absolute inset-0" onClick={() => setPreviewImageUrl(null)} />
          
          <button 
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-6 right-6 w-11 h-11 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white rounded-full flex items-center justify-center border border-white/20 z-10"
          >
            <X size={20} />
          </button>
          
          <div className="relative max-w-[90vw] max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl z-10 animate-in zoom-in duration-300">
            <img src={previewImageUrl} alt="Full screen preview" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherCheckHomework;
