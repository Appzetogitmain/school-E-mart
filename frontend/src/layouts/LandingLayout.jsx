import React from 'react';
import { Outlet } from 'react-router-dom';
import LandingHeader from '../components/shared/LandingHeader';
import Footer from '../components/shared/Footer';

const LandingLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default LandingLayout;
