import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const HowItWorksSection = () => {
  const parentSteps = [
    'Find your school',
    'Browse specific kits & books chosen by your school - all in one place',
    'Secure checkout',
    'Doorstep delivery',
  ];

  const schoolSteps = [
    'Register institution',
    'Upload requirements',
    'Receive bulk quotes from verified vendors',
    'Approve & manage delivery',
  ];

  return (
    <section className="pt-8 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-medium text-text-primary mb-4">How School E-Mart Works</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">Seamless procurement experience tailored for both educational institutions and parents.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* For Parents */}
          <div className="bg-gray-50 rounded-3xl p-10 border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-medium text-primary mb-8 flex items-center gap-3">
              For Parents
            </h3>
            <div className="space-y-6">
              {parentSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-[17px] text-text-primary font-light">{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 p-6 bg-white rounded-2xl border border-gray-100">
              <p className="text-sm text-text-secondary italic">"Finally, a single place to get everything my child needs without hunting through multiple shops."</p>
            </div>
          </div>

          {/* For Schools */}
          <div className="bg-soft-lavender/30 rounded-3xl p-10 border border-purple-100 shadow-sm">
            <h3 className="text-2xl font-medium text-deep-purple mb-8 flex items-center gap-3">
              For Schools
            </h3>
            <div className="space-y-6">
              {schoolSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white border border-purple-200 flex items-center justify-center text-sm font-medium text-deep-purple shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-[17px] text-text-primary font-light">{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 p-6 bg-white rounded-2xl border border-purple-100">
              <p className="text-sm text-text-secondary italic">"Streamlined our annual procurement process from weeks to just a few clicks."</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
