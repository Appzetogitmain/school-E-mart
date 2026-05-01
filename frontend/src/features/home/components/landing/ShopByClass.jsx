import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../constants/routes';

const ShopByClass = () => {
  const navigate = useNavigate();

  const classes = [
    { id: 'nursery', name: 'Nursery', group: 'Pre-Primary' },
    { id: 'lkg', name: 'LKG', group: 'Pre-Primary' },
    { id: 'ukg', name: 'UKG', group: 'Pre-Primary' },
    { id: '1', name: 'Class 1', group: 'Primary' },
    { id: '2', name: 'Class 2', group: 'Primary' },
    { id: '3', name: 'Class 3', group: 'Primary' },
    { id: '4', name: 'Class 4', group: 'Primary' },
    { id: '5', name: 'Class 5', group: 'Primary' },
    { id: '6', name: 'Class 6', group: 'Middle' },
    { id: '7', name: 'Class 7', group: 'Middle' },
    { id: '8', name: 'Class 8', group: 'Middle' },
    { id: '9', name: 'Class 9', group: 'Secondary' },
    { id: '10', name: 'Class 10', group: 'Secondary' },
    { id: '11', name: 'Class 11', group: 'Sr. Secondary' },
    { id: '12', name: 'Class 12', group: 'Sr. Secondary' },
  ];

  return (
    <section className="py-20 bg-[#fafbff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-medium text-text-primary mb-4">Shop By Class</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Quickly find uniforms, books, and essentials tailored to your child's specific grade.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {classes.map((cls) => (
            <div
              key={cls.id}
              onClick={() => navigate(`${ROUTES.SHOP_BY_GRADE}?class=${cls.id}`)}
              className="group relative bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/30 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Decorative Background Blob */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <span className="text-lg font-semibold">{cls.id.toUpperCase()}</span>
              </div>
              
              <h4 className="text-base font-medium text-text-primary mb-1">{cls.name}</h4>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{cls.group}</span>
              
              <div className="mt-4 h-1 w-0 bg-primary group-hover:w-full transition-all duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByClass;
