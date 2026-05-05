import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Phone, Mail, MapPin, Clock, 
  ArrowLeft, Send, CheckCircle2, 
  ChevronRight
} from 'lucide-react';

const ContactUsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!formData.email.includes('@')) newErrors.email = "Invalid email";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit">
      {/* Header */}
      <div className="bg-deep-purple px-6 pt-10 pb-6 rounded-b-[2.5rem] shadow-xl shadow-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-white tracking-tight">Contact Us</h1>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-8">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 gap-4">
          <ContactCard
            icon={<Phone className="text-primary" size={20} />}
            label="Call Us"
            value="+91 1234567890"
            href="tel:+911234567890"
          />
          <ContactCard
            icon={<Mail className="text-primary" size={20} />}
            label="Email Us"
            value="info@schoolemart.com"
            href="mailto:info@schoolemart.com"
          />
          <ContactCard
            icon={<MapPin className="text-primary" size={20} />}
            label="Visit Us"
            value="India"
          />
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
              <Clock className="text-primary" size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Support Hours</p>
              <p className="text-sm font-bold text-deep-purple">Mon - Sat: 9:00 AM - 7:00 PM</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 border border-gray-50">
          <h2 className="text-xl font-black text-deep-purple mb-6">Send a Message</h2>

          {submitted ? (
            <div className="py-8 text-center animate-in zoom-in duration-500">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-deep-purple mb-2">Thank you!</h3>
              <p className="text-sm text-gray-400 font-medium">We'll get back to you shortly.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-primary text-xs font-black uppercase tracking-widest"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Full Name"
                value={formData.name}
                onChange={(v) => setFormData({ ...formData, name: v })}
                error={errors.name}
                placeholder="John Doe"
              />
              <InputField
                label="Email Address"
                value={formData.email}
                onChange={(v) => setFormData({ ...formData, email: v })}
                error={errors.email}
                placeholder="john@example.com"
                type="email"
              />
              <InputField
                label="Phone (Optional)"
                value={formData.phone}
                onChange={(v) => setFormData({ ...formData, phone: v })}
                placeholder="+91 XXXXX XXXXX"
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                <textarea
                  className={`w-full bg-gray-50 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[120px] resize-none ${errors.message ? 'border border-red-500 bg-red-50/10' : 'border border-transparent'}`}
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                ></textarea>
                {errors.message && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Send Message <Send size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </section>

      </div>
    </div>
  );
};

const ContactCard = ({ icon, label, value, href }) => (
  <a
    href={href}
    className={`bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4 active:scale-[0.98] transition-all ${href ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-deep-purple break-all">{value}</p>
    </div>
    {href && <ChevronRight size={16} className="text-gray-300" />}
  </a>
);

const InputField = ({ label, value, onChange, error, placeholder, type = "text" }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-gray-50 rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all ${error ? 'border border-red-500 bg-red-50/10' : 'border border-transparent'}`}
    />
    {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
  </div>
);

export default ContactUsPage;
