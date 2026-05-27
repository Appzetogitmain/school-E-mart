import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Eye, Database, Lock, UserCheck } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <Database size={16} className="text-primary" />,
      title: "Information Collection",
      content: "We collect several different types of information to provide and improve our Service. This includes Personal Data (name, phone number) and Usage Data."
    },
    {
      icon: <Eye size={16} className="text-primary" />,
      title: "Use of Data",
      content: "School E-Mart uses the collected data to maintain our Service, notify you about changes, provide customer support, and perform system analytics."
    },
    {
      icon: <Lock size={16} className="text-primary" />,
      title: "Data Security",
      content: "The security of your data is important to us, but no electronic transmission or storage method is 100% secure. We utilize leading industry standards to safeguard your information."
    },
    {
      icon: <Shield size={16} className="text-primary" />,
      title: "Service Providers",
      content: "We may employ third-party service providers to facilitate our Service, handle payments, deliver products, or analyze platform usage."
    },
    {
      icon: <UserCheck size={16} className="text-primary" />,
      title: "Your Data Rights",
      content: "You retain full rights to correct, amend, limit, or delete your Personal Data. If you wish to update or remove your details, contact our support desk."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col font-outfit pb-12">
      {/* Premium Header */}
      <div className="px-6 py-5 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100/50">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-deep-purple active:scale-90 transition-all shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base font-black text-deep-purple">Privacy Policy</h1>
      </div>

      <div className="px-6 pt-6 flex-1 max-w-md mx-auto w-full">
        {/* Banner Card */}
        <div className="bg-gradient-to-tr from-[#3B248C] to-[#5B3FD6] rounded-[2rem] p-6 text-white mb-6 shadow-xl shadow-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-xl pointer-events-none"></div>
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20 mb-4">
            <Shield size={24} className="text-[#FFC933]" />
          </div>
          <h2 className="text-lg font-black leading-tight">Privacy First</h2>
          <p className="text-[11px] text-white/70 font-semibold mt-1">
            Last updated: May 27, 2026. Your privacy is critically important to us.
          </p>
        </div>

        {/* Content Blocks */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white border border-gray-100/75 rounded-3xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.015)] flex gap-4 items-start"
            >
              <div className="w-9 h-9 bg-primary/5 rounded-xl flex items-center justify-center shrink-0 border border-primary/10">
                {section.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-[#3B248C] uppercase tracking-wider mb-1.5">
                  {section.title}
                </h3>
                <p className="text-[11px] font-semibold text-gray-500 leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Block */}
        <div className="mt-6 p-6 bg-white border border-gray-100/75 rounded-3xl text-center">
          <h4 className="text-xs font-black text-[#3B248C] uppercase tracking-wider mb-1.5">Privacy Concerns?</h4>
          <p className="text-[11px] font-semibold text-gray-400">
            Reach out to our Data Protection Officer:
          </p>
          <p className="text-xs font-black text-primary mt-2">
            privacy@schoolemart.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
