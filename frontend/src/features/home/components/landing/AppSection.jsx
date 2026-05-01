import React, { useState, useEffect } from 'react';
import { Apple, PlayCircle, Users } from 'lucide-react';

const AppSection = () => {
  const [activeScreen, setActiveScreen] = useState(0);

  const screens = [
    {
      title: "Marketplace",
      content: (
        <div className="absolute inset-0 bg-primary/5 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6 pt-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10"></div>
            <div className="w-24 h-4 bg-gray-100 rounded-full"></div>
          </div>
          <div className="space-y-4">
            <div className="w-full h-24 bg-white rounded-2xl shadow-sm border border-gray-50 p-3">
              <div className="w-12 h-3 bg-primary/10 rounded mb-2"></div>
              <div className="w-full h-8 bg-gray-50 rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-square bg-white rounded-2xl shadow-sm border border-gray-50 flex flex-col p-2">
                <div className="w-full h-full bg-gray-50 rounded-lg mb-2"></div>
                <div className="w-1/2 h-2 bg-gray-100 rounded"></div>
              </div>
              <div className="aspect-square bg-white rounded-2xl shadow-sm border border-gray-50 flex flex-col p-2">
                <div className="w-full h-full bg-gray-50 rounded-lg mb-2"></div>
                <div className="w-1/2 h-2 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Tracking",
      content: (
        <div className="absolute inset-0 bg-accent-orange/5 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-8 pt-4">
            <div className="w-8 h-8 rounded-full bg-accent-orange/20"></div>
            <div className="w-32 h-4 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-6">
            <div className="w-full h-40 bg-white rounded-3xl shadow-md p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-accent-orange"></div>
              <div className="flex justify-between mb-4">
                <div className="w-16 h-3 bg-gray-100 rounded"></div>
                <div className="w-12 h-3 bg-accent-orange/20 rounded"></div>
              </div>
              <div className="space-y-3">
                <div className="w-full h-2 bg-gray-50 rounded"></div>
                <div className="w-3/4 h-2 bg-gray-50 rounded"></div>
              </div>
              <div className="mt-6 flex gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100"></div>
                <div className="w-8 h-8 rounded-lg bg-gray-100"></div>
              </div>
            </div>
            <div className="w-full h-20 bg-white/50 border border-dashed border-gray-200 rounded-2xl"></div>
          </div>
        </div>
      )
    },
    {
      title: "Orders",
      content: (
        <div className="absolute inset-0 bg-primary/5 p-6 flex flex-col">
          <div className="w-full h-10 bg-white rounded-xl shadow-sm mb-6 mt-4 flex items-center px-3">
            <div className="w-4 h-4 rounded bg-primary/20 mr-3"></div>
            <div className="w-24 h-3 bg-gray-100 rounded"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-16 bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-20 h-2.5 bg-gray-100 rounded"></div>
                  <div className="w-12 h-2 bg-gray-50 rounded"></div>
                </div>
                <div className="w-8 h-4 bg-primary/5 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % screens.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="pb-12 pt-0 bg-[#fafbff] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* Content Side */}
          <div className="space-y-10">
            <div>
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-[13px] font-semibold tracking-wider uppercase rounded-full mb-6">
                Better on Mobile
              </span>
              <h2 className="text-4xl md:text-6xl font-medium text-text-primary leading-[1.1] mb-8">
                School E-Mart App<br />
                <span className="text-primary"> - School shopping made easy</span>
              </h2>
              <p className="text-text-secondary text-lg leading-relaxed max-w-xl opacity-80">
                Get the School E-Mart app for easy school shopping and bulk ordering. Track orders, compare prices, and access exclusive deals — all from your smartphone.
              </p>
            </div>

            {/* Store Buttons */}
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center gap-3 bg-white border border-gray-100 px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                <img src="/assets/apple_logo.webp" alt="Apple" className="w-8 h-8 object-contain" />
                <div className="text-left">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">Download on the</p>
                  <p className="text-lg font-semibold text-[#1a1a1a] leading-none">App Store</p>
                </div>
              </button>

              <button className="flex items-center gap-3 bg-white border border-gray-100 px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                <img src="/assets/play_store.webp" alt="Play Store" className="w-8 h-8 object-contain" />
                <div className="text-left">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">Get it on</p>
                  <p className="text-lg font-semibold text-[#1a1a1a] leading-none">Google Play</p>
                </div>
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
                    <Users size={18} className="text-gray-400" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-text-secondary uppercase tracking-[0.15em] opacity-60">
                Join 50,000+ Educational Partners
              </p>
            </div>
          </div>

          {/* Visual Side */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Main Phone Mockup */}
            <div className="relative z-10 w-[240px] md:w-[260px] aspect-[1/2] bg-[#1a1a1a] rounded-[2.5rem] p-2 shadow-[0_50px_100px_-20px_rgba(79,70,229,0.15)] border-[4px] border-[#2a2a2a] overflow-hidden">
              <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
                {/* Screens Slider */}
                <div
                  className="flex transition-transform duration-700 ease-in-out h-full"
                  style={{ transform: `translateX(-${activeScreen * 100}%)` }}
                >
                  {screens.map((screen, idx) => (
                    <div key={idx} className="min-w-full h-full relative">
                      {screen.content}
                    </div>
                  ))}
                </div>

                {/* Status Bar Mockup */}
                <div className="absolute top-0 left-0 w-full h-6 flex justify-between items-center px-6 z-20">
                  <div className="w-12 h-1.5 bg-black/5 rounded-full"></div>
                  <div className="flex gap-1">
                    <div className="w-3 h-1 bg-black/5 rounded-full"></div>
                    <div className="w-1 h-1 bg-black/5 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slider Indicators */}
            <div className="absolute bottom-[-40px] right-24 flex gap-2">
              {screens.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeScreen === idx ? 'w-8 bg-primary' : 'w-2 bg-primary/20'}`}
                ></div>
              ))}
            </div>

            {/* Background Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square bg-primary/5 rounded-full blur-3xl -z-10"></div>

            {/* Side Phones (Ghost) */}
            <div className="absolute right-24 top-10 w-[220px] aspect-[1/2] bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] -z-10 opacity-30 rotate-[-10deg] hidden lg:block"></div>
            <div className="absolute -right-16 bottom-10 w-[220px] aspect-[1/2] bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] -z-10 opacity-30 rotate-[10deg] hidden lg:block"></div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AppSection;
