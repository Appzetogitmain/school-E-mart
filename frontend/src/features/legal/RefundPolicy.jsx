import React from 'react';
import { RefreshCcw, ShieldCheck, Clock, AlertCircle, FileText } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <div className="w-full min-h-screen bg-[#fcfcfd] pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <RefreshCcw size={32} />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-deep-purple mb-6 tracking-tight">Refund & Return Policy</h1>
          <p className="text-text-secondary text-lg font-normal max-w-2xl mx-auto">
            Our goal is to ensure institutional and parental satisfaction. Here's how we handle returns and refunds.
          </p>
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-deep-purple mb-4">Eligible Items</h3>
            <ul className="space-y-3 text-text-secondary font-normal text-sm">
              <li className="flex gap-2"><span>•</span> Standard school supplies (Books, Stationery)</li>
              <li className="flex gap-2"><span>•</span> Non-customized uniforms with tags</li>
              <li className="flex gap-2"><span>•</span> Defective or damaged educational tech</li>
              <li className="flex gap-2"><span>•</span> Incorrect items delivered by vendor</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-orange-50 text-accent-orange rounded-xl flex items-center justify-center mb-6">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-deep-purple mb-4">Non-Refundable</h3>
            <ul className="space-y-3 text-text-secondary font-normal text-sm">
              <li className="flex gap-2"><span>•</span> Customized institutional uniforms</li>
              <li className="flex gap-2"><span>•</span> Personalized school kits with names</li>
              <li className="flex gap-2"><span>•</span> Items without original packaging</li>
              <li className="flex gap-2"><span>•</span> Software licenses once activated</li>
            </ul>
          </div>
        </div>

        {/* Timeline/Process */}
        <div className="bg-primary p-8 md:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden mb-16">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="text-3xl font-black text-accent-orange mb-2">07</div>
              <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Days</p>
              <p className="text-xs font-normal">Return window for eligible products after delivery.</p>
            </div>
            <div className="text-center border-y md:border-y-0 md:border-x border-white/10 py-6 md:py-0">
              <div className="text-3xl font-black text-accent-orange mb-2">48</div>
              <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Hours</p>
              <p className="text-xs font-normal">QC verification once the item reaches our warehouse.</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-accent-orange mb-2">5-7</div>
              <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Work Days</p>
              <p className="text-xs font-normal">For the refund to reflect in your source account.</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        </div>

        {/* Detailed Policy Sections */}
        <div className="space-y-10">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-deep-purple mb-4 flex items-center gap-3">
              <Clock size={20} className="text-primary" />
              Cancellation Policy
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed font-normal">
              Orders can be cancelled free of charge before they are 'Packed' by the vendor. If an order is cancelled after it is packed or shipped, shipping and handling charges (plus associated GST) will be deducted from the refund amount.
            </p>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-deep-purple mb-4 flex items-center gap-3">
              <FileText size={20} className="text-primary" />
              How to Initiate a Return?
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed font-normal mb-6">
              To start a return, please visit your 'My Orders' section, select the order, and click on 'Initiate Return'. Alternatively, you can contact our Help Center or your dedicated Account Manager.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="px-6 py-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-bold text-deep-purple">
                Order Dashboard
              </div>
              <div className="px-6 py-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-bold text-deep-purple">
                Help Center Support
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-16 text-center pt-8 border-t border-gray-100">
          <p className="text-[11px] text-text-secondary font-bold uppercase tracking-widest mb-2">School E-Mart Legal</p>
          <p className="text-xs text-text-secondary/60 font-normal italic">Last updated: October 2026. Policies are subject to change without prior notice.</p>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
