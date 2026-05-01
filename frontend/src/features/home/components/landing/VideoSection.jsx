import React from 'react';
import { Play } from 'lucide-react';

const VideoSection = () => {
  const points = [
    { title: 'Centralized school supply management dashboard', desc: 'Manage uniforms, books, and bulk school orders in one place.' },
    { title: 'Compare prices from multiple school vendors', desc: 'Get the best deals on bulk school supplies in India.' },
    { title: 'Secure online payments for schools and parents', desc: 'Safe and seamless transactions for all school-related purchases.' },
    { title: 'Real-time order tracking across India', desc: 'Track deliveries of uniforms, books, and supplies with ease.' }
  ];

  return (
    <section className="py-20 bg-deep-purple text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-medium mb-8 leading-tight tracking-tight">
              Transforming School Supplies & Bulk Ordering in India
            </h2>
            <p className="text-white/70 text-lg mb-10 leading-relaxed font-light">
              Discover how School E-Mart simplifies school shopping and bulk orders for schools and parents across India — helping reduce costs, save time, and ensure reliable access to uniforms, books, and educational materials.
            </p>
            <ul className="space-y-8">
              {points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-accent-orange/20 flex items-center justify-center text-accent-orange shrink-0">
                    <div className="w-2 h-2 rounded-full bg-accent-orange"></div>
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-[16px] mb-1">{point.title}</h4>
                    <p className="text-white/60 text-sm font-normal">{point.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="relative group">
              {/* YouTube Placeholder with Overlay */}
              <div className="aspect-video bg-black/40 rounded-[2.5rem] overflow-hidden border-8 border-white/5 relative flex items-center justify-center shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1523050853063-880c69349c5b?auto=format&fit=crop&q=80&w=1200"
                  alt="Video Placeholder"
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
                />
                <button className="relative z-10 w-24 h-24 bg-accent-orange text-deep-purple rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl group-hover:bg-white group-hover:text-primary">
                  <Play size={40} fill="currentColor" />
                </button>
              </div>

              {/* Visual elements */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-accent-orange/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
              <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Caption under video */}
            <p className="mt-8 text-center text-white/50 text-[15px] font-normal italic">
              “See how schools and parents across India use School E-Mart for easy and reliable school shopping.”
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
