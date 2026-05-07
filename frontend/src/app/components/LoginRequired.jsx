import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, Sparkles } from 'lucide-react';

const LoginRequired = ({ title = "Login Required", message = "Please login to access this page and view your personalized details." }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center text-primary mb-8 relative">
        <Lock size={40} />
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white shadow-lg rounded-xl flex items-center justify-center text-accent-gold animate-bounce">
          <Sparkles size={16} fill="currentColor" />
        </div>
      </div>

      <h2 className="text-2xl font-black text-deep-purple tracking-tight mb-3">
        {title}
      </h2>
      <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[260px] mb-10">
        {message}
      </p>

      <button
        onClick={() => navigate('/user/login')}
        className="w-full max-w-[240px] py-4 bg-primary text-white rounded-2xl text-base font-black shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 tracking-widest uppercase"
      >
        <LogIn size={20} strokeWidth={3} />
        Login Now
      </button>

      <p className="mt-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
        School E-Mart Secure Portal
      </p>
    </div>
  );
};

export default LoginRequired;
