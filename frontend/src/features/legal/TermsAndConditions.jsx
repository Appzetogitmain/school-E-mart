import React from 'react';
import { ShieldCheck } from 'lucide-react';

const TermsAndConditions = () => {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing and using School E-Mart (the 'Platform'), you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, do not use the Platform. These terms apply to all visitors, users, and others who access or use the Service."
    },
    {
      title: "2. User Accounts",
      content: "When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service."
    },
    {
      title: "3. Intellectual Property",
      content: "The Service and its original content, features, and functionality are and will remain the exclusive property of School E-Mart and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of School E-Mart."
    },
    {
      title: "4. Termination",
      content: "We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All provisions of the Terms which by their nature should survive termination shall survive termination, including ownership provisions, warranty disclaimers, and limitations of liability."
    },
    {
      title: "5. Limitation of Liability",
      content: "In no event shall School E-Mart, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-primary/5 pt-16 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full mb-6 shadow-sm border border-primary/10">
            <ShieldCheck size={16} className="text-primary" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Legal Documentation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">Terms & Conditions</h1>
          <p className="text-gray-500 text-lg max-w-2xl font-normal leading-relaxed">
            Last updated: May 01, 2024. Please read these terms and conditions carefully before using our service.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-12 text-lg font-normal leading-relaxed">
              Welcome to School E-Mart. These terms and conditions outline the rules and regulations for the use of School E-Mart's Website and Mobile Application.
            </p>

            <div className="space-y-16">
              {sections.map((section, index) => (
                <div key={index} className="flex flex-col gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  <p className="text-gray-600 leading-relaxed font-normal">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-20 p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h3>
              <p className="text-gray-600 font-normal mb-0">
                If you have any questions about these Terms, please contact us at:
                <br />
                <span className="font-bold text-primary">legal@schoolemart.com</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsAndConditions;
