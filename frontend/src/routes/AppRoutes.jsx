import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from './ProtectedRoute';
import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import MainLayout from '../layouts/MainLayout';
import LandingLayout from '../layouts/LandingLayout';

import Home from '../features/home/Home';
import MarketplaceHome from '../features/home/MarketplaceHome';
import About from '../features/about/About';
import HowItWorks from '../features/how-it-works/HowItWorks';
import CategoryPage from '../features/products/CategoryPage';
import SchoolFAQ from '../features/faq/SchoolFAQ';
import HelpCenter from '../features/help/HelpCenter';
import TrackOrder from '../features/orders/TrackOrder';
import GradeProductsPage from '../features/products/GradeProductsPage';
import MySchool from '../features/parent/MySchool';
import TermsAndConditions from '../features/legal/TermsAndConditions';
import PrivacyPolicy from '../features/legal/PrivacyPolicy';
import RefundPolicy from '../features/legal/RefundPolicy';

import AuthPage from '../features/auth/AuthPage';

const Dashboard = () => <div className="p-10"><h1>Dashboard</h1><p>Welcome back!</p></div>;

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing Page Route */}
      <Route element={<LandingLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
      </Route>

      {/* Main App Routes */}
      <Route element={<MainLayout />}>
        <Route path={ROUTES.MARKETPLACE} element={<MarketplaceHome />} />
        <Route path={ROUTES.ABOUT} element={<About />} />
        <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorks />} />
        <Route path={ROUTES.CATEGORY} element={<CategoryPage />} />
        <Route path={ROUTES.SCHOOL_FAQ} element={<SchoolFAQ />} />
        <Route path={ROUTES.HELP_CENTER} element={<HelpCenter />} />
        <Route path={ROUTES.TRACK_ORDER} element={<TrackOrder />} />
        <Route path={ROUTES.SHOP_BY_GRADE} element={<GradeProductsPage />} />
        <Route path={ROUTES.MY_SCHOOL} element={<MySchool />} />
        <Route path={ROUTES.TERMS} element={<TermsAndConditions />} />
        <Route path={ROUTES.PRIVACY} element={<PrivacyPolicy />} />
        <Route path={ROUTES.REFUND_POLICY} element={<RefundPolicy />} />
      </Route>
      
      <Route path={ROUTES.LOGIN} element={<AuthPage />} />
      <Route path={ROUTES.REGISTER} element={<AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        
        {/* Role Specific Routes */}
        <Route element={<RoleRoute allowedRoles={[ROLES.SCHOOL]} />}>
          <Route path={`${ROUTES.SCHOOL.ROOT}/*`} element={<div>School Portal</div>} />
        </Route>

        <Route element={<RoleRoute allowedRoles={[ROLES.VENDOR]} />}>
          <Route path={`${ROUTES.VENDOR.ROOT}/*`} element={<div>Vendor Portal</div>} />
        </Route>

        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path={`${ROUTES.ADMIN.ROOT}/*`} element={<div>Admin Panel</div>} />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
