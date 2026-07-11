import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, GraduationCap, Users, Clock, ArrowRight, 
  Calendar, BookOpen, FileText, CheckSquare, Plus,
  ChevronDown, UserCheck, MessageSquare, PlusCircle, FileCheck, Loader2
} from 'lucide-react';
import { getDailyAttendance, listStudents } from '../../../services/schoolApi';
import { listCourses, listAssignments } from '../../../services/lmsApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { parseClassGrade, parseSection } from '../../../utils/mappers/teacherMapper';
import { useAuthUser, useTeacherSchoolId } from '../../../utils/teacherContext';
import { useTeacherClassOptions } from '../../../hooks/useTeacherClassOptions';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const schoolId = useTeacherSchoolId();
  const authUser = useAuthUser();

  const [teacherName, setTeacherName] = useState("Teacher");
  const [teacherAvatar, setTeacherAvatar] = useState(
    "https://ui-avatars.com/api/?name=Teacher&background=3b2d7d&color=fff"
  );

  useEffect(() => {
    const name = authUser?.name || authUser?.fullName;
    if (name) {
      const firstName = name.split(' ')[0];
      setTeacherName(`${firstName}`);
    }
    if (authUser?.avatarUrl) {
      setTeacherAvatar(authUser.avatarUrl);
    }
  }, [authUser]);

  const { classLabels, getSectionLabels, loading: classesLoading, hasClasses } = useTeacherClassOptions(schoolId);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [notifications] = useState([]);

  const [dashboardData, setDashboardData] = useState({
    studentsCount: 0,
    attendance: 'Pending',
    attendanceCount: 0,
    homeworkCount: 0,
    diaryCount: 0,
    studentsList: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = useCallback(async () => {
    if (!schoolId || !selectedClass || !selectedSection) {
      setLoading(false);
      if (!schoolId) setError('School context is missing. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const classGrade = parseClassGrade(selectedClass);
      const section = parseSection(selectedSection);
      const attendanceDate = new Date().toISOString().slice(0, 10);

      const [{ data: students }, attendanceRows, { data: courses }] = await Promise.all([
        listStudents(schoolId, { classGrade, section, limit: 100 }),
        getDailyAttendance(schoolId, { date: attendanceDate, classGrade, section }),
        listCourses(schoolId, { limit: 50 }),
      ]);

      const matchingCourses = (courses || []).filter(
        (course) => course.gradeClass === classGrade || course.title?.includes(classGrade)
      );
      let homeworkCount = 0;
      for (const course of matchingCourses) {
        const courseId = course._id || course.id;
        const { data: assignments } = await listAssignments(schoolId, courseId, { limit: 50 });
        homeworkCount += (assignments || []).length;
      }

      const presentCount = (attendanceRows || []).filter(
        (row) => row.attendance?.status === 'present'
      ).length;
      const total = students?.length || 0;
      const attendanceMarked = (attendanceRows || []).some((row) => row.attendance);

      setDashboardData({
        studentsCount: total,
        attendance: attendanceMarked ? 'Completed' : 'Pending',
        attendanceCount: total > 0 ? `${Math.round((presentCount / total) * 100)}%` : 0,
        homeworkCount,
        diaryCount: 0,
        studentsList: (students || []).slice(0, 5).map((student, index) => ({
          roll: Number(student.rollNo) || index + 1,
          name: student.name,
          avatar: student.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
          color: ['bg-emerald-500', 'bg-purple-500', 'bg-blue-500', 'bg-orange-500', 'bg-pink-500'][index % 5],
        })),
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedClass, selectedSection]);

  useEffect(() => {
    if (classLabels.length > 0 && !selectedClass) {
      setSelectedClass(classLabels[0]);
      const sectionLabels = getSectionLabels(classLabels[0]);
      if (sectionLabels.length > 0) setSelectedSection(sectionLabels[0]);
    }
  }, [classLabels, getSectionLabels, selectedClass]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const activeData = dashboardData;
  const classes = classLabels;
  const sections = getSectionLabels(selectedClass);
  const attendanceStatus = activeData.attendance;
  const attendanceCountLabel = activeData.attendanceCount;

  const handleNotificationClick = () => {};

  const unreadCount = 0;

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

        {!classesLoading && !hasClasses ? (
          <div className="mt-4 px-4 py-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-center">
            <p className="text-[11px] font-black text-amber-700">No classes assigned to you yet</p>
            <p className="text-[10px] font-bold text-amber-600/80 mt-0.5">
              Your school office assigns classes and subjects to teachers. Please contact them to get access.
            </p>
          </div>
        ) : (
          <p className="text-[10px] text-gray-400 font-bold text-center mt-4">
            {classesLoading ? 'Loading classes…' : 'Select a class & section to view and manage details'}
          </p>
        )}
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
            count={activeData.studentsCount} 
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
