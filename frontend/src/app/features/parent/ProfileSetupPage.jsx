import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, User, Building2, 
  GraduationCap, Phone, ArrowRight,
  Sparkles, ChevronDown 
} from 'lucide-react';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const firstInputRef = useRef(null);

  const [formData, setFormData] = useState({
    phone: '',
    studentName: '',
    schoolId: '',
    schoolRefNo: '',
    grade: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-focus on first input (Mobile)
    firstInputRef.current?.focus();
  }, []);

  const schools = [
    { id: 'dps-indore', name: 'Delhi Public School' },
    { id: 'st-xavier', name: "St. Xavier's High School" },
    { id: 'greenwood', name: 'Greenwood International' },
    { id: 'the-shishukunj', name: 'The Shishukunj International' }
  ];

  const grades = [
    'Nursery', 'KG 1', 'KG 2', 'Class 1', 'Class 2', 
    'Class 3', 'Class 4', 'Class 5', 'Class 6', 
    'Class 7', 'Class 8', 'Class 9', 'Class 10'
  ];

  const handleInputChange = (field, value) => {
    let finalValue = value;
    if (field === 'phone') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.phone || formData.phone.length !== 10) newErrors.phone = "Valid 10-digit mobile is required";
    if (!formData.studentName.trim()) newErrors.studentName = "Student name is required";
    if (!formData.schoolId) newErrors.schoolId = "Please select a school";
    if (!formData.grade) newErrors.grade = "Please select a grade";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = formData.phone.length === 10 && formData.studentName && formData.schoolId && formData.grade;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setLoading(true);
    
    const userData = {
      phone: formData.phone,
      children: [
        {
          name: formData.studentName,
          schoolId: formData.schoolId,
          school: schools.find(s => s.id === formData.schoolId)?.name,
          grade: formData.grade
        }
      ]
    };

    // Simulate registration
    setTimeout(() => {
      localStorage.setItem('childInfo', JSON.stringify({
        ...userData.children[0],
        phone: formData.phone
      }));
      setLoading(false);
      navigate('/user/home');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit relative">
      {/* Header */}
      <div className="px-6 py-5 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-deep-purple active:scale-90 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full">
          <Sparkles size={12} className="text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Parent Signup</span>
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-40">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-deep-purple tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-gray-400 text-sm font-medium leading-relaxed">
            Join School E-Mart for personalized school essentials
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Mobile Number</label>
            <div className={`relative group transition-all duration-300 ${errors.phone ? 'scale-[0.98]' : ''}`}>
              <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.phone ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'}`} size={18} />
              <input
                ref={firstInputRef}
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter 10 digit number"
                className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-[14px] text-sm font-bold text-deep-purple outline-none transition-all ${errors.phone ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-primary/10 focus:bg-white focus:shadow-xl focus:shadow-primary/5'}`}
              />
            </div>
            {errors.phone && <p className="text-[9px] font-bold text-red-500 ml-1">{errors.phone}</p>}
          </div>

          {/* Student Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Student Name</label>
            <div className={`relative group transition-all duration-300 ${errors.studentName ? 'scale-[0.98]' : ''}`}>
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.studentName ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'}`} size={18} />
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
                placeholder="Child's full name"
                className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-[14px] text-sm font-bold text-deep-purple outline-none transition-all ${errors.studentName ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-primary/10 focus:bg-white focus:shadow-xl focus:shadow-primary/5'}`}
              />
            </div>
            {errors.studentName && <p className="text-[9px] font-bold text-red-500 ml-1">{errors.studentName}</p>}
          </div>

          {/* Select School */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Select School</label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
              <select
                value={formData.schoolId}
                onChange={(e) => handleInputChange('schoolId', e.target.value)}
                className="w-full pl-12 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-[14px] text-sm font-bold text-deep-purple outline-none focus:border-primary/10 focus:bg-white focus:shadow-xl focus:shadow-primary/5 transition-all appearance-none"
              >
                <option value="" disabled>Select your school</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* School Ref No (Optional) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">
              School Ref No <span className="text-[8px] opacity-60 lowercase font-medium">(Optional)</span>
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors font-bold text-sm">#</div>
              <input
                type="text"
                value={formData.schoolRefNo || ''}
                onChange={(e) => handleInputChange('schoolRefNo', e.target.value)}
                placeholder="Enter reference number"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-[14px] text-sm font-bold text-deep-purple outline-none focus:border-primary/10 focus:bg-white focus:shadow-xl focus:shadow-primary/5 transition-all"
              />
            </div>
          </div>

          {/* Grade / Class */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Select Grade / Class</label>
            <div className="relative group">
              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
              <select
                value={formData.grade}
                onChange={(e) => handleInputChange('grade', e.target.value)}
                className="w-full pl-12 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-[14px] text-sm font-bold text-deep-purple outline-none focus:border-primary/10 focus:bg-white focus:shadow-xl focus:shadow-primary/5 transition-all appearance-none"
              >
                <option value="" disabled>Select class</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Already have an account? Login */}
          <div className="text-center pt-4">
            <p className="text-gray-400 text-sm font-medium">
              Already have an account? 
              <button 
                type="button"
                onClick={() => navigate('/user/login')}
                className="ml-2 text-primary font-black hover:underline"
              >
                Login
              </button>
            </p>
          </div>
        </form>
      </div>

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          className={`
            w-full py-5 bg-primary text-white rounded-[18px] text-base font-black shadow-2xl shadow-primary/30
            active:scale-95 transition-all flex items-center justify-center gap-3 tracking-widest uppercase
            ${(!isFormValid || loading) ? 'opacity-40 grayscale cursor-not-allowed shadow-none' : 'hover:bg-deep-purple'}
          `}
        >
          {loading ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Sign Up
              <ArrowRight size={20} strokeWidth={3} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
