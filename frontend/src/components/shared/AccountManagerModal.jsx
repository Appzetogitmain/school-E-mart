import React from 'react';
import { X, Phone, Mail, MessageSquare, ShieldCheck, Clock, ExternalLink } from 'lucide-react';

const AccountManagerModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const managerInfo = {
    name: 'Prachi Sharma',
    designation: 'Senior Institutional Relationship Manager',
    phone: '+91 12345 67890',
    email: 'prachi.sharma@schoolemart.com',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    experience: '8+ Years in Education Sector',
    languages: ['English', 'Hindi', 'Bhojpuri']
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-deep-purple/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">

        {/* Header/Banner */}
        <div className="bg-primary pt-12 pb-20 px-8 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          <div className="pt-4">
            <h3 className="text-2xl font-bold text-white mb-1">{managerInfo.name}</h3>
            <p className="text-white/70 text-xs font-medium uppercase tracking-widest">{managerInfo.designation}</p>
          </div>
        </div>

        {/* Info Body */}
        <div className="px-8 pb-10 -mt-10 relative z-10">
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 space-y-6">

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-50">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Expertise</p>
                <p className="text-xs font-bold text-deep-purple">{managerInfo.experience}</p>
              </div>
              <div className="text-center border-l border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Languages</p>
                <p className="text-xs font-bold text-deep-purple">{managerInfo.languages.join(', ')}</p>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="space-y-3">
              <a
                href={`tel:${managerInfo.phone}`}
                className="w-full flex items-center justify-between p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase opacity-60">Call Manager</p>
                    <p className="text-sm font-bold">{managerInfo.phone}</p>
                  </div>
                </div>
                <ExternalLink size={16} className="opacity-40 group-hover:opacity-100" />
              </a>

              <a
                href={`mailto:${managerInfo.email}`}
                className="w-full flex items-center justify-between p-4 bg-orange-50 text-orange-600 rounded-2xl hover:bg-orange-600 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Mail size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase opacity-60">Send Email</p>
                    <p className="text-sm font-bold">Email Directly</p>
                  </div>
                </div>
                <ExternalLink size={16} className="opacity-40 group-hover:opacity-100" />
              </a>

              <button
                className="w-full flex items-center justify-between p-4 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <MessageSquare size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase opacity-60">WhatsApp</p>
                    <p className="text-sm font-bold">Instant Support</p>
                  </div>
                </div>
                <ExternalLink size={16} className="opacity-40 group-hover:opacity-100" />
              </button>
            </div>

            {/* Availability */}
            <div className="pt-4 flex items-center justify-center gap-3 text-text-secondary">
              <Clock size={16} className="text-primary" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Available Mon - Sat, 9AM - 6PM</span>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="bg-gray-50 px-8 py-4 text-center">
          <p className="text-[10px] text-text-secondary font-medium uppercase tracking-widest">School E-Mart Institutional Team</p>
        </div>
      </div>
    </div>
  );
};

export default AccountManagerModal;
