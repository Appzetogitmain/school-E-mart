import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, FileText } from 'lucide-react';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing and using School E-Mart (the 'Platform'), you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, do not use the Platform."
    },
    {
      title: "2. User Accounts",
      content: "When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the credentials you use to access the Service."
    },
    {
      title: "3. Intellectual Property",
      content: "The Service and its original content, features, and functionality are and will remain the exclusive property of School E-Mart and its licensors."
    },
    {
      title: "4. Termination",
      content: "We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms."
    },
    {
      title: "5. Limitation of Liability",
      content: "In no event shall School E-Mart, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages resulting from your access to or use of the Service."
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
        <h1 className="text-base font-black text-deep-purple">Terms & Conditions</h1>
      </div>

      <div className="px-6 pt-6 flex-1 max-w-md mx-auto w-full">
        {/* Banner Card */}
        <div className="bg-gradient-to-tr from-[#3B248C] to-[#5B3FD6] rounded-[2rem] p-6 text-white mb-6 shadow-xl shadow-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-xl pointer-events-none"></div>
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20 mb-4">
            <ShieldCheck size={24} className="text-[#FFC933]" />
          </div>
          <h2 className="text-lg font-black leading-tight">Legal Terms</h2>
          <p className="text-[11px] text-white/70 font-semibold mt-1">
            Last updated: May 27, 2026. Please read these terms carefully.
          </p>
        </div>

        {/* Content Blocks */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white border border-gray-100/75 rounded-3xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.015)]"
            >
              <h3 className="text-xs font-black text-[#3B248C] uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText size={14} className="text-primary" />
                {section.title}
              </h3>
              <p className="text-[11px] font-semibold text-gray-500 leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Contact Block */}
        <div className="mt-6 p-6 bg-white border border-gray-100/75 rounded-3xl text-center">
          <h4 className="text-xs font-black text-[#3B248C] uppercase tracking-wider mb-1.5">Questions?</h4>
          <p className="text-[11px] font-semibold text-gray-400">
            If you have questions about these terms, contact us:
          </p>
          <p className="text-xs font-black text-primary mt-2">
            legal@schoolemart.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
