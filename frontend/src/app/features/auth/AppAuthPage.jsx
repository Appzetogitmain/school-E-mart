import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, School, Phone, Mail, Lock,
  ArrowRight, ChevronLeft, ChevronDown, CheckCircle2,
  Building2, GraduationCap, Sparkles
} from 'lucide-react';

const AppAuthPage = () => {
  const navigate = useNavigate();

  // Splash States
  const [showSplash, setShowSplash] = useState(true);
  const [splashStage, setSplashStage] = useState('initial'); // initial, transitioning, completed

  // Auth Flow States
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (showSplash) {
      const timer1 = setTimeout(() => {
        setSplashStage('transitioning');
        const timer2 = setTimeout(() => {
          setSplashStage('completed');
          setShowSplash(false);
          sessionStorage.setItem('splashSeen', 'true');
        }, 1350); // Sync with 1200ms CSS duration
        return () => clearTimeout(timer2);
      }, 3000);
      return () => clearTimeout(timer1);
    }
  }, [showSplash]);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
    setError('');
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
      if (step === 2) setRole(null);
    } else navigate(-1);
  };

  const handleNext = (data) => {
    setError('');
    setStep(step + 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <RoleSelection onSelect={handleRoleSelect} />;
      case 2: return <ContactInput role={role} isLogin={isLogin} onNext={handleNext} onError={setError} error={error} />;
      case 3: return <Verification role={role} isLogin={isLogin} onNext={handleNext} onError={setError} error={error} />;
      case 4: return <FinalRegistration role={role} onComplete={() => navigate('/user/home')} onError={setError} error={error} />;
      default: return <RoleSelection onSelect={handleRoleSelect} />;
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden relative">
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-150%) skewX(-20deg); }
            100% { transform: translateX(150%) skewX(-20deg); }
          }
          @keyframes bounce-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          .animate-bounce-gentle {
            animation: bounce-gentle 3s ease-in-out infinite;
          }
          .animate-bounce-gentle-small {
            animation: bounce-gentle 3s ease-in-out infinite;
          }
        `}
      </style>

      {/* Premium Splash Overlay */}
      {showSplash && (
        <div className={`fixed inset-0 z-[100] bg-primary flex items-center justify-center transition-all duration-[1200ms] ease-in-out ${splashStage === 'transitioning' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className={`relative transition-all duration-[1200ms] ease-in-out transform ${splashStage === 'transitioning' ? 'scale-[0.25] -translate-y-[40vh] opacity-0' : 'scale-100 translate-y-0 opacity-100'}`}>
            <div className="w-32 h-32 bg-white p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-bounce-gentle">
              <img src="/assets/logo.jpeg" alt="Logo" className="w-full h-full object-contain relative z-10" />
              <div className="absolute inset-0 z-20 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  animation: 'shimmer 2s infinite ease-out'
                }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Header Visual */}
      <div className="h-44 bg-primary relative overflow-hidden flex items-center justify-center shrink-0">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-accent-orange/10 rounded-full blur-2xl"></div>

        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <img src="/assets/app/app_login.webp" alt="Background Illustration" className="w-full h-full object-cover mix-blend-overlay" />
        </div>

        <button
          onClick={() => navigate('/user/home')}
          className="absolute top-6 right-6 z-30 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white text-[10px] font-semibold uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all active:scale-95"
        >
          Skip
        </button>

        <div className={`relative z-10 flex flex-col items-center gap-3 transition-all duration-[1200ms] ${!showSplash || splashStage === 'transitioning' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="w-12 h-12 bg-white p-2 rounded-2xl shadow-xl animate-bounce-gentle-small">
            <img src="/assets/logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-white font-semibold text-base tracking-tight">School E-Mart</h1>
        </div>
      </div>

      <div className={`flex-1 bg-white -mt-6 rounded-t-[2.5rem] relative z-20 px-6 pt-4 flex flex-col overflow-y-auto transition-all duration-[1000ms] delay-[300ms] ${!showSplash || splashStage === 'transitioning' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col pt-2 pb-32">
          {(step > 1 || role) && (
            <div className="flex items-center gap-4 mb-2 h-8 shrink-0">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors z-30 shrink-0"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              {step > 1 && role && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full text-[10px] font-semibold text-primary uppercase tracking-widest animate-in fade-in zoom-in duration-300">
                  <Sparkles size={12} /> {role} {isLogin ? 'Login' : 'Signup'}
                </div>
              )}
            </div>
          )}

          <div className="flex-1">
            {renderStep()}
          </div>

          {/* Footer Toggle */}
          {step < 4 && (
            <div className="mt-auto py-2 text-center shrink-0">
              <p className="text-gray-400 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="ml-2 font-semibold text-primary hover:underline transition-all"
                >
                  Sign Up
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sub-components for Steps ---

const RoleSelection = ({ onSelect }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 className="text-2xl font-semibold text-deep-purple mb-8 leading-tight">Choose how you want to continue</h2>

    <div className="space-y-4">
      <button
        onClick={() => onSelect('parent')}
        className="w-full group flex items-center gap-5 p-5 rounded-[2rem] border-2 border-gray-50 bg-gray-50/50 hover:border-primary/20 hover:bg-white hover:shadow-2xl hover:shadow-primary/5 transition-all active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-both"
      >
        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
          <User size={28} />
        </div>
        <div className="text-left flex-1">
          <h3 className="font-semibold text-deep-purple text-base group-hover:text-primary transition-colors">Continue as Parent</h3>
          <p className="text-xs text-gray-400 font-medium">Buy school essentials for your child</p>
        </div>
        <ArrowRight className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" size={18} />
      </button>

      <button
        onClick={() => onSelect('school')}
        className="w-full group flex items-center gap-5 p-5 rounded-[2rem] border-2 border-gray-50 bg-gray-50/50 hover:border-primary/20 hover:bg-white hover:shadow-2xl hover:shadow-primary/5 transition-all active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[850ms] fill-mode-both"
      >
        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-accent-gold group-hover:scale-110 group-hover:bg-accent-gold group-hover:text-deep-purple transition-all duration-300">
          <School size={28} />
        </div>
        <div className="text-left flex-1">
          <h3 className="font-semibold text-deep-purple text-base group-hover:text-primary transition-colors">Continue as School</h3>
          <p className="text-xs text-gray-400 font-medium">Manage school purchases and vendors</p>
        </div>
        <ArrowRight className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" size={18} />
      </button>
    </div>
  </div>
);

const ContactInput = ({ role, isLogin, onNext, onError, error }) => {
  const [value, setValue] = useState('');

  const handleInputChange = (e) => {
    let val = e.target.value;
    if (role === 'parent') {
      // Only allow digits and max 10 chars
      val = val.replace(/\D/g, '').slice(0, 10);
    }
    setValue(val);
    if (error) onError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role === 'parent') {
      if (value.length !== 10) {
        return onError('Please enter a valid 10-digit mobile number');
      }
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return onError('Please enter a valid email address');
      }
    }
    onNext({ value });
  };

  const isValid = role === 'parent' ? value.length === 10 : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <h2 className="text-2xl font-semibold text-deep-purple mb-8">
        {role === 'parent' ? "What's your number?" : "Enter school email"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-4">
          <label className="block text-[13px] font-semibold text-black ml-1">
            {role === 'parent' ? 'Mobile number' : 'Email address'}
          </label>
          <div className="relative group">
            {role === 'parent' ? (
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            ) : (
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            )}
            <input
              type={role === 'parent' ? 'tel' : 'email'}
              value={value}
              onChange={handleInputChange}
              placeholder={role === 'parent' ? 'e.g. 9876543210' : 'admin@school.com'}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-base focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none"
            />
          </div>
          {error && <p className="text-red-500 text-[11px] font-medium ml-1 mt-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className={`w-full py-4 font-medium rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${isValid
            ? 'bg-primary text-white shadow-xl shadow-primary/20 active:scale-95'
            : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'
            }`}
        >
          {role === 'parent' ? 'Send OTP' : 'Continue'} <ArrowRight size={20} className={isValid ? 'translate-x-0' : 'opacity-30'} />
        </button>
      </form>
    </div>
  );
};

const Verification = ({ role, isLogin, onNext, onError, error }) => {
  const [value, setValue] = useState('');

  const handleInputChange = (e) => {
    let val = e.target.value;
    if (role === 'parent') {
      val = val.replace(/\D/g, '').slice(0, 4);
      if (val.length === 4) {
        // Auto-proceed when 4 digits are reached
        setTimeout(() => onNext({ value: val }), 300);
      }
    }
    setValue(val);
    if (error) onError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role === 'parent') {
      if (value.length !== 4) return onError('Please enter the 4-digit OTP');
    } else {
      if (value.length < 8) return onError('Password must be at least 8 characters');
    }
    onNext({ value });
  };

  const isValid = role === 'parent' ? value.length === 4 : value.length >= 8;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <h2 className="text-2xl font-semibold text-deep-purple mb-2">Verify it's you</h2>
      <p className="text-gray-400 text-sm mb-10">
        {role === 'parent' ? "Enter the 4-digit code sent to your phone" : "Enter your account password"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <label className="block text-[13px] font-semibold text-black ml-1">
            {role === 'parent' ? 'OTP code' : 'Password'}
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            <input
              type={role === 'parent' ? 'tel' : 'password'}
              value={value}
              onChange={handleInputChange}
              maxLength={role === 'parent' ? 4 : undefined}
              placeholder={role === 'parent' ? '••••' : '••••••••'}
              className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-base focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none ${role === 'parent' ? 'tracking-[1em] font-mono' : ''}`}
            />
          </div>
          {error && <p className="text-red-500 text-[11px] font-medium ml-1 mt-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className={`w-full py-4 font-medium rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${isValid
            ? 'bg-primary text-white shadow-xl shadow-primary/20 active:scale-95'
            : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'
            }`}
        >
          Verify & Continue <ArrowRight size={20} className={isValid ? 'translate-x-0' : 'opacity-30'} />
        </button>
      </form>
    </div>
  );
};

const FinalRegistration = ({ role, onComplete, onError, error }) => {
  const [formData, setFormData] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role === 'parent') {
      if (!formData.studentName || !formData.schoolName || !formData.grade) {
        return onError('Please fill in all required details');
      }
      localStorage.setItem('childInfo', JSON.stringify({
        name: formData.studentName,
        school: formData.schoolName,
        grade: formData.grade
      }));
    } else {
      if (!formData.schoolName || !formData.contactName || !formData.contactNumber) {
        return onError('Please fill in all required school details');
      }
      localStorage.setItem('schoolInfo', JSON.stringify(formData));
    }
    onComplete();
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) onError('');
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
      <h2 className="text-2xl font-semibold text-deep-purple mb-1">Almost there!</h2>
      <p className="text-gray-400 text-xs mb-6">Let's set up your profile</p>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        {role === 'parent' ? (
          <>
            <InputField label="Student name" icon={<User size={18} />} placeholder="Child's full name" onChange={(v) => updateField('studentName', v)} />

            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-black ml-1">Select school</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <select
                  onChange={(e) => updateField('schoolName', e.target.value)}
                  className="w-full pl-11 pr-10 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 outline-none appearance-none font-medium leading-relaxed"
                >
                  <option value="">Select your school</option>
                  <option>Delhi Public School</option>
                  <option>St. Xavier's High School</option>
                  <option>Greenwood International</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-black ml-1">Grade / Class</label>
              <div className="relative group">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <select 
                  onChange={(e) => updateField('grade', e.target.value)}
                  className="w-full pl-11 pr-10 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 outline-none appearance-none font-medium leading-relaxed"
                >
                  <option value="">Select Class</option>
                  <option>Nursery</option>
                  <option>Class 1</option>
                  <option>Class 2</option>
                  <option>Class 3</option>
                  <option>Class 4</option>
                  <option>Class 5</option>
                  <option>Class 6</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>
          </>
        ) : (
          <>
            <InputField label="School name" icon={<Building2 size={18} />} placeholder="Official school name" onChange={(v) => updateField('schoolName', v)} />
            <InputField label="Contact person" icon={<User size={18} />} placeholder="Authorized admin name" onChange={(v) => updateField('contactName', v)} />
            <InputField label="Contact number" icon={<Phone size={18} />} placeholder="+91 XXXXX XXXXX" onChange={(v) => updateField('contactNumber', v)} />
          </>
        )}

        {error && <p className="text-red-500 text-[11px] font-medium ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}

        <button
          type="submit"
          className="w-full py-4 bg-primary text-white font-medium rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:bg-deep-purple transition-all active:scale-95 mt-4 shrink-0"
        >
          Complete Setup <CheckCircle2 size={20} />
        </button>
      </form>
    </div>
  );
};

const InputField = ({ label, icon, placeholder, onChange, type = "text" }) => (
  <div className="space-y-2">
    <label className="block text-[13px] font-semibold text-black ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
        {icon}
      </div>
      <input
        type={type}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none font-medium"
      />
    </div>
  </div>
);

export default AppAuthPage;
