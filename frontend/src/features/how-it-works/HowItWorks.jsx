import React, { useState, useEffect } from 'react';
import {
  Building2,
  Store,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Package,
  Truck,
  CreditCard,
  Search,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeCheck,
  Star,
  Users,
  Wallet,
  Tag,
  Zap,
  BarChart3,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import VendorContactModal from '../../components/shared/VendorContactModal';
import { listFaqs } from '../../services/adminApi';
import { getErrorMessage } from '../../utils/apiHelpers';

const StepCard = ({ number, title, desc, icon: Icon, image, color = "primary" }) => (
  <div className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full relative overflow-hidden">
    {/* Background Decorative Element */}
    <div className={`absolute -top-10 -right-10 w-32 h-32 ${color === 'primary' ? 'bg-primary/5' : 'bg-accent-orange/5'} rounded-full blur-3xl group-hover:bg-opacity-20 transition-all`}></div>

    {/* Header Row: Number + Title */}
    <div className="flex items-center gap-4 mb-8 relative z-10">
      <div className="w-10 h-10 rounded-full bg-accent-orange text-deep-purple flex items-center justify-center text-[13px] font-black shadow-lg shadow-purple-200/50">
        {number}
      </div>
      <h4 className="text-[17px] font-semibold text-deep-purple leading-tight">{title}</h4>
    </div>

    {/* Center Row: Big Image Container */}
    <div className="flex-1 flex items-center justify-center mb-8 bg-gray-50/50 rounded-[2rem] p-6 relative z-10 overflow-hidden min-h-[180px]">
      {image ? (
        <img src={image} alt={title} className="w-full h-auto max-h-[140px] object-contain transform group-hover:scale-110 transition-transform duration-700" />
      ) : (
        <div className={`w-16 h-16 rounded-2xl ${color === 'primary' ? 'bg-primary/5 text-primary' : 'bg-accent-orange/5 text-accent-orange'} flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon size={32} />
        </div>
      )}
    </div>

    {/* Bottom Row: Description */}
    <p className="text-[13px] text-text-secondary leading-relaxed font-normal text-center px-2 relative z-10">
      {desc}
    </p>
  </div>
);

const FeatureItem = ({ icon: Icon, title, desc, colorClass }) => (
  <div className="flex items-start gap-4 p-6 rounded-3xl bg-white border border-gray-50 shadow-sm group hover:shadow-md transition-all">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
      <Icon size={22} />
    </div>
    <div>
      <h5 className="text-sm font-semibold text-text-primary mb-1">{title}</h5>
      <p className="text-[11px] text-text-secondary leading-relaxed font-normal">{desc}</p>
    </div>
  </div>
);

const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border border-gray-100 rounded-2xl overflow-hidden mb-4 transition-all">
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-6 text-left transition-colors ${isOpen ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}
    >
      <span className="font-medium text-deep-purple">{question}</span>
      {isOpen ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-gray-400" />}
    </button>
    {isOpen && (
      <div className="p-6 pt-0 bg-gray-50 text-text-secondary text-sm leading-relaxed font-normal animate-in fade-in slide-in-from-top-1">
        {answer}
      </div>
    )}
  </div>
);

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState('school');
  const [openFAQ, setOpenFAQ] = useState(0);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero section (around 600px)
      if (window.scrollY > 600) {
        setShowStickyCTA(true);
      } else {
        setShowStickyCTA(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [schoolFaqs, setSchoolFaqs] = useState([]);
  const [vendorFaqs, setVendorFaqs] = useState([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    listFaqs({ limit: 100 })
      .then(({ data }) => {
        if (cancelled) return;
        const school = [];
        const vendor = [];
        (data || []).forEach((faq) => {
          const item = { question: faq.question, answer: faq.answer };
          const cat = (faq.category || '').toLowerCase();
          if (cat.includes('vendor') || cat.includes('seller')) {
            vendor.push(item);
          } else {
            school.push(item);
          }
        });
        setSchoolFaqs(school);
        setVendorFaqs(vendor);
      })
      .catch(() => {
        if (!cancelled) {
          setSchoolFaqs([]);
          setVendorFaqs([]);
        }
      })
      .finally(() => {
        if (!cancelled) setFaqsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const faqs = activeTab === 'school' ? schoolFaqs : vendorFaqs;

  return (
    <div className="w-full bg-[#fcfcfd] text-text-primary">

      {/* 1. Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 text-primary text-[11px] font-semibold uppercase tracking-widest rounded-full mb-8">
                <Zap size={14} className="text-accent-orange" />
                Simplified Procurement
              </div>
              <h1 className="text-4xl lg:text-6xl font-semibold text-primary leading-[1.15] mb-6 tracking-tight">
                How to Buy and <br />Sell on <br />
                <span className="text-accent-orange">School</span> E-Mart
              </h1>
              <p className="text-lg text-text-secondary mb-10 leading-relaxed max-w-md font-normal">
                One platform for schools to buy and vendors to sell. It is easy, fast, and secure for everyone.
              </p>

              {/* Persona Switcher */}
              <div className="flex p-1.5 bg-gray-100 rounded-3xl w-fit">
                <button
                  onClick={() => setActiveTab('school')}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-300 font-semibold text-sm ${activeTab === 'school' ? 'bg-white text-primary shadow-xl scale-105' : 'text-text-secondary hover:text-primary'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'school' ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-400'}`}>
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div className="text-xs">For Schools</div>
                    <div className="text-[10px] opacity-60 font-medium">Buying Made Simple</div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('vendor')}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-300 font-semibold text-sm ${activeTab === 'vendor' ? 'bg-white text-primary shadow-xl scale-105' : 'text-text-secondary hover:text-primary'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'vendor' ? 'bg-accent-orange/10 text-accent-orange' : 'bg-gray-200 text-gray-400'}`}>
                    <Store size={18} />
                  </div>
                  <div>
                    <div className="text-xs">For Vendors</div>
                    <div className="text-[10px] opacity-60 font-medium">Selling Made Easy</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Hero Visual - Balanced Size */}
            <div className="relative">
              <div className="w-full relative group transform lg:translate-x-4">
                <img
                  src="/assets/How_works_hero.png"
                  alt="Marketplace Workflow"
                  className="w-full h-auto object-contain transform group-hover:scale-[1.03] transition-transform duration-700"
                />
                {/* Subtle Floating Decorative Elements */}
                <div className="absolute top-[12%] right-[8%] p-4 bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl animate-float border border-white/50 z-20">
                  <ShieldCheck size={28} className="text-accent-green" />
                </div>
                <div className="absolute bottom-[18%] left-[2%] p-4 bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl animate-float border border-white/50 z-20" style={{ animationDelay: '1.2s' }}>
                  <Truck size={28} className="text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Journey Section */}
      <section className="py-12 bg-[#fcfcfd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className={`text-[11px] font-bold uppercase tracking-[0.3em] mb-4 ${activeTab === 'school' ? 'text-primary' : 'text-accent-orange'}`}>
              Your Journey as a {activeTab === 'school' ? 'School' : 'Vendor'}
            </div>
            <h2 className="text-4xl md:text-5xl font-medium text-primary tracking-tight">
              {activeTab === 'school' ? '6 Easy Steps for Schools' : '6 Easy Steps for Vendors'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
            {activeTab === 'school' ? (
              <>
                <StepCard number="01" image="/assets/how_works_schools/create_account.png" title="Create Account" desc="Create your school account on School E-Mart easily to start buying quality products for your institution." />
                <StepCard number="02" image="/assets/how_works_schools/browse.png" title="Browse and Select" desc="Browse thousands of products from verified vendors. Check ratings and read reviews before you make a choice." />
                <StepCard number="03" image="/assets/how_works_schools/buy_pay.png" title="Buy and Pay Securely" desc="Purchase products and make payments directly to the platform. Your money is safe in our secured nodal account." />
                <StepCard number="04" image="/assets/how_works_schools/order_delivery.png" title="Order and Delivery" desc="Vendors process your order and deliver it directly to your school campus within the promised time." />
                <StepCard number="05" image="/assets/how_works_schools/check.png" title="Check and Confirm" desc="Verify the products at the time of delivery. If everything is right and undamaged, confirm the delivery on SSM." />
                <StepCard number="06" image="/assets/how_works_schools/return.png" title="Payment and Returns" desc="We pay the vendor only after your confirmation. Easy returns if the product is damaged or wrong." />
              </>
            ) : (
              <>
                <StepCard number="01" color="orange" image="/assets/how_it_works_vendors/register_seller.png" title="Register as Vendor" desc="Register on School E-Mart easily and start selling your products to schools online." />
                <StepCard number="02" color="orange" image="/assets/how_it_works_vendors/build_catalogue.png" title="Build Your Catalogue" desc="Once your account is ready, list your products and create your online shop easily." />
                <StepCard number="03" color="orange" image="/assets/how_it_works_vendors/schools_buy.png" title="Schools buy your Products" desc="Schools can see your product reviews, ratings, and buy from you by paying on the platform." />
                <StepCard number="04" color="orange" image="/assets/how_it_works_vendors/order_alerts.png" title="Get Order Alerts" desc="We will send you an email for every new order. You can manage everything from your Vendor Dashboard." />
                <StepCard number="05" color="orange" image="/assets/how_it_works_vendors/pack_deliver.png" title="Pack and Deliver" desc="After getting a new order, simply pack your products and deliver them to the school." />
                <StepCard number="06" color="orange" image="/assets/how_it_works_vendors/receive_payments.png" title="Receive Payments" desc="After delivery, upload proof of delivery. Your money will be sent to your bank account within 5 days." />
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2.5 Pricing Section (Vendor Only) */}
      {activeTab === 'vendor' && (
        <section className="py-10 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="text-accent-orange text-[11px] font-bold uppercase tracking-[0.3em] mb-4">Pricing & Fees</div>
              <h2 className="text-3xl md:text-4xl font-medium text-primary tracking-tight">Transparent Selling, Better Earnings</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              {/* Fee Breakdown */}
              <div className="space-y-10">
                <div>
                  <h3 className="text-2xl font-semibold text-primary mb-6">What are the fees?</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-8">
                    Once an order is successfully delivered, we make small deductions from the price to cover platform costs. No hidden charges.
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    { title: "Selling Fee (Commission)", desc: "A small percentage of the item price. This fee depends on the type of product you sell.", icon: Tag, bg: 'bg-blue-50', color: 'text-primary' },
                    { title: "Collection Fee", desc: "A fixed 3% fee on the total price (Selling Price + Shipping).", icon: Wallet, bg: 'bg-orange-50', color: 'text-accent-orange' },
                    { title: "GST", desc: "Government tax (18%) is applied on the platform fees only.", icon: ShieldCheck, bg: 'bg-green-50', color: 'text-accent-green' }
                  ].map((fee, i) => (
                    <div key={i} className="flex gap-5 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 group hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className={`w-14 h-14 ${fee.bg} ${fee.color} rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                        <fee.icon size={24} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary mb-2">{fee.title}</h4>
                        <p className="text-xs text-text-secondary leading-relaxed font-normal">{fee.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Calculation Example */}
              <div className="bg-primary rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-semibold mb-4">Example: How much you get</h3>
                  <p className="text-white/60 text-sm mb-12 font-normal leading-relaxed">Let's see what you earn if you sell a "Table & Chair" set for ₹1,000:</p>

                  <div className="space-y-5">
                    <div className="flex justify-between py-4 border-b border-white/10">
                      <span className="text-sm opacity-60">Product Price</span>
                      <span className="text-base font-medium tracking-wide">₹ 1,000.00</span>
                    </div>
                    <div className="flex justify-between py-4 border-b border-white/10">
                      <span className="text-sm opacity-60">Selling Fee (0% for all categories)</span>
                      <span className="text-base font-medium tracking-wide text-white/40">- ₹ 0.00</span>
                    </div>
                    <div className="flex justify-between py-4 border-b border-white/10">
                      <span className="text-sm opacity-60">Collection Fee (3%)</span>
                      <span className="text-base font-medium tracking-wide">- ₹ 30.00</span>
                    </div>
                    <div className="flex justify-between py-4 border-b border-white/10">
                      <span className="text-sm opacity-60">GST on Fees (18%)</span>
                      <span className="text-base font-medium tracking-wide">- ₹ 5.40</span>
                    </div>

                    <div className="mt-10 p-8 bg-white/5 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="text-center md:text-left">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-accent-orange mb-1">Settlement Value</div>
                        <div className="text-sm opacity-60 font-normal">Amount credited to your bank</div>
                      </div>
                      <div className="text-3xl font-black text-accent-orange tracking-tight">₹ 964.60</div>
                    </div>
                  </div>

                  <p className="mt-8 text-[11px] opacity-40 italic text-center font-normal">
                    *This is an example. Final amount depends on your product category and price.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Features Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-4xl font-medium text-primary mb-6">
              Why {activeTab === 'school' ? 'Schools Love' : 'Vendors Choose'} School E-Mart
            </h2>
            <div className="w-20 h-1 bg-accent-orange mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activeTab === 'school' ? (
              <>
                <FeatureItem icon={ShieldCheck} colorClass="bg-blue-50 text-primary" title="Verified Vendors" desc="Only manufacturers and distributors with verified credentials can sell on the platform." />
                <FeatureItem icon={TrendingUp} colorClass="bg-green-50 text-accent-green" title="Competitive Pricing" desc="Direct factory sourcing ensures you get the best possible prices for bulk orders." />
                <FeatureItem icon={Package} colorClass="bg-orange-50 text-accent-orange" title="Bulk Ordering" desc="Designed specifically for institutional needs - from 100 to 100,000 units." />
                <FeatureItem icon={Layers} colorClass="bg-purple-50 text-purple-600" title="Transparent Procurement" desc="Complete audit trail of quotes, approvals, and payments for institutional compliance." />
                <FeatureItem icon={Zap} colorClass="bg-yellow-50 text-yellow-600" title="Fast Delivery" desc="Optimized logistics network for timely doorstep delivery to your institution." />
                <FeatureItem icon={Search} colorClass="bg-gray-50 text-gray-600" title="Order Tracking" desc="Real-time visibility into every stage of your procurement lifecycle." />
              </>
            ) : (
              <>
                <FeatureItem icon={ShieldCheck} colorClass="bg-blue-50 text-primary" title="Genuine Orders" desc="Receive prepaid and verified orders from established educational institutions." />
                <FeatureItem icon={Wallet} colorClass="bg-green-50 text-accent-green" title="Fast Payments" desc="Get paid within 3-5 days of successful delivery and satisfaction confirmation." />
                <FeatureItem icon={TrendingUp} colorClass="bg-orange-50 text-accent-orange" title="Low Commission" desc="Pay minimal platform fees only when you make a sale. No hidden costs." />
                <FeatureItem icon={BarChart3} colorClass="bg-purple-50 text-purple-600" title="Sales Insights" desc="Access detailed analytics on your product performance and market demand." />
                <FeatureItem icon={Zap} colorClass="bg-yellow-50 text-yellow-600" title="Free Promotions" desc="We market your high-quality products to hundreds of schools across the country." />
                <FeatureItem icon={Users} colorClass="bg-gray-50 text-gray-600" title="Training Support" desc="Get access to resources and webinars to help you scale your institutional sales." />
              </>
            )}
          </div>
        </div>
      </section>


      {/* 6. Shared Trust Section */}
      <section className="py-12 bg-primary text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            <div>
              <div className="text-5xl font-semibold mb-4">500<span className="text-accent-orange">+</span></div>
              <div className="text-xs font-semibold uppercase tracking-widest opacity-60">Schools Trust Us</div>
            </div>
            <div>
              <div className="text-5xl font-semibold mb-4">1,200<span className="text-accent-green">+</span></div>
              <div className="text-xs font-semibold uppercase tracking-widest opacity-60">Verified Vendors</div>
            </div>
            <div>
              <div className="text-5xl font-semibold mb-4">50K<span className="text-accent-orange">+</span></div>
              <div className="text-xs font-semibold uppercase tracking-widest opacity-60">Products Listed</div>
            </div>
            <div>
              <div className="text-5xl font-semibold mb-4">95<span className="text-accent-green">%</span></div>
              <div className="text-xs font-semibold uppercase tracking-widest opacity-60">Repeat Procurement</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-medium text-primary mb-6 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-text-secondary font-normal">Everything you need to know about the School E-Mart ecosystem.</p>
          </div>

          <div className="space-y-4">
            {faqsLoading ? (
              <p className="text-center text-gray-400 py-8">Loading FAQs…</p>
            ) : faqs.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No FAQs available yet.</p>
            ) : (
            faqs.map((faq, idx) => (
              <FAQItem
                key={idx}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === idx}
                onClick={() => setOpenFAQ(openFAQ === idx ? -1 : idx)}
              />
            ))
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-10 bg-white px-4">
        <div className="max-w-7xl mx-auto bg-gray-50 rounded-[4rem] p-12 md:p-24 text-center border border-gray-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-medium text-primary mb-10 tracking-tight">Ready to get started?</h2>
            <p className="text-text-secondary mb-12 max-w-xl mx-auto font-normal">
              Join thousands of schools and vendors already growing with School E-Mart. Free onboarding for verified educational partners.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button
                onClick={() => navigate(ROUTES.REGISTER)}
                className="px-12 py-5 bg-accent-orange text-deep-purple rounded-2xl font-semibold hover:shadow-2xl hover:bg-accent-gold transition-all active:scale-95 text-lg"
              >
                Register Your School
              </button>
              <button
                onClick={() => setIsVendorModalOpen(true)}
                className="px-12 py-5 border-2 border-primary text-primary rounded-2xl font-semibold hover:shadow-lg transition-all active:scale-95 text-lg"
              >
                Register Your Business
              </button>
            </div>

            {/* Login Option */}
            <div className="mt-12 pt-8 border-t border-gray-200/60">
              <p className="text-text-secondary text-sm font-normal">
                Already a registered partner?
                <button
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="ml-2 text-primary font-semibold hover:underline transition-all"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}} />

      {/* Floating Sticky CTA */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform ${showStickyCTA ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} w-[calc(100%-2rem)] max-w-fit`}>
        <div className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-full p-2 flex items-center gap-3 pr-4">
          <div className="flex gap-2 p-1">
            <button
              onClick={() => navigate(ROUTES.REGISTER)}
              className="px-8 py-3 bg-accent-orange text-deep-purple rounded-full text-[15px] font-semibold hover:shadow-lg hover:scale-105 transition-all whitespace-nowrap active:scale-95"
            >
              Register School
            </button>
            <button
              onClick={() => setIsVendorModalOpen(true)}
              className="px-8 py-3 border border-primary text-primary rounded-full text-[15px] font-semibold hover:bg-primary/5 transition-all whitespace-nowrap active:scale-95"
            >
              Register Business
            </button>
          </div>
          <div className="hidden md:flex flex-col items-start pr-4 border-l border-gray-200 pl-4">
            <span className="text-[9px] font-black uppercase tracking-tighter text-primary">Join 500+ Institutions</span>
            <span className="text-[10px] text-text-secondary font-medium whitespace-nowrap">Start your journey today</span>
          </div>
        </div>
      </div>

      <VendorContactModal 
        isOpen={isVendorModalOpen} 
        onClose={() => setIsVendorModalOpen(false)} 
      />
    </div>
  );
};

export default HowItWorks;
