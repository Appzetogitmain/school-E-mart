import React from 'react';
import { ShieldCheck, Lock, Package, GraduationCap } from 'lucide-react';

const TrustStrip = () => {
  const trusts = [
    { icon: <ShieldCheck className="text-primary" />, label: 'Verified Vendors' },
    { icon: <Lock className="text-primary" />, label: 'Secure Payments' },
    { icon: <Package className="text-primary" />, label: 'Bulk Procurement' },
    { icon: <GraduationCap className="text-primary" />, label: 'School-Specific Shopping' },
  ];

  return (
    <div className="bg-soft-lavender/50 border-y border-purple-100/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {trusts.map((item, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-[15px] font-normal text-text-primary tracking-tight">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustStrip;
