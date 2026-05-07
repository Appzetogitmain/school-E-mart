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
  const [splashStage, setSplashStage] = useState('initial'); 

  // Auth Flow States
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [contactValue, setContactValue] = useState('');
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
        }, 1350); 
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
    if (step === 2) {
      setContactValue(data.value);
    }
    if (step === 3) {
      // Step 3 is OTP Verification
      const mockUser = {
        name: role === 'parent' ? "Priya Damodaran" : "School Admin",
        phone: role === 'parent' ? contactValue : "",
        email: role === 'school' ? contactValue : "",
        school: role === 'parent' ? "St. Xavier's High School" : "School Management",
        grade: role === 'parent' ? "Class 2" : "",
        progress: { completed: 12, total: 18 }
      };
      localStorage.setItem('childInfo', JSON.stringify(mockUser));
      navigate('/user/home');
      return;
    }
    setStep(step + 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <RoleSelection onSelect={handleRoleSelect} />;
      case 2: return <ContactInput role={role} isLogin={isLogin} onNext={handleNext} onError={setError} error={error} />;
      case 3: return <Verification role={role} isLogin={isLogin} onNext={handleNext} onError={setError} error={error} />;
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
          .animate-bounce-gentle { animation: bounce-gentle 3s ease-in-out infinite; }
        `}
      </style>

      {showSplash && (
        <div className={`fixed inset-0 z-[100] bg-primary flex items-center justify-center transition-all duration-[1200ms] ease-in-out ${splashStage === 'transitioning' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className={`relative transition-all duration-[1200ms] ease-in-out transform ${splashStage === 'transitioning' ? 'scale-[0.25] -translate-y-[40vh] opacity-0' : 'scale-100 translate-y-0 opacity-100'}`}>
            <div className="w-32 h-32 bg-white p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-bounce-gentle">
              <img src="/assets/logo.jpeg" alt="Logo" className="w-full h-full object-contain relative z-10" />
              <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shimmer 2s infinite ease-out' }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="h-44 bg-primary relative overflow-hidden flex items-center justify-center shrink-0">
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <img src="/assets/app/app_login.webp" alt="Background" className="w-full h-full object-cover mix-blend-overlay" />
        </div>
        {step > 1 && (
          <button onClick={() => navigate('/user/home')} className="absolute top-6 right-6 z-30 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white text-[10px] font-semibold uppercase tracking-widest border border-white/20 active:scale-95">Skip</button>
        )}
        <div className={`relative z-10 flex flex-col items-center gap-3 transition-all duration-[1200ms] ${!showSplash || splashStage === 'transitioning' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="w-12 h-12 bg-white p-2 rounded-2xl shadow-xl"><img src="/assets/logo.jpeg" alt="Logo" className="w-full h-full object-contain" /></div>
          <h1 className="text-white font-semibold text-base">School E-Mart</h1>
        </div>
      </div>

      <div className={`flex-1 bg-white -mt-6 rounded-t-[2.5rem] relative z-20 px-6 pt-4 flex flex-col overflow-y-auto transition-all duration-[1000ms] ${!showSplash || splashStage === 'transitioning' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col pt-2 pb-32">
          {(step > 1 || role) && (
            <div className="flex items-center gap-4 mb-2 h-8 shrink-0">
              {step > 1 && <button onClick={handleBack} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors z-30 shrink-0"><ChevronLeft size={20} /></button>}
              {step > 1 && role && <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full text-[10px] font-semibold text-primary uppercase tracking-widest"><Sparkles size={12} /> {role} Login</div>}
            </div>
          )}
          <div className="flex-1">{renderStep()}</div>
          <div className="mt-auto py-2 text-center shrink-0">
            <p className="text-gray-400 text-sm font-medium">Don't have an account?<button onClick={() => navigate('/user/signup')} className="ml-2 font-black text-primary hover:underline">Sign Up</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoleSelection = ({ onSelect }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 className="text-2xl font-semibold text-deep-purple mb-8 leading-tight">Choose how you want to continue</h2>
    <div className="space-y-4">
      <button onClick={() => onSelect('parent')} className="w-full group flex items-center gap-5 p-5 rounded-[2rem] border-2 border-gray-50 bg-gray-50/50 hover:border-primary/20 hover:bg-white hover:shadow-2xl hover:shadow-primary/5 transition-all"><div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all"><User size={28} /></div><div className="text-left flex-1"><h3 className="font-semibold text-deep-purple text-base group-hover:text-primary transition-colors">Continue as Parent</h3><p className="text-xs text-gray-400 font-medium">Buy school essentials for your child</p></div><ArrowRight className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" size={18} /></button>
      <button onClick={() => onSelect('school')} className="w-full group flex items-center gap-5 p-5 rounded-[2rem] border-2 border-gray-50 bg-gray-50/50 hover:border-primary/20 hover:bg-white hover:shadow-2xl hover:shadow-primary/5 transition-all"><div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-accent-gold group-hover:scale-110 group-hover:bg-accent-gold group-hover:text-deep-purple transition-all"><School size={28} /></div><div className="text-left flex-1"><h3 className="font-semibold text-deep-purple text-base group-hover:text-primary transition-colors">Continue as School</h3><p className="text-xs text-gray-400 font-medium">Manage school purchases and vendors</p></div><ArrowRight className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" size={18} /></button>
    </div>
  </div>
);

const ContactInput = ({ role, onNext, onError, error }) => {
  const [value, setValue] = useState('');
  const handleInputChange = (e) => {
    let val = e.target.value;
    if (role === 'parent') val = val.replace(/\D/g, '').slice(0, 10);
    setValue(val);
    if (error) onError('');
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (role === 'parent' && value.length !== 10) return onError('Please enter a valid 10-digit mobile number');
    if (role === 'school' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return onError('Please enter a valid email address');
    onNext({ value });
  };
  const isValid = role === 'parent' ? value.length === 10 : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <h2 className="text-2xl font-semibold text-deep-purple mb-8">{role === 'parent' ? "What's your number?" : "Enter school email"}</h2>
      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-4">
          <label className="block text-[13px] font-semibold text-black ml-1">{role === 'parent' ? 'Mobile number' : 'Email address'}</label>
          <div className="relative group">{role === 'parent' ? <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} /> : <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />}
            <input type={role === 'parent' ? 'tel' : 'email'} value={value} onChange={handleInputChange} placeholder={role === 'parent' ? 'e.g. 9876543210' : 'admin@school.com'} className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-base focus:ring-2 focus:ring-primary/10 outline-none" />
          </div>
          {error && <p className="text-red-500 text-[11px] font-medium ml-1 mt-1">{error}</p>}
        </div>
        <button type="submit" disabled={!isValid} className={`w-full py-4 font-medium rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${isValid ? 'bg-primary text-white shadow-xl shadow-primary/20 active:scale-95' : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'}`}>Send OTP <ArrowRight size={20} /></button>
      </form>
    </div>
  );
};

const Verification = ({ role, onNext, onError, error }) => {
  const [value, setValue] = useState('');
  const handleInputChange = (e) => {
    let val = e.target.value;
    if (role === 'parent') {
      val = val.replace(/\D/g, '').slice(0, 4);
      if (val.length === 4) setTimeout(() => onNext({ value: val }), 300);
    }
    setValue(val);
    if (error) onError('');
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (role === 'parent' && value.length !== 4) return onError('Please enter the 4-digit OTP');
    if (role === 'school' && value.length < 8) return onError('Password must be at least 8 characters');
    onNext({ value });
  };
  const isValid = role === 'parent' ? value.length === 4 : value.length >= 8;
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <h2 className="text-2xl font-semibold text-deep-purple mb-2">Verify it's you</h2>
      <p className="text-gray-400 text-sm mb-10">{role === 'parent' ? "Enter the 4-digit code sent to your phone" : "Enter your account password"}</p>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <label className="block text-[13px] font-semibold text-black ml-1">{role === 'parent' ? 'OTP code' : 'Password'}</label>
          <div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            <input type={role === 'parent' ? 'tel' : 'password'} value={value} onChange={handleInputChange} maxLength={role === 'parent' ? 4 : undefined} placeholder={role === 'parent' ? '••••' : '••••••••'} className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-base focus:ring-2 focus:ring-primary/10 outline-none ${role === 'parent' ? 'tracking-[1em] font-mono' : ''}`} />
          </div>
          {error && <p className="text-red-500 text-[11px] font-medium ml-1 mt-1">{error}</p>}
        </div>
        <button type="submit" disabled={!isValid} className={`w-full py-4 font-medium rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${isValid ? 'bg-primary text-white shadow-xl shadow-primary/20 active:scale-95' : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'}`}>Verify & Continue <ArrowRight size={20} /></button>
      </form>
    </div>
  );
};

export default AppAuthPage;
