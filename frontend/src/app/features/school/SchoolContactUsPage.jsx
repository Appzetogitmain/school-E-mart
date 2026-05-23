import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, Mail, MapPin, Clock,
  ArrowLeft, Send, CheckCircle2,
  ChevronRight, Building2
} from 'lucide-react';

const SchoolContactUsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit">
      <div className="bg-deep-purple px-6 pt-10 pb-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-black text-white tracking-tight">Contact Us</h1>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-8">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary"><Building2 size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Procurement Desk</p>
              <p className="text-sm font-bold text-deep-purple">+91 99999 88888</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary"><Mail size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Bulk Inquiries</p>
              <p className="text-sm font-bold text-deep-purple">schools@schoolemart.com</p>
            </div>
          </div>
        </div>

        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50">
          <h2 className="text-xl font-black text-deep-purple mb-6">Inquiry Form</h2>
          {submitted ? (
            <div className="py-8 text-center animate-in zoom-in">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-deep-purple">Request Logged!</h3>
              <p className="text-sm text-gray-400">Our relationship manager will contact you within 4 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Administrator Name</label>
                <input type="text" className="w-full bg-gray-50 rounded-2xl px-4 py-3.5 text-sm font-medium outline-none border border-transparent focus:border-primary/20 transition-all" placeholder="Enter name" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Email</label>
                <input type="email" className="w-full bg-gray-50 rounded-2xl px-4 py-3.5 text-sm font-medium outline-none border border-transparent focus:border-primary/20 transition-all" placeholder="admin@school.com" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Procurement Message</label>
                <textarea className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-medium outline-none border border-transparent focus:border-primary/20 transition-all min-h-[120px]" placeholder="Describe your institutional requirements..." required></textarea>
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>Submit Inquiry <Send size={16} /></>}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default SchoolContactUsPage;
