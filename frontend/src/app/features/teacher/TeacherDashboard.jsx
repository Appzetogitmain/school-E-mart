import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, GraduationCap, Users, Clock, ArrowRight, 
  Calendar, BookOpen, FileText, CheckSquare, Plus,
  ChevronDown, UserCheck, MessageSquare, PlusCircle, FileCheck
} from 'lucide-react';

import useAuthStore from '../../../store/useAuthStore';
import apiClient from '../../../services/apiClient';

const TeacherDashboard = () => {
  const navigate = useNavigate();

  // Retrieve logged-in teacher info or fallback to Priya Ma'am
  const [teacherName, setTeacherName] = useState("Priya Ma'am");
  const [teacherAvatar, setTeacherAvatar] = useState("https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&h=120&fit=crop");

  useEffect(() => {
    const saved = localStorage.getItem('childInfo');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.role === 'teacher') {
        // Trim standard full name to greeting style
        const firstName = parsed.name.split(' ')[0];
        setTeacherName(`${firstName} Ma'am`);
      }
    }
    const profileSaved = localStorage.getItem('teacherProfileDetails');
    if (profileSaved) {
      const parsedProfile = JSON.parse(profileSaved);
      if (parsedProfile.fullName) {
        const firstName = parsedProfile.fullName.split(' ')[0];
        setTeacherName(`${firstName} Ma'am`);
      }
      if (parsedProfile.avatar) {
        setTeacherAvatar(parsedProfile.avatar);
      }
    }
  }, []);

  // Selected Class & Section states
  const [selectedClass, setSelectedClass] = useState('Class 5');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);

  // Dynamic attendance metrics from backend
  const [studentsCount, setStudentsCount] = useState(0);
  const [attendanceStatus, setAttendanceStatus] = useState('Pending');
  const [attendanceCountLabel, setAttendanceCountLabel] = useState('0%');

  useEffect(() => {
    const fetchStats = async () => {
      const user = useAuthStore.getState().user;
      const schoolId = user?.tenantSchoolId;
      if (!schoolId) return;

      try {
        const today = new Date().toISOString().slice(0, 10);
        const response = await apiClient.get(`/schools/${schoolId}/attendance/daily`, {
          params: {
            date: today,
            classGrade: selectedClass,
            section: selectedSection
          }
        });

        const attendanceData = response.data.data.attendance || [];
        const total = attendanceData.length;
        setStudentsCount(total);

        const marked = attendanceData.filter(a => a.attendance !== null);
        const markedCount = marked.length;

        if (markedCount > 0) {
          setAttendanceStatus('Completed');
          const presents = marked.filter(a => a.attendance?.status === 'present');
          const percent = total > 0 ? Math.round((presents.length / total) * 100) : 0;
          setAttendanceCountLabel(`${percent}%`);
        } else {
          setAttendanceStatus('Pending');
          setAttendanceCountLabel('0%');
        }
      } catch (err) {
        console.error('Failed to fetch attendance stats:', err);
      }
    };

    fetchStats();
  }, [selectedClass, selectedSection]);

  // Quick interactive alerts/modals
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New homework submission', time: '10 mins ago', read: false },
    { id: 2, title: 'Principal shared a circular', time: '1 hour ago', read: false },
    { id: 3, title: 'Meeting scheduled with Admin', time: '3 hours ago', read: true }
  ]);

  // Mock database representing different classes
  const classData = {
    'Class 5-Section A': {
      studentsCount: 38,
      attendance: 'Pending',
      attendanceCount: 0,
      homeworkCount: 2,
      diaryCount: 1,
      studentsList: [
        { roll: 1, name: 'Aarav Sharma', avatar: 'AS', color: 'bg-emerald-500' },
        { roll: 2, name: 'Ananya Verma', avatar: 'AV', color: 'bg-purple-500' },
        { roll: 3, name: 'Rohan Singh', avatar: 'RS', color: 'bg-blue-500' },
        { roll: 4, name: 'Diya Patel', avatar: 'DP', color: 'bg-orange-500' },
        { roll: 5, name: 'Vivaan Gupta', avatar: 'VG', color: 'bg-pink-500' }
      ]
    },
    'Class 5-Section B': {
      studentsCount: 35,
      attendance: 'Completed',
      attendanceCount: '94%',
      homeworkCount: 1,
      diaryCount: 0,
      studentsList: [
        { roll: 1, name: 'Kabir Mehta', avatar: 'KM', color: 'bg-blue-500' },
        { roll: 2, name: 'Isha Joshi', avatar: 'IJ', color: 'bg-pink-500' },
        { roll: 3, name: 'Reyansh Shah', avatar: 'RS', color: 'bg-emerald-500' },
        { roll: 4, name: 'Myra Sen', avatar: 'MS', color: 'bg-purple-500' },
        { roll: 5, name: 'Arjun Rao', avatar: 'AR', color: 'bg-orange-500' }
      ]
    },
    'Class 6-Section A': {
      studentsCount: 42,
      attendance: 'Completed',
      attendanceCount: '98%',
      homeworkCount: 3,
      diaryCount: 2,
      studentsList: [
        { roll: 1, name: 'Aditya Birla', avatar: 'AB', color: 'bg-purple-500' },
        { roll: 2, name: 'Sneha Reddy', avatar: 'SR', color: 'bg-orange-500' },
        { roll: 3, name: 'Devendra Pal', avatar: 'DP', color: 'bg-emerald-500' },
        { roll: 4, name: 'Gauri Pillai', avatar: 'GP', color: 'bg-pink-500' },
        { roll: 5, name: 'Yash Vardhan', avatar: 'YV', color: 'bg-blue-500' }
      ]
    },
    'Class 6-Section B': {
      studentsCount: 40,
      attendance: 'Pending',
      attendanceCount: 0,
      homeworkCount: 0,
      diaryCount: 0,
      studentsList: [
        { roll: 1, name: 'Armaan Malik', avatar: 'AM', color: 'bg-orange-500' },
        { roll: 2, name: 'Tara Sutaria', avatar: 'TS', color: 'bg-pink-500' },
        { roll: 3, name: 'Varun Dhawan', avatar: 'VD', color: 'bg-blue-500' },
        { roll: 4, name: 'Alia Bhatt', avatar: 'AB', color: 'bg-purple-500' },
        { roll: 5, name: 'Sidharth M', avatar: 'SM', color: 'bg-emerald-500' }
      ]
    }
  };

  const currentKey = `${selectedClass}-${selectedSection}`;
  const activeData = classData[currentKey] || classData['Class 5-Section A'];

  const classes = ['Class 5', 'Class 6'];
  const sections = ['Section A', 'Section B'];

  const handleNotificationClick = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen relative select-none animate-in fade-in duration-500 pb-20">
      
      {/* 1. Header Section */}
      <div className="bg-gradient-to-b from-[#3B248C] to-[#5B3FD6] px-6 pt-8 pb-16 text-white relative overflow-hidden rounded-b-[2.5rem] shadow-xl shrink-0">
        {/* Soft Premium Warm Accent Glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFC933]/15 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between relative z-10">
          <div 
            onClick={() => navigate('/school/teacher/profile')}
            className="flex items-center gap-3.5 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center overflow-hidden backdrop-blur-lg shrink-0">
              <img 
                src={teacherAvatar} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <span className="text-white/70 text-[11px] font-bold block leading-none">Good Morning,</span>
              <h1 className="text-[19px] font-black text-white flex items-center gap-1.5 leading-tight mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                {teacherName} <span className="animate-bounce">👋</span>
              </h1>
              <span className="text-[10px] text-white/60 font-bold tracking-tight block mt-1">Let's make today a great day!</span>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => navigate('/school/teacher/notifications')}
              className="w-11 h-11 bg-white/10 hover:bg-white/15 active:scale-95 transition-all border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] rounded-2xl flex items-center justify-center text-white relative shrink-0"
            >
              <Bell size={19} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 border border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Select Class & Section Selector (Overlapping Card) */}
      <div className="mx-6 -mt-8 p-5 bg-white border border-gray-200 rounded-[2rem] shadow-xl shadow-gray-100/50 relative z-30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-deep-purple tracking-tight">Select Class & Section</h2>
          <button className="flex items-center gap-1 text-[11px] font-black text-primary hover:underline">
            <Clock size={12} /> Recent Classes
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Class Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setIsClassDropdownOpen(!isClassDropdownOpen); setIsSectionDropdownOpen(false); }}
              className="w-full px-4 py-3.5 bg-gray-50 border border-transparent hover:border-primary/20 active:bg-gray-100/50 rounded-2xl text-left flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <GraduationCap size={16} />
                <span>{selectedClass}</span>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isClassDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            {isClassDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsClassDropdownOpen(false)} />
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
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

          {/* Section Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setIsSectionDropdownOpen(!isSectionDropdownOpen); setIsClassDropdownOpen(false); }}
              className="w-full px-4 py-3.5 bg-gray-50 border border-transparent hover:border-primary/20 active:bg-gray-100/50 rounded-2xl text-left flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <Users size={16} />
                <span>{selectedSection}</span>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isSectionDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            {isSectionDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSectionDropdownOpen(false)} />
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
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

        <p className="text-[10px] text-gray-400 font-bold text-center mt-4">
          Select a class & section to view and manage details
        </p>
      </div>

      {/* 3. Quick Actions Row */}
      <div className="mt-8 px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-deep-purple tracking-tight">Quick Actions</h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <QuickActionButton 
            color="bg-emerald-50 text-emerald-500 hover:bg-emerald-100/50" 
            icon={<UserCheck size={20} />} 
            label="Mark Attendance" 
            onClick={() => navigate('/school/teacher/attendance')}
          />
          <QuickActionButton 
            color="bg-purple-50 text-purple-500 hover:bg-purple-100/50" 
            icon={<BookOpen size={20} />} 
            label="Add Homework" 
            onClick={() => navigate('/school/teacher/homework')}
          />
          <QuickActionButton 
            color="bg-rose-50 text-rose-500 hover:bg-rose-100/50" 
            icon={<FileCheck size={20} />} 
            label="Check Homework" 
            onClick={() => navigate('/school/teacher/homework/check')}
          />
          <QuickActionButton 
            color="bg-amber-50 text-amber-500 hover:bg-amber-100/50" 
            icon={<FileText size={20} />} 
            label="Add Diary Note" 
            onClick={() => navigate('/school/teacher/diary')}
          />
          <QuickActionButton 
            color="bg-blue-50 text-blue-500 hover:bg-blue-100/50" 
            icon={<Users size={20} />} 
            label="Manage Students" 
            onClick={() => navigate('/school/teacher/students')}
          />
        </div>
      </div>

      {/* 4. Today Overview (Select a class) */}
      <div className="mt-8 px-6">
        <h2 className="text-base font-black text-deep-purple tracking-tight mb-4">
          Today Overview <span className="text-gray-400 font-bold text-xs">(Select a class)</span>
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Card 1: Total Students */}
          <OverviewCard 
            color="bg-emerald-500 text-white" 
            icon={<Users size={20} />} 
            count={studentsCount || activeData.studentsCount} 
            label="Total Students" 
          />

          {/* Card 2: Attendance Status */}
          <OverviewCard 
            color="bg-amber-500 text-white" 
            icon={<CheckSquare size={20} />} 
            count={attendanceStatus === 'Completed' ? attendanceCountLabel : '0%'} 
            label="Attendance" 
            badge={attendanceStatus}
            badgeColor={attendanceStatus === 'Pending' ? 'bg-orange-600' : 'bg-emerald-600'}
          />

          {/* Card 3: Homework Added */}
          <OverviewCard 
            color="bg-purple-500 text-white" 
            icon={<BookOpen size={20} />} 
            count={activeData.homeworkCount} 
            label="Homework" 
            badge="Added"
            badgeColor="bg-purple-700"
          />

          {/* Card 4: Diary Entries */}
          <OverviewCard 
            color="bg-blue-500 text-white" 
            icon={<FileText size={20} />} 
            count={activeData.diaryCount} 
            label="Diary Entries" 
            badge="Today"
            badgeColor="bg-blue-700"
          />
        </div>
      </div>

      {/* Widgets Layout */}
      <div className="grid grid-cols-1 gap-8 mt-8 px-6">
        

        {/* 6. Recent Activity Widget */}
        <div className="bg-white border border-gray-200 p-6 rounded-[2.2rem] shadow-xl shadow-gray-100/40">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black text-deep-purple tracking-tight">Recent Activity</h2>
          </div>

          <div className="space-y-4">
            <ActivityItem 
              icon={<BookOpen size={16} />} 
              bgColor="bg-purple-50 text-purple-500" 
              title="Homework added" 
              desc="Maths - Chapter 2" 
              detail={`Class ${selectedClass.split(' ')[1]}-${selectedSection.split(' ')[1]}`}
              time="10:30 AM" 
            />
            <ActivityItem 
              icon={<FileText size={16} />} 
              bgColor="bg-emerald-50 text-emerald-500" 
              title="Diary note shared" 
              desc="Good behavior" 
              detail={`Class ${selectedClass.split(' ')[1]}-${selectedSection.split(' ')[1]}`}
              time="Yesterday" 
            />
            <ActivityItem 
              icon={<UserCheck size={16} />} 
              bgColor="bg-amber-50 text-amber-500" 
              title="Attendance completed" 
              desc={`Class ${selectedClass.split(' ')[1]}-${selectedSection.split(' ')[1]}`}
              time="Yesterday" 
            />
          </div>
        </div>

        {/* 7. Upcoming Events Widget */}
        <div className="bg-white border border-gray-200 p-6 rounded-[2.2rem] shadow-xl shadow-gray-100/40">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black text-deep-purple tracking-tight">Upcoming Events</h2>
          </div>

          <div className="space-y-4">
            <EventItem 
              icon={<Users size={16} />} 
              bgColor="bg-pink-50 text-pink-500"
              title="PTM Meeting" 
              time="20 May 2025 • 11:00 AM" 
            />
            <EventItem 
              icon={<Calendar size={16} />} 
              bgColor="bg-emerald-50 text-emerald-500"
              title="Science Exhibition" 
              time="28 May 2025 • 09:00 AM" 
            />
          </div>
        </div>


      </div>


    </div>
  );
};

