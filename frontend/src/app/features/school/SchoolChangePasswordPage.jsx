import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Lock, Eye, EyeOff, ShieldCheck, Check, AlertCircle 
} from 'lucide-react';

const SchoolChangePasswordPage = () => {
  const navigate = useNavigate();
  
  // State for form fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Loading & success feedback states
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password validation checks helper
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current account password.');
      return;
    }
    if (!hasMinLength || !hasNumber || !hasSpecialChar) {
      setErrorMsg('Please ensure new password meets all security requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Confirm password does not match new password.');
      return;
    }

    setLoading(true);

    // Simulate safe secure API call
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate(-1); // Go back to More page
      }, 1500);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-outfit">
      
      {/* Success Toast Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] bg-deep-purple/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center shadow-2xl animate-in zoom-in duration-500 text-white">
            <Check size={40} strokeWidth={3} />
          </div>
          <h2 className="text-xl font-black text-white mt-6">Password Updated!</h2>
          <p className="text-sm text-purple-200 font-bold block mt-2">Your security credentials have been updated successfully.</p>
        </div>
      )}

      {/* Top Sticky Header */}
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
            <h1 className="text-xl font-black leading-tight">Change Password</h1>
            <span className="text-[11px] text-purple-200 font-bold block mt-0.5">
              Update your account security password
            </span>
          </div>
        </div>
        <div className="w-11 h-11" />
      </div>

      <div className="max-w-md mx-auto px-6 pt-10 space-y-8">
        
        {/* Shield Intro banner */}
        <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#3b2d7d] flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div className="text-xs">
            <h3 className="font-black text-deep-purple uppercase tracking-wider">Secure Credentials</h3>
            <p className="text-gray-400 font-bold mt-1 leading-normal">
              Keep your administrative account highly secure by setting a complex password not reused elsewhere.
            </p>
          </div>
        </div>

        {/* Password update Form */}
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-rose-600 font-bold animate-in shake duration-300">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
            <div className="relative flex items-center bg-white rounded-2xl border border-gray-200 focus-within:border-[#3b2d7d]/50 transition-colors shadow-inner">
              <div className="pl-4 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full py-4 pl-3 pr-12 bg-transparent text-sm font-bold text-deep-purple outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 text-gray-400 hover:text-deep-purple transition-colors"
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
            <div className="relative flex items-center bg-white rounded-2xl border border-gray-200 focus-within:border-[#3b2d7d]/50 transition-colors shadow-inner">
              <div className="pl-4 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full py-4 pl-3 pr-12 bg-transparent text-sm font-bold text-deep-purple outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 text-gray-400 hover:text-deep-purple transition-colors"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
            <div className="relative flex items-center bg-white rounded-2xl border border-gray-200 focus-within:border-[#3b2d7d]/50 transition-colors shadow-inner">
              <div className="pl-4 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full py-4 pl-3 pr-12 bg-transparent text-sm font-bold text-deep-purple outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 text-gray-400 hover:text-deep-purple transition-colors"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Password Strength list indicators */}
          <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-3.5 shadow-sm text-xs">
            <span className="text-[10px] font-black text-deep-purple uppercase tracking-wider block pl-0.5">Password Requirements</span>
            
            <div className="space-y-2.5 font-bold">
              {/* Check 1: Min length */}
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  hasMinLength 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}>
                  <Check size={11} className="stroke-[3]" />
                </div>
                <span className={hasMinLength ? 'text-emerald-700' : 'text-gray-400'}>Minimum 8 characters length</span>
              </div>

              {/* Check 2: At least one number */}
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  hasNumber 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}>
                  <Check size={11} className="stroke-[3]" />
                </div>
                <span className={hasNumber ? 'text-emerald-700' : 'text-gray-400'}>At least one numeric digit (0-9)</span>
              </div>

              {/* Check 3: At least one special char */}
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  hasSpecialChar 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}>
                  <Check size={11} className="stroke-[3]" />
                </div>
                <span className={hasSpecialChar ? 'text-emerald-700' : 'text-gray-400'}>At least one special character (!@#$)</span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4.5 bg-[#3b2d7d] hover:bg-[#523da7] disabled:bg-gray-300 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Update Password</>
            )}
          </button>

        </form>

      </div>

    </div>
  );
};

export default SchoolChangePasswordPage;
