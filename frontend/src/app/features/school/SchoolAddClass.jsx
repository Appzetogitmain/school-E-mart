import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, HelpCircle, Calendar, Search, 
  Save, CheckCircle2, AlertCircle, ChevronDown, GraduationCap
} from 'lucide-react';

const SchoolAddClass = () => {
  const navigate = useNavigate();

  // Form states
  const [className, setClassName] = useState('');
  const [academicYear, setAcademicYear] = useState('2025 - 2026');
  const [section, setSection] = useState('');
  const [classTeacher, setClassTeacher] = useState('');

  // UI status
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState({});

  // List of recorded classes (initialized with mock classes)
  const [classesList, setClassesList] = useState([
    { id: 1, className: 'Class 2', academicYear: '2025 - 2026', section: 'A', classTeacher: 'Mrs. Neha Sharma' },
    { id: 2, className: 'Grade 5', academicYear: '2025 - 2026', section: 'B', classTeacher: 'Mr. Rajesh Verma' },
    { id: 3, className: 'Class 10', academicYear: '2025 - 2026', section: 'C', classTeacher: 'Mrs. Priya Iyer' }
  ]);

  // Mock list of teachers for dropdown
  const teachers = [
    'Mrs. Neha Sharma',
    'Mr. Rajesh Verma',
    'Mrs. Priya Iyer',
    'Mr. Amit Patel',
    'Mrs. Shalini Sen'
  ];

  const validate = () => {
    const tempErrors = {};
    if (!className.trim()) tempErrors.className = 'Class Name is required';
    if (!academicYear) tempErrors.academicYear = 'Academic Year is required';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const newClass = {
      id: Date.now(),
      className: className.trim(),
      academicYear,
      section: section.trim() ? section.trim().toUpperCase() : '-',
      classTeacher: classTeacher || 'Not Assigned'
    };

    // Add new class to list
    setClassesList(prev => [newClass, ...prev]);

    // Reset form fields
    setClassName('');
    setSection('');
    setClassTeacher('');

    // Show success toast
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 font-outfit relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-in fade-in slide-in-from-top duration-300">
          <div className="bg-deep-purple text-white px-5 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black leading-tight">Class Saved Successfully!</p>
              <p className="text-[10px] text-white/60 font-medium">Recorded in the list below</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 z-40 border-b border-gray-100/50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-deep-purple leading-none">Add Class</h1>
            <p className="text-gray-400 text-[10px] font-bold tracking-wide mt-1">Create a new class for your school</p>
          </div>
        </div>
        
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Section 1: Class Information */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-5 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-primary flex items-center justify-center shrink-0">
                <GraduationCap size={16} />
              </div>
              <h2 className="text-sm font-black text-deep-purple uppercase tracking-wider">Class Information</h2>
            </div>

            {/* Class Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Class Name <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value.slice(0, 50))}
                  placeholder="e.g. Class 2, Grade 5, Class 10"
                  className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-2xl text-xs font-bold text-deep-purple outline-none transition-all ${
                    errors.className ? 'border-red-300 focus:border-red-400 bg-red-50/20' : 'border-transparent focus:border-primary/10 focus:bg-white focus:shadow-xl focus:shadow-primary/5'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 font-bold">
                  {className.length}/50
                </span>
              </div>
              {errors.className && (
                <p className="text-[9px] font-bold text-red-500 flex items-center gap-1 ml-1 mt-0.5">
                  <AlertCircle size={10} /> {errors.className}
                </p>
              )}
            </div>



            {/* Row: Academic Year & Section */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Academic Year */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full pl-10 pr-8 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-xs font-bold text-deep-purple outline-none focus:border-primary/10 focus:bg-white focus:shadow-xl focus:shadow-primary/5 transition-all appearance-none cursor-pointer"
                  >
                    <option value="2025 - 2026">2025 - 2026</option>
                    <option value="2026 - 2027">2026 - 2027</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Section */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Section (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value.slice(0, 5))}
                    placeholder="e.g. A, B, C"
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-xs font-bold text-deep-purple outline-none focus:border-primary/10 focus:bg-white focus:shadow-xl focus:shadow-primary/5 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 font-bold">
                    {section.length}/5
                  </span>
                </div>
                <span className="text-[9px] text-gray-400 font-bold ml-1 block">Leave empty if not applicable</span>
              </div>
            </div>

            {/* Class Teacher */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Class Teacher (Optional)
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={classTeacher}
                  onChange={(e) => setClassTeacher(e.target.value)}
                  className="w-full pl-10 pr-8 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-xs font-bold text-deep-purple outline-none focus:border-primary/10 focus:bg-white focus:shadow-xl focus:shadow-primary/5 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Search teacher name</option>
                  {teachers.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <span className="text-[9px] text-gray-400 font-bold ml-1 block">You can assign or change later</span>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-[#5B3FD6] hover:bg-[#4a32b3] text-white rounded-2xl text-xs font-black shadow-lg shadow-[#5B3FD6]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Save size={16} />
              Save Class
            </button>
          </div>
        </form>

        {/* Recorded Classes Grid/Table Card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-deep-purple uppercase tracking-wider">Recorded Classes</h3>
            <span className="bg-[#F4EBFF] px-2.5 py-1 text-primary text-[10px] font-black rounded-full">
              {classesList.length} classes
            </span>
          </div>

          <div className="overflow-x-auto -mx-5 px-5">
            <div className="overflow-hidden border border-gray-100 rounded-2xl min-w-[480px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Class Name</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Year</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Section</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">Teacher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classesList.map((cls) => (
                    <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 text-xs font-black text-deep-purple">{cls.className}</td>
                      <td className="px-4 py-3.5 text-xs font-medium text-gray-400">{cls.academicYear}</td>
                      <td className="px-4 py-3.5 text-xs font-black text-deep-purple uppercase">{cls.section}</td>
                      <td className="px-4 py-3.5 text-xs font-bold text-primary">{cls.classTeacher}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolAddClass;