// Supporting Components
const QuickActionButton = ({ color, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-2 shrink-0 group active:scale-95 transition-all w-20"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all group-hover:scale-105 ${color}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold text-center text-deep-purple leading-tight block w-full px-1">{label}</span>
  </button>
);

const OverviewCard = ({ color, icon, count, label, badge, badgeColor }) => (
  <div className="p-4 bg-white border border-gray-200 rounded-[2rem] shadow-lg shadow-gray-100/30 flex flex-col justify-between h-36">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-gray-100`}>
        {icon}
      </div>
      {badge && (
        <span className={`text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeColor}`}>
          {badge}
        </span>
      )}
    </div>

    <div>
      <span className="text-2xl font-black text-deep-purple block leading-tight">{count}</span>
      <span className="text-[10px] text-gray-400 font-bold block mt-1">{label}</span>
    </div>
  </div>
);

const ActivityItem = ({ icon, bgColor, title, desc, detail, time }) => (
  <div className="flex items-start gap-4">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${bgColor}`}>
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="text-xs font-black text-deep-purple leading-tight">{title}</h3>
      <p className="text-[10px] text-gray-400 font-bold mt-1">
        {desc} • <span className="text-primary">{detail}</span>
      </p>
    </div>
    <span className="text-[9px] text-gray-400 font-bold shrink-0">{time}</span>
  </div>
);

const EventItem = ({ icon, bgColor, title, time }) => (
  <div className="flex items-center gap-4">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${bgColor}`}>
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="text-xs font-black text-deep-purple leading-tight">{title}</h3>
      <span className="text-[9px] text-gray-400 font-bold block mt-1">{time}</span>
    </div>
  </div>
);


export default TeacherDashboard;
