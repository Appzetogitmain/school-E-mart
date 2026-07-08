import React, { useState, useEffect } from 'react';
import { Phone, Mail, MessageSquare, ChevronDown, ChevronUp, Clock, MapPin, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import AccountManagerModal from '../../components/shared/AccountManagerModal';
import SupportTickets from './SupportTickets';
import { listFaqs, getContactInfo } from '../../services/adminApi';
import { getErrorMessage } from '../../utils/apiHelpers';

const HelpCenter = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [faqResult, contact] = await Promise.all([
          listFaqs({ limit: 50 }).catch(() => ({ data: [] })),
          getContactInfo().catch(() => null),
        ]);
        if (!cancelled) {
          setFaqs(
            (faqResult.data || []).map((faq) => ({
              question: faq.question,
              answer: faq.answer,
            }))
          );
          setContactInfo(contact);
        }
      } catch (err) {
        if (!cancelled) {
          setFaqs([]);
          setError(getErrorMessage(err, 'Unable to load help content'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const contactCards = [
    {
      icon: Phone,
      title: 'Call Us',
      value: contactInfo?.phone || contactInfo?.supportPhone || '—',
      desc: contactInfo?.phoneHours || 'Available 9am - 6pm',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Mail,
      title: 'Email Us',
      value: contactInfo?.email || contactInfo?.supportEmail || '—',
      desc: 'Response within 24 hours',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp',
      value: contactInfo?.whatsapp || 'Chat with us',
      desc: 'Instant support',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#fcfcfd] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-deep-purple mb-6">Support Center</h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto font-normal">
            Need help with your school supplies or institutional order? We&apos;re here to assist you every step of the way.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {contactCards.map((item) => (
            <div key={item.title} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm text-center hover:shadow-lg transition-all group">
              <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                <item.icon size={28} />
              </div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{item.title}</h3>
              <p className="text-lg font-bold text-deep-purple mb-1">{item.value}</p>
              <p className="text-sm text-text-secondary font-normal">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <HelpCircle size={24} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-deep-purple">Common Questions</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : faqs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No FAQs available yet.</p>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-gray-50 last:border-0">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full py-6 flex items-center justify-between text-left group"
                  >
                    <span className={`text-lg font-medium transition-colors ${openFaq === i ? 'text-primary' : 'text-text-primary group-hover:text-primary'}`}>
                      {faq.question}
                    </span>
                    {openFaq === i ? <ChevronUp className="text-primary" /> : <ChevronDown className="text-gray-300" />}
                  </button>
                  {openFaq === i && (
                    <div className="pb-8 text-text-secondary leading-relaxed font-normal animate-in fade-in slide-in-from-top-2 duration-300">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <SupportTickets />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-primary p-10 rounded-[2.5rem] text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6 text-accent-orange">
                <ShieldCheck size={24} />
                <span className="font-bold tracking-widest text-xs uppercase">Institutional Support</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Are you a School Administrator?</h3>
              <p className="text-white/70 mb-8 font-normal">Our dedicated institutional relationship managers are here to handle your bulk orders and customizations.</p>
              <button 
                onClick={() => setIsManagerModalOpen(true)}
                className="bg-white text-primary px-8 py-3 rounded-xl font-bold hover:bg-accent-orange hover:text-deep-purple transition-all"
              >
                Contact Account Manager
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
          </div>

          <div className="bg-soft-lavender/40 p-10 rounded-[2.5rem] border border-purple-100/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6 text-primary">
                <Clock size={24} />
                <span className="font-bold tracking-widest text-xs uppercase">Working Hours</span>
              </div>
              <ul className="space-y-4">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary font-normal">Monday - Saturday</span>
                  <span className="font-bold text-deep-purple">{contactInfo?.weekdayHours || '9:00 AM - 6:00 PM'}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary font-normal">Sunday</span>
                  <span className="font-bold text-deep-purple">{contactInfo?.sundayHours || 'Closed'}</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 flex items-center gap-3 text-text-secondary">
              <MapPin size={18} className="text-primary" />
              <span className="text-sm font-normal">{contactInfo?.address || 'Pan India Delivery'}</span>
            </div>
          </div>
        </div>
      </div>

      <AccountManagerModal isOpen={isManagerModalOpen} onClose={() => setIsManagerModalOpen(false)} />
    </div>
  );
};

export default HelpCenter;
