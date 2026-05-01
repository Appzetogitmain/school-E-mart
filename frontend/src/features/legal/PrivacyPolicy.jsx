import React from 'react';
import { Shield, Eye, Database, Lock, UserCheck } from 'lucide-react';

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: <Database className="text-accent-orange" size={24} />,
      title: "Information Collection",
      content: "We collect several different types of information for various purposes to provide and improve our Service to you. This includes Personal Data (email address, first and last name, phone number) and Usage Data (how the service is accessed and used)."
    },
    {
      icon: <Eye className="text-accent-orange" size={24} />,
      title: "Use of Data",
      content: "School E-Mart uses the collected data for various purposes: to provide and maintain our Service, to notify you about changes, to allow you to participate in interactive features, and to provide customer support and analysis."
    },
    {
      icon: <Lock className="text-accent-orange" size={24} />,
      title: "Data Security",
      content: "The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security."
    },
    {
      icon: <Shield className="text-accent-orange" size={24} />,
      title: "Service Providers",
      content: "We may employ third party companies and individuals to facilitate our Service ('Service Providers'), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used."
    },
    {
      icon: <UserCheck className="text-accent-orange" size={24} />,
      title: "Your Data Rights",
      content: "School E-Mart aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data. If you wish to be informed what Personal Data we hold about you and if you want it to be removed from our systems, please contact us."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-accent-orange/5 pt-16 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-orange/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full mb-6 shadow-sm border border-accent-orange/10">
            <Shield size={16} className="text-accent-orange" />
            <span className="text-[11px] font-bold text-accent-orange uppercase tracking-widest">Privacy First</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">Privacy Policy</h1>
          <p className="text-gray-500 text-lg max-w-2xl font-normal leading-relaxed">
            Last updated: May 01, 2024. Your privacy is critically important to us. This policy explains how we handle your data.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-12 text-lg font-normal leading-relaxed">
              At School E-Mart, we are committed to protecting the privacy and security of our users' personal information. This Privacy Policy describes how we collect, use, and share information.
            </p>

            <div className="space-y-16">
              {sections.map((section, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-14 h-14 bg-accent-orange/10 rounded-2xl flex items-center justify-center shrink-0">
                    {section.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                    <p className="text-gray-600 leading-relaxed font-normal">
                      {section.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-20 p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Privacy Concerns?</h3>
              <p className="text-gray-600 font-normal mb-0">
                If you have any questions about this Privacy Policy, please reach out to our Data Protection Officer:
                <br />
                <span className="font-bold text-accent-orange">privacy@schoolemart.com</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
