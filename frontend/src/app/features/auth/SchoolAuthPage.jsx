import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, GraduationCap, ChevronLeft, Mail,
  Lock, User, Phone, ArrowRight, CheckCircle2,
  Sparkles, School, MapPin
} from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import * as authApi from '../../../services/authApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { getLoginRedirectPath } from '../../../utils/mappers/userMapper';

const SchoolAuthPage = () => {
  const navigate = useNavigate();
  const loginFromAuthResponse = useAuthStore((state) => state.loginFromAuthResponse);

  // Splash States
  const [showSplash, setShowSplash] = useState(true);
  const [splashStage, setSplashStage] = useState('initial');

  // Auth States
  const [step, setStep] = useState(1); // 1: Role Selection, 2: Forms, 3: Success
  const [role, setRole] = useState(''); // 'admin' or 'teacher'
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState({ id: '', name: '', role: '' });

  // Form Fields State
  const [formData, setFormData] = useState({
    schoolName: '',
    fullName: '',
    mobile: '',
    email: '',
    schoolCode: '',
    // Optional at signup, but captured here so the admin school list has a
    // location to show instead of an empty column.
    city: '',
    state: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Check if splash has already been seen in this session
    const seen = sessionStorage.getItem('schoolSplashSeen');
    if (seen) {
      setShowSplash(false);
      return;
    }

    const timer1 = setTimeout(() => {
      setSplashStage('transitioning');
      const timer2 = setTimeout(() => {
        setSplashStage('completed');
        setShowSplash(false);
        sessionStorage.setItem('schoolSplashSeen', 'true');
      }, 1000);
      return () => clearTimeout(timer2);
    }, 2000);
    return () => clearTimeout(timer1);
  }, []);

  const handleInputChange = (field, value) => {
    setError('');
    let finalValue = value;
    if (field === 'mobile') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }));
  };

  const handleBack = () => {
    setError('');
    if (step === 2) {
      setStep(1);
    } else {
      navigate(-1);
    }
  };

  const validateForm = () => {
    if (mode === 'login') {
      if (!formData.email.trim()) return 'Email ID is required';
      if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Please enter a valid email address';
      if (!formData.password) return 'Password is required';
    } else {
      if (role === 'admin' && !formData.schoolName.trim()) return 'School Name is required';
      if (!formData.fullName.trim()) return 'Full Name is required';

      if (!formData.mobile || formData.mobile.length !== 10) return 'Please enter a valid 10-digit mobile number';

      if (!formData.email.trim()) return 'Email ID is required';
      if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Please enter a valid email address';

      if (role === 'teacher' && !formData.schoolCode.trim()) return 'School Code is required';

      if (!formData.password) return 'Password is required';
      // Must match the API's rule. This said "at least 6 characters", so a 6-character
      // password passed here and was then rejected by the server with a message the
      // form had already contradicted.
      if (formData.password.length < 8) return 'Password must be at least 8 characters long';
      if (!/(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(formData.password)) {
        return 'Password must contain at least one number and one special character';
      }
      if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    if (mode === 'login') {
      try {
        const loginFn = role === 'teacher' ? authApi.teacherLogin : authApi.schoolAdminLogin;
        const authData = await loginFn(formData.email, formData.password);
        loginFromAuthResponse(authData, role === 'teacher' ? 'teacher' : 'school');
        navigate(getLoginRedirectPath(authData.user, role === 'teacher' ? 'teacher' : 'school'));
      } catch (err) {
        setError(getErrorMessage(err, 'Login failed. Please check your credentials.'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (role === 'teacher') {
      try {
        const authData = await authApi.teacherRegister({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile.replace(/\D/g, '').slice(-10),
          schoolCode: formData.schoolCode.trim().toUpperCase(),
          password: formData.password,
        });
        loginFromAuthResponse(authData, 'teacher');
        setSuccessInfo({
          id: authData.user?.refId || '',
          name: authData.user?.name || formData.fullName,
          role: 'Teacher',
        });
        setStep(3);
      } catch (err) {
        setError(getErrorMessage(err, 'Registration failed. Please check your details and school code.'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (role === 'admin') {
      try {
        const address = {
          city: formData.city.trim(),
          state: formData.state.trim(),
        };
        const cleanAddress = Object.fromEntries(
          Object.entries(address).filter(([, value]) => value !== '')
        );

        const result = await authApi.schoolAdminRegister({
          schoolName: formData.schoolName.trim(),
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile.replace(/\D/g, '').slice(-10),
          password: formData.password,
          ...(Object.keys(cleanAddress).length ? { address: cleanAddress } : {}),
        });

        // No auto-login: the school is a 'prospect' until an admin approves it,
        // so there is no session to adopt here.
        setSuccessInfo({
          id: result?.schoolRefNo || '',
          name: result?.user?.name || formData.fullName,
          role: 'School Administrator',
          pendingApproval: true,
        });
        setStep(3);
      } catch (err) {
        setError(getErrorMessage(err, 'Registration failed. Please check your details.'));
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    setStep(2);
    setMode('login');
  };

  // Check if form is filled enough to enable submit button visual styling
  const isFormValid = () => {
    if (mode === 'login') {
      return formData.email && formData.password;
    } else {
      if (role === 'admin') {
        return formData.schoolName && formData.fullName && formData.mobile.length === 10 && formData.email && formData.password && formData.confirmPassword;
      } else {
        return formData.fullName && formData.mobile.length === 10 && formData.email && formData.schoolCode && formData.password && formData.confirmPassword;
      }
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden relative font-outfit">
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

      {/* Splash Screen */}
      {showSplash && (
        <div className={`fixed inset-0 z-[100] bg-primary flex items-center justify-center transition-all duration-[1000ms] ease-in-out ${splashStage === 'transitioning' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className={`relative transition-all duration-[1000ms] ease-in-out transform ${splashStage === 'transitioning' ? 'scale-[0.25] -translate-y-[40vh] opacity-0' : 'scale-100 translate-y-0 opacity-100'}`}>
            <div className="w-32 h-32 bg-white p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-bounce-gentle flex items-center justify-center">
              <img src="/assets/logo.jpeg" alt="Logo" className="w-full h-full object-contain relative z-10" />
              <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shimmer 2s infinite ease-out' }}></div>
            </div>
            <div className="text-center mt-6 text-white font-bold text-lg tracking-wider animate-pulse">School Access</div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="h-44 bg-primary relative overflow-hidden flex items-center justify-center shrink-0">
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <img src="/assets/app/app_login.webp" alt="Background" className="w-full h-full object-cover mix-blend-overlay" />
        </div>
        {step > 1 && (
          <button
            onClick={handleBack}
            className="absolute top-6 left-6 z-30 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full text-white flex items-center justify-center border border-white/20 active:scale-95 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <button
          onClick={() => navigate('/school/admin')}
          className="absolute top-6 right-6 z-30 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20 active:scale-95 transition-all"
        >
          Skip
        </button>
        <div className={`relative z-10 flex flex-col items-center gap-2 transition-all duration-[1000ms] ${!showSplash || splashStage === 'transitioning' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="w-12 h-12 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center">
            <img src="/assets/logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-white font-black text-lg tracking-wide uppercase">School E-Mart</h1>
        </div>
      </div>

      {/* Main Body Card */}
      <div className={`flex-1 bg-white -mt-6 rounded-t-[2.5rem] relative z-20 px-6 pt-6 flex flex-col overflow-y-auto transition-all duration-[800ms] ${!showSplash || splashStage === 'transitioning' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col pt-2 pb-10">

          {/* STEP 1: Role Selection */}
          {step === 1 && (
            <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block">Welcome Portal</span>
                <h2 className="text-2xl font-black text-deep-purple">School Portal</h2>
                <p className="text-gray-400 text-sm mt-1">Select your role to continue</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => selectRole('admin')}
                  className="w-full p-6 bg-white border border-gray-100 rounded-3xl text-left shadow-lg shadow-gray-100 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.98] transition-all flex items-center gap-5 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <Building2 size={28} />
                  </div>
                  <div className="flex-1">
                    {/* <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-0.5">Management Access</span> */}
                    <h3 className="text-base font-black text-deep-purple">Continue as School Admin</h3>
                    {/* <p className="text-gray-400 text-xs mt-0.5">Procurement, bulk orders, and admin controls</p> */}
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => selectRole('teacher')}
                  className="w-full p-6 bg-white border border-gray-100 rounded-3xl text-left shadow-lg shadow-gray-100 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.98] transition-all flex items-center gap-5 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#ffc107]/10 flex items-center justify-center text-[#ffc107] group-hover:bg-[#ffc107] group-hover:text-black transition-all">
                    <GraduationCap size={28} />
                  </div>
                  <div className="flex-1">
                    {/* <span className="text-xs font-bold text-[#ffc107] uppercase tracking-wider block mb-0.5">Academic Access</span> */}
                    <h3 className="text-base font-black text-deep-purple">Continue as Teacher</h3>
                    {/* <p className="text-gray-400 text-xs mt-0.5">Class demands, resources, and planner tools</p> */}
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:text-[#ffc107] group-hover:translate-x-1 transition-all" />
                </button>
              </div>


            </div>
          )}

          {/* STEP 2: Login and Signup Forms */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Tab Selector */}
              {role !== 'teacher' ? (
                <div className="inline-flex bg-gray-50 p-1.5 rounded-2xl w-full mb-6 border border-gray-100">
                  <button
                    onClick={() => { setMode('login'); setError(''); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${mode === 'login' ? 'bg-white text-primary shadow-sm shadow-gray-100' : 'text-gray-400 hover:text-deep-purple'}`}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { setMode('signup'); setError(''); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${mode === 'signup' ? 'bg-white text-primary shadow-sm shadow-gray-100' : 'text-gray-400 hover:text-deep-purple'}`}
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-2xl text-xs font-bold text-[#3b2d7d] leading-relaxed">
                  Teachers must be registered by their school administrator. Please contact your school admin to get your account created.
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-black text-deep-purple">
                  {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {role === 'admin' ? 'School Administrator Portal' : 'Academic Teacher Portal'}
                </p>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in shake duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. School Name (Admin Signup Only) */}
                {role === 'admin' && mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">School Name</label>
                    <div className="relative group">
                      <School className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text"
                        value={formData.schoolName}
                        onChange={(e) => handleInputChange('schoolName', e.target.value)}
                        placeholder="e.g. Delhi Public School"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder-gray-400"
                      />
                    </div>
                  </div>
                )}

                {/* 1b. City / State (Admin Signup Only) — optional, but without them
                    the admin school list has no location to show. */}
                {role === 'admin' && mode === 'signup' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        City <span className="text-gray-300">(optional)</span>
                      </label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="e.g. Indore"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        State <span className="text-gray-300">(optional)</span>
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="e.g. MP"
                          className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Full Name (Signup Only) */}
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="e.g. Priyan Damodaran"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder-gray-400"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Mobile (Signup Only) */}
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => handleInputChange('mobile', e.target.value)}
                        placeholder="Enter 10-digit number"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder-gray-400"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Email (Always) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email ID</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="e.g. name@school.com"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* 5. School Code (Teacher Signup Only) */}
                {role === 'teacher' && mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">School Code</label>
                    <div className="relative group">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text"
                        value={formData.schoolCode}
                        onChange={(e) => handleInputChange('schoolCode', e.target.value)}
                        placeholder="Enter official School Code"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder-gray-400 uppercase"
                      />
                    </div>
                  </div>
                )}

                {/* 6. Password (Always) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* 7. Confirm Password (Signup Only) */}
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder-gray-400"
                      />
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4.5 mt-8 font-black rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 tracking-wider uppercase text-sm ${isFormValid() ? 'bg-primary text-white shadow-xl shadow-primary/20 active:scale-[0.98]' : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'}`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {mode === 'login' ? 'Verify & Continue' : 'Create Account'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronLeft size={16} /> Choose different role
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100 animate-bounce-gentle">
                <CheckCircle2 size={42} strokeWidth={2.5} />
              </div>

              <h2 className="text-2xl font-black text-deep-purple mb-2">Registration Successful!</h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-8">
                {successInfo.pendingApproval ? (
                  <>
                    Thanks, <strong>{successInfo.name}</strong>. Your school is now waiting for
                    approval — we&apos;ll email you as soon as it&apos;s approved, and you can sign
                    in from then.
                  </>
                ) : (
                  <>
                    Welcome to School E-Mart, <strong>{successInfo.name}</strong>. Your school access
                    has been generated.
                  </>
                )}
              </p>

              <div className="bg-[#fafbff] border-2 border-dashed border-primary/20 rounded-3xl p-6 w-full max-w-sm mb-10 shadow-inner">
                <span className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-black mb-2 block">
                  Your {successInfo.role === 'Teacher' ? 'Teacher Ref' : 'School Admin Ref'} ID
                </span>
                <span className="text-2xl font-mono font-black text-primary tracking-wider">
                  {successInfo.id}
                </span>
              </div>

              {/* A pending school has no session, so there is no dashboard to send
                  them to — offer the sign-in page for once they are approved. */}
              <button
                onClick={() => {
                  if (!successInfo.pendingApproval) {
                    navigate(successInfo.role === 'Teacher' ? '/school/teacher/dashboard' : '/school/admin');
                    return;
                  }
                  setMode('login');
                  setStep(2);
                }}
                className="w-full py-4.5 bg-primary text-white font-black rounded-2xl hover:bg-deep-purple transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase text-sm tracking-wider active:scale-[0.98]"
              >
                {successInfo.pendingApproval ? 'Back to Sign In' : 'Go to Dashboard'} <ArrowRight size={18} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SchoolAuthPage;
