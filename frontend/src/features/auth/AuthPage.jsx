import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail, Lock, User, Phone, School, MapPin,
  ArrowRight, CheckCircle2, ChevronLeft, Building2
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import useAuthStore from '../../store/useAuthStore';
import * as authApi from '../../services/authApi';
import { getErrorMessage } from '../../utils/apiHelpers';
import { getLoginRedirectPath } from '../../utils/mappers/userMapper';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const loginFromAuthResponse = useAuthStore((state) => state.loginFromAuthResponse);

  const [isLogin, setIsLogin] = useState(location.pathname === ROUTES.LOGIN);
  const [role, setRole] = useState(searchParams.get('role') || 'parent');
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sync mode with URL
  useEffect(() => {
    setIsLogin(location.pathname === ROUTES.LOGIN);
  }, [location.pathname]);

  const generateId = (roleType) => {
    const prefix = roleType === 'school' ? 'SEM-S-' : 'SEM-P-';
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${random}`;
  };

  const handleSendOtp = async () => {
    const phone = mobile.replace(/\D/g, '').slice(-10);
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authApi.requestParentOtp(phone);
      setOtpSent(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to send OTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const newId = generateId(role);
        setGeneratedId(newId);
        setIsSuccess(true);
      }, 1500);
      return;
    }

    setIsLoading(true);
    try {
      if (role === 'parent') {
        const phone = mobile.replace(/\D/g, '').slice(-10);
        if (phone.length !== 10 || otp.length !== 4) {
          setError('Enter a valid mobile number and 4-digit OTP');
          return;
        }
        const authData = await authApi.parentWebLogin(phone, otp);
        loginFromAuthResponse(authData, 'parent');
        navigate(getLoginRedirectPath(authData.user, 'parent'));
      } else {
        if (!email.trim() || !password) {
          setError('Email and password are required');
          return;
        }
        const authData = await authApi.schoolAdminLogin(email.trim(), password);
        loginFromAuthResponse(authData, 'school');
        navigate(getLoginRedirectPath(authData.user, 'school'));
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#fafbff] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(91,63,214,0.1)] text-center border border-gray-100 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-4">Registration Successful!</h2>
          <p className="text-text-secondary mb-8 leading-relaxed">
            Welcome to School E-Mart. Your unique {role === 'school' ? 'Reference Number' : 'User ID'} has been generated.
          </p>
          
          <div className="bg-[#fafbff] border-2 border-dashed border-primary/20 rounded-2xl p-6 mb-10">
            <span className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2 block">
              Your {role === 'school' ? 'School Ref' : 'User'} ID
            </span>
            <span className="text-3xl font-mono font-bold text-primary tracking-wider">
              {generatedId}
            </span>
          </div>

          <button 
            onClick={() => navigate(ROUTES.MARKETPLACE + `?role=${role}`)}
            className="w-full py-4 bg-primary text-white font-semibold rounded-2xl hover:bg-deep-purple transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            Go to Marketplace <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbff] flex flex-col items-center justify-center p-4 py-20">
      {/* Back to Home */}
      <button 
        onClick={() => navigate(ROUTES.HOME)}
        className="absolute top-8 left-8 flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-medium"
      >
        <ChevronLeft size={20} /> Back to Home
      </button>

      <div className="max-w-[1000px] w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3rem] shadow-[0_20px_60px_rgba(91,63,214,0.08)] overflow-hidden border border-gray-100">
        
        {/* Left Side: Illustration & Branding */}
        <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <img src="/assets/logo.jpeg" alt="Logo" className="w-10 h-10 rounded-xl" />
              <span className="text-xl font-bold tracking-tight text-white">School E-Mart</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              {isLogin ? 'Welcome Back!' : 'Start Your Journey With Us'}
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-sm">
              Connecting schools and parents with trusted vendors across India for a seamless shopping experience.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-accent-gold rounded-xl flex items-center justify-center text-deep-purple">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-sm font-medium">Verified Vendor Network</p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-accent-gold rounded-xl flex items-center justify-center text-deep-purple">
                <Building2 size={20} />
              </div>
              <p className="text-sm font-medium">Bulk Institutional Discounts</p>
            </div>
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-accent-orange/10 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-10 lg:p-16">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-10">
              <div className="inline-flex bg-gray-100 p-1.5 rounded-2xl mb-8">
                <button 
                  onClick={() => navigate(ROUTES.LOGIN + `?role=${role}`)}
                  className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all ${isLogin ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate(ROUTES.REGISTER + `?role=${role}`)}
                  className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all ${!isLogin ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
                >
                  Register
                </button>
              </div>

              <h2 className="text-2xl font-bold text-text-primary mb-2">
                {isLogin ? 'Login to Portal' : 'Create an Account'}
              </h2>
              <p className="text-text-secondary text-sm">
                Select your role to continue
              </p>
            </div>

            {/* Role Switcher */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => setRole('parent')}
                className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${role === 'parent' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
              >
                <User size={20} />
                <span className="font-semibold text-sm">Parent</span>
              </button>
              <button 
                onClick={() => setRole('school')}
                className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${role === 'school' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
              >
                <School size={20} />
                <span className="font-semibold text-sm">School</span>
              </button>
            </div>

            {/* Form */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {role === 'parent' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">Student Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder="Child's full name" 
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1 group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                          type="tel"
                          required
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="+91 XXXXX XXXXX"
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="px-4 py-3 bg-primary/10 text-primary text-[12px] font-bold rounded-2xl hover:bg-primary/20 transition-all whitespace-nowrap"
                      >
                        {otpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">Enter OTP</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text"
                        required
                        maxLength={4}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="4-digit code"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all tracking-[0.5em] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">School Name</label>
                      <div className="relative group">
                        <School className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <select className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                          <option value="">Select School</option>
                          <option>Delhi Public School</option>
                          <option>St. Xavier's School</option>
                          <option>Ryan International</option>
                          <option>The Doon School</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">School Ref No.</label>
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          placeholder="e.g. SEM-S-123" 
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* School Specific Fields */}
                  {!isLogin && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">School Name</label>
                        <div className="relative group">
                          <School className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type="text" 
                            required
                            placeholder="Official school name" 
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">Principal / Admin Name</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type="text" 
                            required
                            placeholder="Authorized contact person" 
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@school.com"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">School Address</label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-3 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <textarea 
                          rows={2}
                          required
                          placeholder="Complete school location" 
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                        ></textarea>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-deep-purple transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isLogin ? 'Login to Portal' : 'Register Now'} 
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm text-text-secondary">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => navigate(isLogin ? ROUTES.REGISTER : ROUTES.LOGIN + `?role=${role}`)}
                  className="ml-2 font-bold text-primary hover:underline"
                >
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
