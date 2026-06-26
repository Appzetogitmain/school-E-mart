import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, ShoppingBag, Truck, XCircle, RefreshCw, CreditCard, MessageCircle, Loader2 } from 'lucide-react';
import { listFaqs } from '../../services/adminApi';
import { getErrorMessage } from '../../utils/apiHelpers';

const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border-b border-gray-100 last:border-0">
    <button
      onClick={onClick}
      className="w-full py-6 flex items-center justify-between gap-4 text-left group transition-all"
    >
      <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-primary' : 'text-text-primary group-hover:text-primary'}`}>
        {question}
      </span>
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-primary text-white rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
        <ChevronDown size={18} />
      </div>
    </button>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] pb-8 opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="text-text-secondary leading-relaxed whitespace-pre-line pr-12 font-normal">
        {answer}
      </div>
    </div>
  </div>
);

const FAQSection = ({ title, icon: Icon, items, openIndex, onToggle }) => (
  <div className="mb-12 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex items-center gap-4">
      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
        <Icon size={20} />
      </div>
      <h2 className="text-xl font-bold text-deep-purple">{title}</h2>
    </div>
    <div className="px-8">
      {items.map((item, index) => (
        <FAQItem
          key={index}
          {...item}
          isOpen={openIndex === index}
          onClick={() => onToggle(index)}
        />
      ))}
    </div>
  </div>
);

const SchoolFAQ = () => {
  const [activeSections, setActiveSections] = useState({
    orders: 0,
    shipping: -1,
    cancellation: -1,
    return: -1,
    payments: -1
  });

  const toggleSection = (section, index) => {
    setActiveSections(prev => ({
      ...prev,
      [section]: prev[section] === index ? -1 : index
    }));
  };

  const [faqData, setFaqData] = useState({
    orders: [],
    shipping: [],
    cancellation: [],
    return: [],
    payments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const categoryToSection = (category = '') => {
      const normalized = category.toLowerCase();
      if (normalized.includes('ship') || normalized.includes('deliver')) return 'shipping';
      if (normalized.includes('cancel')) return 'cancellation';
      if (normalized.includes('return') || normalized.includes('replace')) return 'return';
      if (normalized.includes('pay') || normalized.includes('gst')) return 'payments';
      return 'orders';
    };

    listFaqs({ limit: 100 })
      .then(({ data }) => {
        if (cancelled) return;
        const grouped = {
          orders: [],
          shipping: [],
          cancellation: [],
          return: [],
          payments: [],
        };
        (data || []).forEach((faq) => {
          const section = categoryToSection(faq.category);
          grouped[section].push({ question: faq.question, answer: faq.answer });
        });
        setFaqData(grouped);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load FAQs'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasFaqs = useMemo(
    () => Object.values(faqData).some((items) => items.length > 0),
    [faqData]
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 1. Hero / Header */}
      <section className="bg-primary pt-12 pb-24 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-orange/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/10">
            <HelpCircle size={16} className="text-accent-orange" />
            <span className="text-[11px] font-bold uppercase tracking-widest">Help Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">FAQs</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Everything you need to know about orders, shipping, and procurement on schoolEmart.
          </p>

          <div className="mt-12 relative max-w-xl mx-auto group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search for questions (e.g. tracking, refund, bulk orders)"
              className="w-full pl-14 pr-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* 2. FAQ Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={36} className="animate-spin text-primary" />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-16">{error}</p>
          ) : !hasFaqs ? (
            <p className="text-center text-gray-400 py-16">No FAQs available yet.</p>
          ) : (
          <>
          <FAQSection
            title="Orders & Tracking"
            icon={ShoppingBag}
            items={faqData.orders}
            openIndex={activeSections.orders}
            onToggle={(i) => toggleSection('orders', i)}
          />
          <FAQSection
            title="Shipping & Delivery"
            icon={Truck}
            items={faqData.shipping}
            openIndex={activeSections.shipping}
            onToggle={(i) => toggleSection('shipping', i)}
          />
          <FAQSection
            title="Cancellations"
            icon={XCircle}
            items={faqData.cancellation}
            openIndex={activeSections.cancellation}
            onToggle={(i) => toggleSection('cancellation', i)}
          />
          <FAQSection
            title="Return & Replacement"
            icon={RefreshCw}
            items={faqData.return}
            openIndex={activeSections.return}
            onToggle={(i) => toggleSection('return', i)}
          />
          <FAQSection
            title="Payments & GST"
            icon={CreditCard}
            items={faqData.payments}
            openIndex={activeSections.payments}
            onToggle={(i) => toggleSection('payments', i)}
          />
          </>
          )}

          {/* 3. Support CTA */}
          <div className="mt-20 bg-deep-purple p-10 rounded-[2.5rem] text-center relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
              <p className="text-white/60 mb-10 max-w-md mx-auto">
                Our procurement experts are here to help you with your institutional needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button className="px-10 py-4 bg-accent-orange text-deep-purple font-bold rounded-2xl hover:bg-accent-gold transition-all flex items-center gap-3">
                  <MessageCircle size={20} /> Contact Support
                </button>
                <div className="text-white/80 font-medium">
                  Or email us at <a href="mailto:support@schoolEmart.com" className="text-white underline hover:text-accent-orange transition-colors">support@schoolEmart.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SchoolFAQ;
