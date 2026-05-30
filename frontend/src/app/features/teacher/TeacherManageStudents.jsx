import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, User, Phone, Search, X, 
  Plus, Edit, Download, Save, Calendar, BookOpen,
  Check, MoreVertical, Trash2
} from 'lucide-react';

const TeacherManageStudents = () => {
  const navigate = useNavigate();

  // 1. Initial Seed Data
  const initialStudents = [
    { id: 1, rollNo: '01', name: 'Aarav Sharma', parentName: 'Rajesh Sharma', motherName: 'Suman Sharma', phone: '9876543210', gender: 'Male', dob: '2015-04-12', admissionNo: 'ADM-2023-089' },
    { id: 2, rollNo: '02', name: 'Ananya Verma', parentName: 'Suresh Verma', motherName: 'Reena Verma', phone: '9765432109', gender: 'Female', dob: '2015-09-22', admissionNo: 'ADM-2023-112' },
    { id: 3, rollNo: '03', name: 'Rohan Singh', parentName: 'Amit Singh', motherName: 'Kiran Singh', phone: '9988776655', gender: 'Male', dob: '2015-01-05', admissionNo: 'ADM-2023-014' },
    { id: 4, rollNo: '04', name: 'Diya Patel', parentName: 'Harish Patel', motherName: 'Meena Patel', phone: '9822334455', gender: 'Female', dob: '2015-11-18', admissionNo: 'ADM-2023-205' },
    { id: 5, rollNo: '05', name: 'Kabir Mehta', parentName: 'Vikram Mehta', motherName: 'Alpa Mehta', phone: '9511223344', gender: 'Male', dob: '2015-06-30', admissionNo: 'ADM-2023-076' },
  ];

  // 2. States
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('teacherStudentsList');
    return saved ? JSON.parse(saved) : initialStudents;
  });
  
  const [selectedClass, setSelectedClass] = useState('Class 5');
  const [selectedSection, setSelectedSection] = useState('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rollNo'); // 'rollNo' or 'name'

  // Dropdowns UI states
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Drawer / Modal Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  const handleOpenAddDrawer = () => {
    setIsEditing(false);
    setCurrentStudentId(null);
    setFormName('');
    setFormRollNo(String(students.length + 1).padStart(2, '0'));
    setFormGender('Male');
    setFormDob('');
    setFormFatherName('');
    setFormMotherName('');
    setFormPhone('');
    setFormAltPhone('');
    setFormAdmissionNo('');
    setFormClass(selectedClass);
    setFormSection(selectedSection);
    setIsDrawerOpen(true);
  };


  const handleOpenEditDrawer = (student) => {
    setIsEditing(true);
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

  const handleDeleteStudent = (id) => {
    const updated = students.filter(s => s.id !== id);
    setStudents(updated);
    localStorage.setItem('teacherStudentsList', JSON.stringify(updated));
    triggerToast('Student Removed Successfully!');
    setActiveActionsMenu(null);
  };

  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formRollNo.trim() || !formPhone.trim()) {
      triggerToast('Please fill all required fields (*)');
      return;
    }

    let updatedStudentsList;
    if (isEditing) {
      updatedStudentsList = students.map(s => {
        if (s.id === currentStudentId) {
          return {
            ...s,
            name: formName.trim(),
            rollNo: formRollNo.trim(),
            gender: formGender,
            dob: formDob,
            parentName: formFatherName.trim(),
            motherName: formMotherName.trim(),
            phone: formPhone.trim(),
            altPhone: formAltPhone.trim(),
            admissionNo: formAdmissionNo.trim()
          };
        }
        return s;
      });
      triggerToast('Student Details Updated!');
    } else {
      const newStudent = {
        id: Date.now(),
        rollNo: formRollNo.trim().padStart(2, '0'),
        name: formName.trim(),
        gender: formGender,
        dob: formDob,
        parentName: formFatherName.trim(),
        motherName: formMotherName.trim(),
        phone: formPhone.trim(),
        altPhone: formAltPhone.trim(),
        admissionNo: formAdmissionNo.trim()
      };
      updatedStudentsList = [...students, newStudent];
      triggerToast('New Student Registered!');
    }

    setStudents(updatedStudentsList);
    localStorage.setItem('teacherStudentsList', JSON.stringify(updatedStudentsList));
    setIsDrawerOpen(false);
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

      <div className="space-y-4 px-6 mt-4 relative z-20">
        
        {/* 2. Dropdown selectors row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Class Dropdown */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => { setIsClassOpen(!isClassOpen); setIsSectionOpen(false); }}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 hover:border-primary/20 active:bg-gray-50 rounded-2xl text-left flex items-center justify-between shadow-sm transition-all"
            >
              <span className="text-xs font-black text-deep-purple">{selectedClass}</span>
              <span className="text-gray-400 text-xs">▼</span>
            </button>
            {isClassOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsClassOpen(false)} />
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {['Class 5', 'Class 6', 'Class 7'].map(cls => (
                    <button 
                      key={cls}
                      type="button"
                      onClick={() => { setSelectedClass(cls); setIsClassOpen(false); }}
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
              type="button"
              onClick={() => { setIsSectionOpen(!isSectionOpen); setIsClassOpen(false); }}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 hover:border-primary/20 active:bg-gray-50 rounded-2xl text-left flex items-center justify-between shadow-sm transition-all"
            >
              <span className="text-xs font-black text-deep-purple">Section {selectedSection}</span>
              <span className="text-gray-400 text-xs">▼</span>
            </button>
            {isSectionOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSectionOpen(false)} />
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {['A', 'B', 'C'].map(sec => (
                    <button 
                      key={sec}
                      type="button"
                      onClick={() => { setSelectedSection(sec); setIsSectionOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all ${selectedSection === sec ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                    >
                      Section {sec}
                    </button>
                  ))}
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

          {/* Actions grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Import Excel */}
            <button 
              type="button"
              onClick={() => triggerToast('Excel Template Exported!')}
              className="py-3 bg-white border border-primary/20 hover:border-primary hover:bg-primary/5 text-primary active:scale-95 transition-all rounded-2xl flex items-center justify-center gap-1 text-[10px] font-black shadow-sm"
            >
              <Download size={13} strokeWidth={2.5} />
              <span>Import Excel</span>
            </button>

            {/* Bulk Add Student */}
            <button 
              type="button"
              onClick={() => navigate('/school/teacher/students/bulk')}
              className="py-3 bg-[#FAF9FF] border border-[#ECE9FC] text-primary hover:bg-purple-100/50 active:scale-95 transition-all rounded-2xl flex items-center justify-center gap-1 text-[10px] font-black shadow-sm"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Bulk Add</span>
            </button>

            {/* Add Student button */}
            <button 
              type="button"
              onClick={handleOpenAddDrawer}
              className="py-3 bg-primary text-white hover:bg-deep-purple active:scale-95 transition-all rounded-2xl flex items-center justify-center gap-1 text-[10px] font-black shadow-sm"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Add Student</span>
            </button>
          </div>
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

                  {/* Actions buttons right */}
                  <div className="flex items-center gap-1.5 relative shrink-0">
                    <button 
                      onClick={() => handleOpenEditDrawer(student)}
                      className="px-2.5 py-1.5 hover:bg-primary/5 active:scale-95 transition-all text-primary rounded-xl flex items-center gap-1"
                    >
                      <Edit size={12} strokeWidth={2.5} />
                      <span className="text-[9px] font-black">Edit</span>
                    </button>

                    <button 
                      onClick={() => setActiveActionsMenu(activeActionsMenu === student.id ? null : student.id)}
                      className="w-8 h-8 rounded-full hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center text-gray-400"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {/* Actions Dropdown */}
                    {activeActionsMenu === student.id && (
                      <>
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setActiveActionsMenu(null)} />
                        <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 py-1 w-24 animate-in fade-in slide-in-from-top-1 duration-200">
                          <button 
                            type="button"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="w-full px-3 py-1.5 text-left text-[9px] font-black text-red-500 hover:bg-red-50 flex items-center gap-1.5 transition-all"
                          >
                            <Trash2 size={11} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
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

      {/* Floating Add Button */}
      <button 
        onClick={handleOpenAddDrawer}
        className="fixed bottom-24 right-6 w-12 h-12 bg-primary text-white hover:bg-deep-purple active:scale-95 transition-all rounded-full flex items-center justify-center shadow-xl shadow-purple-100 z-30"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

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
                <h3 className="text-sm font-black text-deep-purple leading-none">{isEditing ? 'Edit Student Details' : 'Add New Student'}</h3>
                <p className="text-[9px] text-gray-400 font-bold mt-1">Register student details to the class list</p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center text-gray-450"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-24">
              
              {/* Section 1: Student Information */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <User size={12} strokeWidth={2.5} /> Student Information
                </span>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3 py-2">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Student Name *</label>
                    <input 
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full text-[11px] font-black text-deep-purple focus:outline-none bg-transparent leading-snug"
                      placeholder="Enter student name"
                    />
                  </div>

                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3 py-2">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Roll Number *</label>
                    <input 
                      type="text"
                      value={formRollNo}
                      onChange={(e) => setFormRollNo(e.target.value)}
                      required
                      className="w-full text-[11px] font-black text-deep-purple focus:outline-none bg-transparent leading-snug"
                      placeholder="Enter roll number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3 py-2 relative">
                    <label className="text-[8px] font-bold text-gray-400 block mb-1 leading-none">Gender</label>
                    <select 
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value)}
                      className="w-full text-[11px] font-black text-deep-purple focus:outline-none bg-transparent appearance-none leading-none pr-6 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <span className="absolute bottom-2 right-3 text-[8px] text-gray-400">▼</span>
                  </div>

                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3 py-2 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Date of Birth</label>
                      <input 
                        type="date"
                        value={formDob}
                        onChange={(e) => setFormDob(e.target.value)}
                        className="w-full text-[10px] font-black text-deep-purple focus:outline-none bg-transparent leading-none"
                      />
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
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3 py-2">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Father Name</label>
                    <input 
                      type="text"
                      value={formFatherName}
                      onChange={(e) => setFormFatherName(e.target.value)}
                      className="w-full text-[11px] font-black text-deep-purple focus:outline-none bg-transparent leading-snug"
                      placeholder="Enter father name"
                    />
                  </div>

                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3 py-2">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Mother Name</label>
                    <input 
                      type="text"
                      value={formMotherName}
                      onChange={(e) => setFormMotherName(e.target.value)}
                      className="w-full text-[11px] font-black text-deep-purple focus:outline-none bg-transparent leading-snug"
                      placeholder="Enter mother name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3 py-2">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Parent Phone Number *</label>
                    <input 
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      required
                      className="w-full text-[11px] font-black text-deep-purple focus:outline-none bg-transparent leading-snug"
                      placeholder="Enter 10 digit number"
                    />
                  </div>

                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3 py-2">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Alternate Phone (Optional)</label>
                    <input 
                      type="text"
                      value={formAltPhone}
                      onChange={(e) => setFormAltPhone(e.target.value)}
                      className="w-full text-[11px] font-black text-deep-purple focus:outline-none bg-transparent leading-snug"
                      placeholder="Enter 10 digit number"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Academic Information */}
              <div className="space-y-3 pt-1">
                <span className="text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen size={12} strokeWidth={2.5} /> Academic Information
                </span>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3 py-2 col-span-1">
                    <label className="text-[8px] font-bold text-gray-400 block mb-0.5 leading-none">Admission No.</label>
                    <input 
                      type="text"
                      value={formAdmissionNo}
                      onChange={(e) => setFormAdmissionNo(e.target.value)}
                      className="w-full text-[11px] font-black text-deep-purple focus:outline-none bg-transparent leading-snug"
                      placeholder="Optional number"
                    />
                  </div>

                  <div className="bg-gray-100 border border-gray-150 rounded-2xl px-3 py-2 relative col-span-1 opacity-70">
                    <label className="text-[8px] font-bold text-gray-400 block mb-1.5 leading-none">Class</label>
                    <span className="text-[11px] font-black text-deep-purple block leading-none">{formClass}</span>
                  </div>

                  <div className="bg-gray-100 border border-gray-150 rounded-2xl px-3 py-2 relative col-span-1 opacity-70">
                    <label className="text-[8px] font-bold text-gray-400 block mb-1.5 leading-none">Section</label>
                    <span className="text-[11px] font-black text-deep-purple block leading-none">Section {formSection}</span>
                  </div>
                </div>
              </div>

            </form>

            {/* Bottom Drawer Actions Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50 shrink-0">
              <button 
                type="submit"
                onClick={handleSaveStudent}
                className="w-full py-4 bg-primary text-white hover:bg-deep-purple active:scale-98 transition-all rounded-[1.8rem] text-sm font-black shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
              >
                <Save size={16} strokeWidth={2.5} />
                <span>Save Student</span>
              </button>
            </div>

          </div>
        </>
      )}


    </div>
  );
};

export default TeacherManageStudents;
