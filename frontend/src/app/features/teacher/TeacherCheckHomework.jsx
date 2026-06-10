import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, GraduationCap, Users, 
  CheckCircle, Clock, Search, FileText, Check, 
  Eye, Award, MessageSquare, X, ChevronDown, BookOpen,
  CheckCircle2, AlertCircle, FileCheck
} from 'lucide-react';

const TeacherCheckHomework = () => {
  const navigate = useNavigate();

  // 1. Dropdown options & selection states
  const classes = ['Class 5', 'Class 6', 'Class 7'];
  const sections = ['Section A', 'Section B', 'Section C'];
  const [selectedClass, setSelectedClass] = useState('Class 5');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);

  // Homework list for the selected class
  const initialHomeworks = [
    { id: 101, title: 'Fractions Worksheet', subject: 'Mathematics', dateAssigned: '12 May 2025', dueDate: '16 May 2025', type: 'Written' },
    { id: 102, title: 'Algebra Basics', subject: 'Mathematics', dateAssigned: '08 May 2025', dueDate: '12 May 2025', type: 'Written' },
    { id: 103, title: 'Photosynthesis Diagram', subject: 'Science', dateAssigned: '14 May 2025', dueDate: '18 May 2025', type: 'Drawing/Written' },
    { id: 104, title: 'Nouns & Pronouns Quiz', subject: 'English', dateAssigned: '15 May 2025', dueDate: '20 May 2025', type: 'Online Quiz' }
  ];

  const [homeworks, setHomeworks] = useState(initialHomeworks);
  const [selectedHomework, setSelectedHomework] = useState(initialHomeworks[0]);
  const [isHomeworkDropdownOpen, setIsHomeworkDropdownOpen] = useState(false);

  // 2. Student Submissions state
  // We populate mock submissions that map to our initial student roster
  const initialSubmissions = {
    101: [
      { 
        roll: 1, 
        name: 'Aarav Sharma', 
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&h=100&fit=crop', 
        status: 'Submitted',
        submittedAt: '14 May 2025, 04:30 PM',
        files: [
          { name: 'Aarav_Fractions_Page1.png', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400&fit=crop' },
          { name: 'Aarav_Fractions_Page2.png', url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=400&fit=crop' }
        ],
        grade: '',
        remarks: ''
      },
      { 
        roll: 2, 
        name: 'Ananya Verma', 
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&h=100&fit=crop', 
        status: 'Not Submitted',
        submittedAt: null,
        files: [],
        grade: '',
        remarks: ''
      },
      { 
        roll: 3, 
        name: 'Rohan Singh', 
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&h=100&fit=crop', 
        status: 'Submitted',
        submittedAt: '15 May 2025, 09:15 AM',
        files: [
          { name: 'Rohan_Math_Homework.jpg', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=400&fit=crop' }
        ],
        grade: '',
        remarks: ''
      },
      { 
        roll: 4, 
        name: 'Diya Patel', 
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&fit=crop', 
        status: 'Checked',
        submittedAt: '13 May 2025, 11:20 AM',
        files: [
          { name: 'Diya_Homework_Fractions.pdf', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80' }
        ],
        grade: 'A',
        remarks: 'Outstanding work, perfectly solved.'
      },
      { 
        roll: 5, 
        name: 'Vivaan Gupta', 
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&h=100&fit=crop', 
        status: 'Submitted',
        submittedAt: '15 May 2025, 06:45 PM',
        files: [
          { name: 'Vivaan_Fractions.png', url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=400&fit=crop' }
        ],
        grade: '',
        remarks: ''
      },
      { 
        roll: 6, 
        name: 'Meera Joshi', 
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&h=100&fit=crop', 
        status: 'Not Submitted',
        submittedAt: null,
        files: [],
        grade: '',
        remarks: ''
      },
      { 
        roll: 7, 
        name: 'Kabir Malhotra', 
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&h=100&fit=crop', 
        status: 'Submitted',
        submittedAt: '15 May 2025, 08:00 PM',
        files: [
          { name: 'Kabir_Fractions.png', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=400&fit=crop' }
        ],
        grade: '',
        remarks: ''
      },
      { 
        roll: 8, 
        name: 'Isha Reddy', 
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&h=100&fit=crop', 
        status: 'Checked',
        submittedAt: '14 May 2025, 01:10 PM',
        files: [
          { name: 'Isha_Maths.jpg', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400&fit=crop' }
        ],
        grade: 'B+',
        remarks: 'Good job, but rewrite question 4 step 3.'
      },
      { 
        roll: 9, 
        name: 'Devansh Roy', 
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&h=100&fit=crop', 
        status: 'Submitted',
        submittedAt: '15 May 2025, 10:45 AM',
        files: [
          { name: 'Devansh_Fractions_Solution.jpg', url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=400&fit=crop' }
        ],
        grade: '',
        remarks: ''
      },
      { 
        roll: 10, 
        name: 'Sia Singhal', 
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=100&h=100&fit=crop', 
        status: 'Not Submitted',
        submittedAt: null,
        files: [],
        grade: '',
        remarks: ''
      }
    ],
    102: [
      { roll: 1, name: 'Aarav Sharma', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&h=100&fit=crop', status: 'Checked', submittedAt: '11 May 2025', files: [{ name: 'Aarav_Algebra.png', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=400&fit=crop' }], grade: 'A', remarks: 'Nicely done.' },
      { roll: 2, name: 'Ananya Verma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&h=100&fit=crop', status: 'Not Submitted', submittedAt: null, files: [], grade: '', remarks: '' },
      { roll: 3, name: 'Rohan Singh', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&h=100&fit=crop', status: 'Checked', submittedAt: '10 May 2025', files: [{ name: 'Rohan_Algebra.jpg', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400&fit=crop' }], grade: 'B', remarks: 'Review algebra formulas.' }
    ]
  };

  const [submissions, setSubmissions] = useState(() => {
    const saved = localStorage.getItem('teacherSubmissions');
    return saved ? JSON.parse(saved) : initialSubmissions;
  });

  useEffect(() => {
    localStorage.setItem('teacherSubmissions', JSON.stringify(submissions));
  }, [submissions]);

  // Selected student for checking
  const [activeStudent, setActiveStudent] = useState(null);
  const [feedbackGrade, setFeedbackGrade] = useState('A');
  const [feedbackRemarks, setFeedbackRemarks] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Submitted', 'Not Submitted', 'Checked'
  
  // Full image preview state
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Get active homework submissions list
  const activeSubmissionsList = submissions[selectedHomework.id] || [];

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

  const handleSaveReview = () => {
    if (!activeStudent) return;
    
    // Update submissions state
    const updatedList = activeSubmissionsList.map(s => {
      if (s.roll === activeStudent.roll) {
        return {
          ...s,
          status: 'Checked',
          grade: feedbackGrade,
          remarks: feedbackRemarks
        };
      }
      return s;
    });

    setSubmissions(prev => ({
      ...prev,
      [selectedHomework.id]: updatedList
    }));

    // Trigger toast and close drawer panel
    setShowToast(true);
    setActiveStudent(null);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
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

      {/* 3. Homework Assignment Dropdown */}
      <div className="px-6 mt-4 relative z-20 shrink-0">
        <label className="text-[10px] font-bold text-gray-400 block mb-1">Select Assigned Homework</label>
        <button 
          onClick={() => { setIsHomeworkDropdownOpen(!isHomeworkDropdownOpen); setIsClassDropdownOpen(false); setIsSectionDropdownOpen(false); }}
          className="w-full px-4 py-4 bg-white border border-gray-200 hover:border-primary/20 active:bg-gray-50 rounded-2xl text-left flex items-center justify-between shadow-sm transition-all"
        >
          <div className="flex items-center gap-3 text-deep-purple font-black text-xs">
            <BookOpen size={18} className="text-primary" />
            <div className="flex flex-col">
              <span>{selectedHomework.title}</span>
              <span className="text-[9px] font-bold text-gray-400 mt-0.5">{selectedHomework.subject} • {selectedHomework.type}</span>
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
                  className={`w-full px-4 py-3 text-left text-xs font-bold border-b border-gray-50 transition-all ${selectedHomework.id === hw.id ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                >
                  <div className="font-black">{hw.title}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5 font-bold">{hw.subject} • Assigned: {hw.dateAssigned}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Homework Metadata details */}
      <div className="mx-6 mt-3 px-4 py-3 bg-[#F6F4FD] rounded-2xl border border-[#E9E4FC] flex items-center justify-between text-[10px] text-deep-purple/80 font-bold shrink-0">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-primary" />
          <span>Assigned: {selectedHomework.dateAssigned}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-amber-500" />
          <span>Due: {selectedHomework.dueDate}</span>
        </div>
      </div>

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
