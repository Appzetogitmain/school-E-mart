import React from 'react';
import HeroSection from './components/landing/HeroSection';
import HowItWorksSection from './components/landing/HowItWorksSection';
import WhyChooseSection from './components/landing/WhyChooseSection';
import FeaturedCategories from './components/landing/FeaturedCategories';
import ShopByClass from './components/landing/ShopByClass';
import VideoSection from './components/landing/VideoSection';
import SEOContentSection from './components/landing/SEOContentSection';
import AppSection from './components/landing/AppSection';
import FinalCTASection from './components/landing/FinalCTASection';

const Home = () => {
  return (
    <div className="flex flex-col bg-white">
      <HeroSection />
      <AppSection />
      <HowItWorksSection />
      <WhyChooseSection />
      <FeaturedCategories />
      <ShopByClass />
      <VideoSection />
      <SEOContentSection />
      <FinalCTASection />
    </div>
  );
};

export default Home;
