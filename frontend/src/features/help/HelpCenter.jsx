import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, ChevronDown, ChevronUp, Clock, MapPin, ShieldCheck, HelpCircle } from 'lucide-react';
import AccountManagerModal from '../../components/shared/AccountManagerModal';

const HelpCenter = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  const faqs = [
    {
      question: "How do I track my order?",
      answer: "You can track your order by logging into your account and visiting the 'My Orders' section. You'll find real-time updates and tracking links for all your active shipments."
    },
    {
      question: "What is the return policy?",
      answer: "We offer returns on most school supplies within 7 days of delivery, provided the items are in their original packaging. Custom-made uniforms and personalized kits are non-returnable unless damaged."
    },
    {
      question: "How can my school register for bulk orders?",
      answer: "Schools can register by clicking the 'Register Your School' button. Once verified, our institutional team will help you set up bulk procurement with special pricing."
    },
    {
      question: "Are the products on School E-Mart verified?",
      answer: "Yes, every vendor on our platform undergoes a strict verification process. We ensure all products, especially uniforms and lab equipment, meet quality standards before they reach you."
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#fcfcfd] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-deep-purple mb-6">Support Center</h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto font-normal">
            Need help with your school supplies or institutional order? We're here to assist you every step of the way.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { icon: Phone, title: 'Call Us', value: '+91 12345 67890', desc: 'Available 9am - 6pm', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Mail, title: 'Email Us', value: 'support@schoolemart.com', desc: 'Response within 24 hours', color: 'text-orange-600', bg: 'bg-orange-50' },
            { icon: MessageSquare, title: 'WhatsApp', value: 'Chat with us', desc: 'Instant support', color: 'text-green-600', bg: 'bg-green-50' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm text-center hover:shadow-lg transition-all group">
              <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                <item.icon size={28} />
              </div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{item.title}</h3>
              <p className="text-lg font-bold text-deep-purple mb-1">{item.value}</p>
              <p className="text-sm text-text-secondary font-normal">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <HelpCircle size={24} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-deep-purple">Common Questions</h2>
          </div>

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
        </div>

        {/* Business Info / Trust Bar */}
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
                  <span className="font-bold text-deep-purple">9:00 AM - 6:00 PM</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary font-normal">Sunday</span>
                  <span className="font-bold text-red-400">Closed</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-8 border-t border-purple-100/30 flex items-center gap-3 text-text-secondary text-sm font-normal">
              <MapPin size={18} className="text-primary" />
              Jaitpur Mohalla, Pupri, Bihar 843320
            </div>
          </div>
        </div>
      </div>

      <AccountManagerModal 
        isOpen={isManagerModalOpen} 
        onClose={() => setIsManagerModalOpen(false)} 
      />
    </div>
  );
};

export default HelpCenter;
