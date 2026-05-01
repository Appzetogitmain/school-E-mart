import React from 'react';

const SEOContentSection = () => {
  return (
    <section className="py-16 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-text-primary mb-10 text-center leading-tight">
            India’s Trusted Platform for School Supplies, <br className="hidden md:block" /> 
            Uniforms & Bulk Orders
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-[15px] leading-relaxed text-text-secondary">
            {/* Column 1 – For Schools */}
            <div className="space-y-5">
              <h3 className="text-xl font-normal text-text-primary">Everything Schools Need in One Place</h3>
              <p className="font-light">
                School E-Mart helps schools find trusted suppliers for uniforms, furniture, books, and school supplies in India. Schools can easily explore options, compare prices, and manage bulk orders without dealing with multiple vendors.
              </p>
            </div>
            
            {/* Column 2 – Bulk & Vendor Network */}
            <div className="space-y-5">
              <h3 className="text-xl font-normal text-text-primary">Bulk School Supplies & Verified Vendors</h3>
              <p className="font-light">
                From classroom furniture and lab equipment to uniforms and textbooks, our platform connects schools with verified school vendors across India. Get the best value with bulk pricing, multiple quotations, and reliable suppliers — all in one place.
              </p>
            </div>
            
            {/* Column 3 – For Parents */}
            <div className="space-y-5">
              <h3 className="text-xl font-normal text-text-primary">Easy School Shopping for Parents</h3>
              <p className="font-light">
                Parents can buy school uniforms, books, and essentials online based on their child’s school and class. No more confusion — find exactly what your school requires and complete your school shopping quickly and easily.
              </p>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-50 text-center text-xs text-gray-400 uppercase tracking-[0.2em]">
            <p>Keywords: School Supplies India • B2B Educational Marketplace • School Uniforms Online • Institutional Furniture Procurement • Bulk School Supplies</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SEOContentSection;
