import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone, Mail, MapPin, Clock, Save, Loader2,
  CheckCircle2, AlertCircle, Building2, MessageSquare
} from 'lucide-react';
import { getContactSettings, updateContactSettings } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const ContactManagement = () => {
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    address: '',
    workingHours: '',
    whatsapp: '',
    bulkPhone: '',
    bulkEmail: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getContactSettings();
      if (data) {
        setFormData({
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          workingHours: data.workingHours || '',
          whatsapp: data.whatsapp || '',
          bulkPhone: data.bulkPhone || '',
          bulkEmail: data.bulkEmail || '',
        });
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load contact settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateContactSettings(formData);
      showToast('Contact Us settings updated successfully!');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save contact settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl font-outfit">
      {/* Toast alert */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5">
          <CheckCircle2 size={16} strokeWidth={3} className="shrink-0" />
          <span className="text-xs font-black">{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-deep-purple tracking-tight">Contact Us Page Management</h1>
          <p className="text-xs font-bold text-gray-400 mt-1">
            Update helpline numbers, support emails, address, and bulk inquiry contacts shown across the application.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & General Contact Section */}
        <div className="bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-primary flex items-center justify-center">
              <Phone size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-deep-purple uppercase tracking-wider">General & Customer Support Details</h2>
              <p className="text-[11px] text-gray-400 font-bold">Visible on parent app and general contact page</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Support Phone / Helpline</label>
              <div className="relative">
                <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Support Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="support@schoolemart.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Headquarters / Physical Address</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-4 top-3.5 text-gray-400" />
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Full office or headquarters address"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Working / Operating Hours</label>
              <div className="relative">
                <Clock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.workingHours}
                  onChange={(e) => handleInputChange('workingHours', e.target.value)}
                  placeholder="Mon - Sat: 9:00 AM - 7:00 PM"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp Support Number</label>
              <div className="relative">
                <MessageSquare size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Institutional & Bulk Inquiry Contact Section */}
        <div className="bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-primary flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-deep-purple uppercase tracking-wider">School & Bulk Procurement Contact</h2>
              <p className="text-[11px] text-gray-400 font-bold">Visible on School Admin portal Contact Us page</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bulk Procurement Desk Phone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.bulkPhone}
                  onChange={(e) => handleInputChange('bulkPhone', e.target.value)}
                  placeholder="+91 99999 88888"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Institutional Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.bulkEmail}
                  onChange={(e) => handleInputChange('bulkEmail', e.target.value)}
                  placeholder="schools@schoolemart.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-primary text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-200 hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Saving Changes…</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Contact Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactManagement;
