import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, ChevronDown, Check, X, 
  MoreVertical, RefreshCw, GraduationCap, Users, User,
  Calendar, CheckCircle, AlertCircle, Sparkles, Upload, 
  Download, Award, Shield, MapPin, Phone, Mail
} from 'lucide-react';

const SchoolStudentsPage = () => {
  const navigate = useNavigate();

  // Tab Selection for active categories
  const [activeStatTab, setActiveStatTab] = useState('All');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [sortBy, setSortBy] = useState('Name (A - Z)');
  
  // Modals state
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Mock Students data matching the structure in mockup
  const [students, setStudents] = useState([
    {
      id: 'ADM-2026-0045',
      name: 'Aarav Sharma',
      class: 'Class 5-A',
      rollNo: '23',
      gender: 'Boy',
      parent: 'Rajesh Sharma',
      parentPhone: '98XXXXXX98',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      parentEmail: 'rajesh.sharma@gmail.com',
      dob: '12 Oct 2015',
      bloodGroup: 'O+',
      attendance: '96%',
      fees: 'Paid'
    },
    {
      id: 'ADM-2026-0046',
      name: 'Ananya Verma',
      class: 'Class 5-A',
      rollNo: '24',
      gender: 'Girl',
      parent: 'Suresh Verma',
      parentPhone: '98XXXXXX97',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      parentEmail: 'suresh.verma@gmail.com',
      dob: '05 Jan 2016',
      bloodGroup: 'A+',
      attendance: '98%',
      fees: 'Paid'
    },
    {
      id: 'ADM-2026-0047',
      name: 'Vihaan Patel',
      class: 'Class 5-B',
      rollNo: '01',
      gender: 'Boy',
      parent: 'Nilesh Patel',
      parentPhone: '98XXXXXX96',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      parentEmail: 'nilesh.patel@gmail.com',
      dob: '19 Aug 2015',
      bloodGroup: 'B+',
      attendance: '92%',
      fees: 'Pending'
    },
    {
      id: 'ADM-2026-0048',
      name: 'Diya Singh',
      class: 'Class 5-B',
      rollNo: '02',
      gender: 'Girl',
      parent: 'Amit Singh',
      parentPhone: '98XXXXXX95',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      parentEmail: 'amit.singh@gmail.com',
      dob: '14 Feb 2016',
      bloodGroup: 'AB+',
      attendance: '95%',
      fees: 'Paid'
    },
    {
      id: 'ADM-2026-0049',
      name: 'Krish Gupta',
      class: 'Class 5-C',
      rollNo: '05',
      gender: 'Boy',
      parent: 'Rohit Gupta',
      parentPhone: '98XXXXXX94',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      parentEmail: 'rohit.gupta@gmail.com',
      dob: '22 Dec 2015',
      bloodGroup: 'O-',
      attendance: '94%',
      fees: 'Paid'
    },
    {
      id: 'ADM-2026-0050',
      name: 'Meera Joshi',
      class: 'Class 5-C',
      rollNo: '06',
      gender: 'Girl',
      parent: 'Alok Joshi',
      parentPhone: '98XXXXXX93',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      parentEmail: 'alok.joshi@gmail.com',
      dob: '09 Mar 2016',
      bloodGroup: 'A-',
      attendance: '97%',
      fees: 'Pending'
    },
    {
      id: 'ADM-2026-0099',
      name: 'Ishaan Reddy',
      class: 'Class 5-A',
      rollNo: '15',
      gender: 'Boy',
      parent: 'Karan Reddy',
      parentPhone: '98XXXXXX90',
      status: 'Pending Admissions',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      parentEmail: 'karan.reddy@gmail.com',
      dob: '30 Jul 2016',
      bloodGroup: 'B-',
      attendance: '0%',
      fees: 'Pending'
    },
    {
      id: 'ADM-2026-0080',
      name: 'Rohan Deshmukh',
      class: 'Class 5-B',
      rollNo: '29',
      gender: 'Boy',
      parent: 'Vijay Deshmukh',
      parentPhone: '98XXXXXX80',
      status: 'Inactive',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      parentEmail: 'vijay.desh@gmail.com',
      dob: '18 Nov 2015',
      bloodGroup: 'O+',
      attendance: '85%',
      fees: 'Paid'
    }
  ]);

  // Statistics summaries based on actual state
  const boysCount = students.filter(s => s.gender === 'Boy' && s.status === 'Active').length + 647; // baseline of 650
  const girlsCount = students.filter(s => s.gender === 'Girl' && s.status === 'Active').length + 597; // baseline of 600
  const pendingCount = students.filter(s => s.status === 'Pending Admissions').length + 11; // baseline of 12
  const inactiveCount = students.filter(s => s.status === 'Inactive').length + 11; // baseline of 12
  const totalCount = boysCount + girlsCount + pendingCount + inactiveCount - 22; // calibrated for exactly 1,250

  // Filter students based on all states combined
  const filteredStudents = students.filter(s => {
    // 1. Search Query
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.rollNo.includes(searchQuery) ||
                          s.parentPhone.includes(searchQuery);
    
    // 2. Class Filter
    const matchesClass = selectedClass === 'All Classes' || s.class.startsWith(selectedClass);
    
    // 3. Section Filter
    const matchesSection = selectedSection === 'All Sections' || s.class.endsWith(selectedSection);
    
    // 4. Status Filter
    const matchesStatus = selectedStatus === 'All Statuses' || s.status === selectedStatus;

    // 5. Stat Tab Filter (if selectable)
    let matchesStatTab = true;
    if (activeStatTab === 'Boys') {
      matchesStatTab = s.gender === 'Boy' && s.status === 'Active';
    } else if (activeStatTab === 'Girls') {
      matchesStatTab = s.gender === 'Girl' && s.status === 'Active';
    } else if (activeStatTab === 'Pending Admissions') {
      matchesStatTab = s.status === 'Pending Admissions';
    } else if (activeStatTab === 'Inactive') {
      matchesStatTab = s.status === 'Inactive';
    }

    return matchesSearch && matchesClass && matchesSection && matchesStatus && matchesStatTab;
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

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedClass('All Classes');
    setSelectedSection('All Sections');
    setSelectedStatus('Active');
    setActiveStatTab('All');
  };

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
      </div>

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
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
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
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
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
        
        {sortedStudents.map((student) => (
          <div 
            key={student.id}
            onClick={() => setSelectedStudent(student)}
            className="bg-white border border-gray-200/80 rounded-[2rem] p-5 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden cursor-pointer hover:border-purple-200 hover:shadow-md transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-4 min-w-0">
              {/* Student avatar */}
              <img 
                src={student.avatar} 
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



            {/* Three dot context settings */}
            <button 
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-50 text-gray-400 active:scale-90 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                alert(`Settings menu for student ${student.name}`);
              }}
            >
              <MoreVertical size={16} />
            </button>

          </div>
        ))}

        {sortedStudents.length === 0 && (
          <div className="text-center py-16 bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm">
            <GraduationCap size={44} className="text-gray-300 mx-auto block stroke-[1.5]" />
            <span className="text-xs font-black text-gray-400 block mt-3">No matching students found in this search filter</span>
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
                <span className="text-[10px] text-purple-200 font-bold block mt-0.5">Academic Year 2026 - 2027</span>
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
                  src={selectedStudent.avatar} 
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
                    <div>🩸 Blood Group: <span className="text-gray-600 font-bold">{selectedStudent.bloodGroup}</span></div>
                    <div>⚧️ Gender: <span className="text-gray-600 font-bold">{selectedStudent.gender}</span></div>
                    <div>🛡️ Status: <span className="text-gray-600 font-bold">{selectedStudent.status}</span></div>
                  </div>
                </div>

                {/* Parent / Guardian Particulars */}
                <div className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-150 shadow-inner space-y-2">
                  <h4 className="text-[9px] text-gray-400 font-black uppercase tracking-wider block font-bold mb-1">Parent/Guardian Information</h4>
                  <div className="space-y-1 font-bold text-deep-purple">
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-gray-400 shrink-0" />
                      <span>Primary Contact: <span className="text-gray-600 font-bold">{selectedStudent.parent}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-gray-400 shrink-0" />
                      <span>Phone: <span className="text-gray-600 font-bold">{selectedStudent.parentPhone}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-gray-400 shrink-0" />
                      <span>Email: <span className="text-gray-600 font-bold truncate">{selectedStudent.parentEmail}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-gray-400 shrink-0" />
                      <span>Address: <span className="text-gray-600 font-bold">Green Avenue Sector-4, Block B-42</span></span>
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

    </div>
  );
};

export default SchoolStudentsPage;
