import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Copy, Share2,
  Users, Gift, ShoppingBag,
  CheckCircle2, Clock, Sparkles, LogIn
} from 'lucide-react';

const ReferEarnPage = () => {
  const navigate = useNavigate();
  // We'll mock the auth state for now or use localStorage
  const [isGuest] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return !saved;
  });

  const [showCopyToast, setShowCopyToast] = useState(false);

  // Generate or retrieve unique referral code
  const [referralCode] = useState(() => {
    if (isGuest) return null;
    const saved = localStorage.getItem('referral_code');
    const isValid = saved && /^EMART\d{4}$/.test(saved);
    if (isValid) return saved;

    const digits = '0123456789';
    let code = 'EMART';
    for (let i = 0; i < 4; i++) {
      code += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    localStorage.setItem('referral_code', code);
    return code;
  });

  const referral = {
    code: referralCode,
    totalEarnings: "1,250",
    monthlyEarnings: "450",
    successfulReferrals: 12,
    pendingReferrals: 5
  };

  const handleCopyCode = () => {
    if (!referral.code) return;
    navigator.clipboard.writeText(referral.code);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const handleShare = () => {
    if (!referral.code) return;
    const shareMessage = `Hey! Join School E-Mart using my code ${referral.code} and get amazing rewards on your first school order! Download now: https://schoolemart.com/app`;

    if (navigator.share) {
      navigator.share({
        title: 'Refer & Earn - School E-Mart',
        text: shareMessage,
        url: 'https://schoolemart.com/app',
      }).catch(console.error);
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit relative">
      {/* Toast Notification */}
      {showCopyToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
          <div className="bg-deep-purple text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/10">
            <CheckCircle2 size={16} className="text-green-400" />
            <span className="text-xs font-bold">Copied to clipboard</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-deep-purple z-50 px-6 pt-10 pb-5 flex items-center gap-4 shadow-xl shadow-primary/10 rounded-b-[2rem]">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-white tracking-tight">Refer & Earn</h1>
      </div>

      <div className="pt-32 px-6 space-y-8">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary to-[#8C75FF] rounded-[2.5rem] p-8 text-white overflow-hidden shadow-xl shadow-primary/20 animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30 animate-bounce-gentle">
              <Gift size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-medium mb-3">Invite Friends &<br />Earn Rewards</h2>
            <p className="text-white/70 text-sm font-light leading-relaxed max-w-[240px] mx-auto">
              Share your referral code and earn rewards when your friends place their first order
            </p>
          </div>
        </section>

        {/* Referral Code Card */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 border border-gray-50 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          {isGuest ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LogIn size={28} className="text-primary" />
              </div>
              <h3 className="text-lg font-black text-deep-purple mb-2">Sign in to Start Earning</h3>
              <p className="text-gray-400 text-xs font-medium mb-8 leading-relaxed max-w-[200px] mx-auto">
                Login now to generate your unique referral code and start inviting friends.
              </p>
              <button
                onClick={() => navigate('/user/login')}
                className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Login / Register
              </button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-4">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Your Referral Code</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-black text-deep-purple tracking-tight">{referral.code}</span>
                  <button
                    onClick={handleCopyCode}
                    className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary active:scale-90 transition-all"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="w-full py-5 bg-primary text-white rounded-2xl text-sm font-medium shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Share2 size={18} /> Share & Invite Friends
              </button>
            </>
          )}
        </section>

        {/* Earnings Summary */}
        <section>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-4">Your Earnings</h3>
          <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] rounded-[2rem] p-6 border border-golden-yellow/20 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-golden-yellow/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div>
              <p className="text-[10px] font-black text-golden-yellow uppercase tracking-widest mb-1">This Month</p>
              <p className="text-2xl font-black text-deep-purple">₹{isGuest ? '0' : referral.monthlyEarnings}</p>
            </div>
            <div className="w-px h-12 bg-golden-yellow/20"></div>
            <div className="text-right">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Total Earned</p>
              <p className="text-2xl font-black text-primary">₹{isGuest ? '0' : referral.totalEarnings}</p>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-4">How it Works</h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8">
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Share2 size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-deep-purple">Invite Friends</h4>
                <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1">Share your referral link with friends via WhatsApp or social media.</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-xl bg-golden-yellow/10 flex items-center justify-center text-golden-yellow shrink-0">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-deep-purple">They Place Order</h4>
                <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1">When your friend signs up and completes their first school order.</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-deep-purple">Both Earn Rewards</h4>
                <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1">You both get rewards instantly added to your wallet for next purchase.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Referral Stats */}
        <section>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-4">Your Referrals</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 text-center">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={20} className="text-green-500" />
              </div>
              <p className="text-2xl font-black text-deep-purple">{isGuest ? '0' : referral.successfulReferrals}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Successful</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 text-center">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock size={20} className="text-blue-500" />
              </div>
              <p className="text-2xl font-black text-deep-purple">{isGuest ? '0' : referral.pendingReferrals}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Pending</p>
            </div>
          </div>
        </section>
      </div>

      <style>
        {`
          @keyframes bounce-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-bounce-gentle {
            animation: bounce-gentle 3s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default ReferEarnPage;
