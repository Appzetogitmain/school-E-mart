import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import * as authApi from '../../../services/authApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { getLoginRedirectPath } from '../../../utils/mappers/userMapper';

const SuperAdminLogin = () => {
  const loginFromAuthResponse = useAuthStore((state) => state.loginFromAuthResponse);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide administrative email and password credentials.');
      return;
    }

    setIsLoading(true);
    try {
      const authData = await authApi.adminLogin(email.trim(), password.trim());
      loginFromAuthResponse(authData, 'admin');
      navigate(getLoginRedirectPath(authData.user, 'admin'));
    } catch (err) {
      setError(getErrorMessage(err, 'Authentication failed. Please verify your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 font-sans text-gray-100 selection:bg-indigo-900 selection:text-indigo-200">

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-[460px] w-full bg-[#111827]/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-indigo-950/20 border border-gray-800 p-8 md:p-10 relative overflow-hidden animate-fade-in z-10">

        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0 mb-4 animate-scale-in">
            <ShieldCheck size={26} strokeWidth={2.2} className="text-white drop-shadow" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">School E-MART</h1>
          <span className="bg-indigo-950/80 text-indigo-400 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase mt-2.5 shadow-sm border border-indigo-900/50">
            Super Admin Console
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 text-red-300 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in shake duration-300">
            <ShieldAlert size={18} className="text-red-400 shrink-0" />
            <div>
              <span className="font-extrabold uppercase block text-[10px] text-red-400 tracking-wider">Access Denied</span>
              <p className="font-medium mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4.5 relative z-10">

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">System Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@school-e-mart.com"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-white placeholder-gray-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Secret Passcode</label>
              <button type="button" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline">Forgot Code?</button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-white placeholder-gray-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold rounded-2xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 mt-6 text-sm tracking-wider uppercase disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer border border-indigo-500/30"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Authenticate Console <ArrowRight size={16} />
              </>
            )}
          </button>

        </form>

      </div>

    </div>
  );
};

export default SuperAdminLogin;
