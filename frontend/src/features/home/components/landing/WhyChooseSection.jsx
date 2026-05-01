import React from 'react';

const WhyChooseSection = () => {
  const benefits = [
    {
      title: 'Verified Vendor Network',
      desc: 'Access thousands of verified school suppliers and vendors in India offering uniforms, books, furniture, and educational materials. Find trusted sellers for all your school supply needs in one place.'
    },
    {
      title: 'Transparent Bulk Pricing',
      desc: 'Get the best bulk prices for school supplies with clear and competitive pricing from multiple vendors. Compare quotes easily and choose the most cost-effective option for your institution.'
    },
    {
      title: 'School-Specific Catalog',
      desc: 'Browse school-specific product listings tailored to your institution’s requirements. Ensure parents and schools get exactly the right uniforms, books, and essentials as prescribed.'
    },
    {
      title: 'Secure Payments',
      desc: 'Enjoy safe and secure online payments for both schools and parents. Our trusted payment system ensures smooth transactions for uniforms, books, and bulk school orders.'
    },
    {
      title: 'Dedicated Support',
      desc: 'Get reliable customer support for schools and parents whenever you need help. Our team assists with orders, vendors, and platform usage to ensure a smooth experience.'
    },
    {
      title: 'Pan-India Delivery',
      desc: 'Order from anywhere with fast and reliable delivery across India. We connect schools and parents with vendors who deliver educational supplies nationwide.'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-medium text-text-primary mb-4">Why Choose School E-Mart</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">The digital backbone of modern educational infrastructure procurement.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-xl font-medium text-text-primary mb-3">{benefit.title}</h4>
              <p className="text-text-secondary text-[15px] leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
