import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShoppingCart, Info, User, Phone, Building, MapPin } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import * as authApi from '../../services/authApi';
import { getErrorMessage } from '../../utils/apiHelpers';
import { getLoginRedirectPath } from '../../utils/mappers/userMapper';

const VendorLogin = () => {
  const loginFromAuthResponse = useAuthStore((state) => state.loginFromAuthResponse);
  const navigate = useNavigate();

  // ?signup=1 opens straight on sign-up, so a school's "Invite Vendor" link
  // lands the vendor on registration rather than a login form they have no
  // account for.
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === '1');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      if (!name.trim() || !storeName.trim() || !phone.trim() || !email.trim() || !password.trim() || !location.trim()) {
        setError('Please fill in all the registration fields.');
        return;
      }

      setIsLoading(true);
      try {
        await authApi.vendorRegister({
          name: name.trim(),
          storeName: storeName.trim(),
          phone: phone.replace(/\D/g, '').slice(-10),
          email: email.trim(),
          password: password.trim(),
          location: location.trim(),
        });

        const authData = await authApi.vendorLogin(email.trim(), password.trim());
        loginFromAuthResponse(authData, 'vendor');
        navigate(getLoginRedirectPath(authData.user, 'vendor'));
      } catch (err) {
        setError(getErrorMessage(err, 'Registration failed. Please try again.'));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const authData = await authApi.vendorLogin(email.trim(), password.trim());
      loginFromAuthResponse(authData, 'vendor');
      navigate(getLoginRedirectPath(authData.user, 'vendor'));
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="min-h-screen bg-[#F4F5FA] flex items-center justify-center p-4 font-sans text-gray-900 selection:bg-purple-100 selection:text-purple-900">

      <div className="max-w-[460px] w-full bg-white rounded-[2rem] shadow-xl shadow-purple-950/5 border border-gray-100 p-8 md:p-10 relative overflow-hidden animate-fade-in">

        <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#5B3FD6]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="w-14 h-14 bg-[#5B3FD6] rounded-[1.25rem] flex items-center justify-center text-white shadow-lg shadow-purple-200 shrink-0 mb-4 animate-scale-in">
            <ShoppingCart size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">School E-MART</h1>
          <span className="bg-purple-50 text-[#5B3FD6] text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase mt-2.5 shadow-sm border border-purple-100">
            Vendor Portal
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in shake duration-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
            {error}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4.5 relative z-10">

          {isSignUp && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Seller Identity</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Harsh"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] transition-all font-medium placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Store Name</label>
                <div className="relative group">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Harsh's Hub"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] transition-all font-medium placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Contact Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={18} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 6268423925"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] transition-all font-medium placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Store Location Address</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. 172, Vaibhav Nagar, Tilak Nagar, Indore"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] transition-all font-medium placeholder-gray-400"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. harsh@appzeto.com"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] transition-all font-medium placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Password</label>
              {!isSignUp && (
                <button type="button" className="text-[10px] font-bold text-[#5B3FD6] hover:underline">Forgot?</button>
              )}
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] transition-all font-medium placeholder-gray-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#5B3FD6] text-white font-extrabold rounded-2xl hover:bg-[#472fc2] transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2 mt-6 text-sm tracking-wider uppercase disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {isSignUp ? 'Create Hub Account' : 'Sign In'} <ArrowRight size={16} />
              </>
            )}
          </button>

        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-2.5 relative z-10">
          <button
            onClick={toggleMode}
            className="text-xs font-bold text-[#5B3FD6] hover:underline cursor-pointer"
          >
            {isSignUp ? 'Already have a partner account? Sign In' : "Don't have a partner account? Create Hub / Sign Up"}
          </button>

          <div className="mt-2 text-center text-xs text-gray-400 font-medium flex items-center justify-center gap-1.5">
            <Info size={12} className="text-gray-400" />
            <span>Need a partner account? Contact E-Mart admin.</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default VendorLogin;
