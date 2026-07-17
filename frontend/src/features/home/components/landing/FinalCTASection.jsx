import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../constants/routes';

const FinalCTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-primary to-deep-purple p-12 md:p-20 text-center shadow-2xl">
        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-orange/5 rounded-full translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-medium text-white mb-6">Ready to Get Started?</h2>
          <p className="text-white/70 text-lg mb-12 max-w-2xl mx-auto">
            Join thousands of schools and parents already using School E-Mart to simplify their educational needs.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => navigate('/school/login')}
              className="w-full sm:w-auto px-10 py-4 bg-white text-primary font-normal rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              School Portal <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => navigate('/user/login')}
              className="w-full sm:w-auto px-10 py-4 bg-golden-yellow text-deep-purple font-normal rounded-2xl hover:bg-accent-gold transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Parent Portal <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
