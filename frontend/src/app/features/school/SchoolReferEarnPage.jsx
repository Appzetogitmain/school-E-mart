import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Share2, Copy, Users,
  Trophy, Gift, ChevronRight, Building2,
  Sparkles
} from 'lucide-react';
import { getMyReferral } from '../../../services/walletApi';

const SchoolReferEarnPage = () => {
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyReferral();
        if (!cancelled && data?.referral?.referralCode) {
          setReferralCode(data.referral.referralCode);
        }
      } catch {
        // Referral fetch failed — leave the code blank.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-20 font-outfit">
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 py-5 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-deep-purple">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-black text-deep-purple">Partner Referral</h1>
        <div className="w-10 h-10"></div>
      </div>

      <div className="pt-24 px-6">
        <div className="bg-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20 mb-8 text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <Building2 size={48} className="mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-black mb-2">Invite Other Schools</h2>
          <p className="text-white/70 text-xs font-medium leading-relaxed">
            Help other schools modernize their procurement. Earn institutional credits for every school that joins through your link.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-4">Your Unique School Code</p>
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-dashed border-gray-200">
            <span className="text-xl font-black text-deep-purple tracking-wider">{referralCode}</span>
            <button onClick={handleCopy} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${copied ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-deep-purple uppercase tracking-widest ml-1">Partnership Rewards</h3>
          {[
            { title: "Institutional Credits", desc: "Get ₹2,500 credit on your next bulk procurement.", icon: <Gift className="text-primary" /> },
            { title: "Priority Support", desc: "Gain 24/7 access to dedicated procurement experts.", icon: <Sparkles className="text-accent-gold" /> }
          ].map((benefit, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0">
                {benefit.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-deep-purple">{benefit.title}</h4>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SchoolReferEarnPage;
