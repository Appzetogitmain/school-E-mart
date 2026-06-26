import React, { useEffect, useState } from 'react';
import { X, Phone, Mail, MessageSquare, Clock, ExternalLink, Loader2, User } from 'lucide-react';
import { getContactInfo } from '../../services/adminApi';
import { getErrorMessage } from '../../utils/apiHelpers';

const AccountManagerModal = ({ isOpen, onClose }) => {
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    setLoading(true);
    setError('');

    getContactInfo()
      .then((data) => {
        if (!cancelled) setContactInfo(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setContactInfo(null);
          setError(getErrorMessage(err, 'Unable to load contact details'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const managerName = contactInfo?.accountManagerName || contactInfo?.managerName || 'Institutional Support';
  const designation = contactInfo?.accountManagerTitle || 'School E-Mart Institutional Team';
  const phone = contactInfo?.accountManagerPhone || contactInfo?.phone || contactInfo?.supportPhone;
  const email = contactInfo?.accountManagerEmail || contactInfo?.email || contactInfo?.supportEmail;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-deep-purple/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="bg-primary pt-12 pb-20 px-8 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          <div className="pt-4">
            {loading ? (
              <Loader2 size={32} className="animate-spin text-white mx-auto" />
            ) : (
              <>
                <h3 className="text-2xl font-bold text-white mb-1">{managerName}</h3>
                <p className="text-white/70 text-xs font-medium uppercase tracking-widest">{designation}</p>
              </>
            )}
          </div>
        </div>

        <div className="px-8 pb-10 -mt-10 relative z-10">
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 space-y-6">
            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            {!loading && !phone && !email && !error && (
              <div className="text-center py-6">
                <User size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-400">Contact details not available yet</p>
              </div>
            )}

            <div className="space-y-3">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Phone size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase opacity-60">Call Manager</p>
                      <p className="text-sm font-bold">{phone}</p>
                    </div>
                  </div>
                  <ExternalLink size={16} className="opacity-40 group-hover:opacity-100" />
                </a>
              )}

              {email && (
                <a
                  href={`mailto:${email}`}
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
              )}

              {contactInfo?.whatsapp && (
                <a
                  href={`https://wa.me/${String(contactInfo.whatsapp).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
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
                </a>
              )}
            </div>

            <div className="pt-4 flex items-center justify-center gap-3 text-text-secondary">
              <Clock size={16} className="text-primary" />
              <span className="text-[11px] font-medium uppercase tracking-wider">
                {contactInfo?.weekdayHours || 'Available Mon - Sat, 9AM - 6PM'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 text-center">
          <p className="text-[10px] text-text-secondary font-medium uppercase tracking-widest">School E-Mart Institutional Team</p>
        </div>
      </div>
    </div>
  );
};

export default AccountManagerModal;
