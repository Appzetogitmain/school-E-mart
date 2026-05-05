import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from './ProtectedRoute';
import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import MainLayout from '../layouts/MainLayout';
import LandingLayout from '../layouts/LandingLayout';

// Lazy Load Components
const Home = React.lazy(() => import('../features/home/Home'));
const MarketplaceHome = React.lazy(() => import('../features/home/MarketplaceHome'));
const About = React.lazy(() => import('../features/about/About'));
const HowItWorks = React.lazy(() => import('../features/how-it-works/HowItWorks'));
const CategoryPage = React.lazy(() => import('../features/products/CategoryPage'));
const SchoolFAQ = React.lazy(() => import('../features/faq/SchoolFAQ'));
const HelpCenter = React.lazy(() => import('../features/help/HelpCenter'));
const TrackOrder = React.lazy(() => import('../features/orders/TrackOrder'));
const GradeProductsPage = React.lazy(() => import('../features/products/GradeProductsPage.jsx'));
const MySchool = React.lazy(() => import('../features/parent/MySchool'));
const TermsAndConditions = React.lazy(() => import('../features/legal/TermsAndConditions'));
const PrivacyPolicy = React.lazy(() => import('../features/legal/PrivacyPolicy'));
const RefundPolicy = React.lazy(() => import('../features/legal/RefundPolicy'));

const AuthPage = React.lazy(() => import('../features/auth/AuthPage'));

// Mobile App Components
const AppLayout = React.lazy(() => import('../app/layouts/AppLayout'));
const AppAuthPage = React.lazy(() => import('../app/features/auth/AppAuthPage'));
const ParentHome = React.lazy(() => import('../app/features/parent/ParentHome'));
const AppCategoryPage = React.lazy(() => import('../app/features/parent/CategoryPage'));
const SubcategoryPage = React.lazy(() => import('../app/features/parent/SubcategoryPage'));
const MySchoolPage = React.lazy(() => import('../app/features/parent/MySchoolPage'));
const OrderHistoryPage = React.lazy(() => import('../app/features/parent/OrderHistoryPage'));
const SelectGradePage = React.lazy(() => import('../app/features/parent/SelectGradePage'));
const ParentGradeProductsPage = React.lazy(() => import('../app/features/parent/GradeProductsPage'));
const ProductDetailsPage = React.lazy(() => import('../app/features/parent/ProductDetailsPage'));
const CartPage = React.lazy(() => import('../app/features/parent/CartPage'));
const EditProfilePage = React.lazy(() => import('../app/features/parent/EditProfilePage'));
const WishlistPage = React.lazy(() => import('../app/features/parent/WishlistPage'));
const ContactUsPage = React.lazy(() => import('../app/features/parent/ContactUsPage'));
const AboutUsPage = React.lazy(() => import('../app/features/parent/AboutUsPage'));
const ReferEarnPage = React.lazy(() => import('../app/features/parent/ReferEarnPage'));
const WalletPage = React.lazy(() => import('../app/features/parent/WalletPage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const Dashboard = () => <div className="p-10"><h1>Dashboard</h1><p>Welcome back!</p></div>;

const AppRoutes = () => {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
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

        {/* Mobile App Experience Routes */}
        <Route path="/user" element={<AppLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="login" element={<AppAuthPage />} />
          <Route path="home" element={<ParentHome />} />
          <Route path="categories" element={<AppCategoryPage />} />
          <Route path="my-school" element={<MySchoolPage />} />
          <Route path="category/:categoryId" element={<SubcategoryPage />} />
          <Route path="orders" element={<OrderHistoryPage />} />
          <Route path="select-grade" element={<SelectGradePage />} />
          <Route path="products" element={<ParentGradeProductsPage />} />
          <Route path="product/:productId" element={<ProductDetailsPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="edit-profile" element={<EditProfilePage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="contact" element={<ContactUsPage />} />
          <Route path="about" element={<AboutUsPage />} />
          <Route path="refer" element={<ReferEarnPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="profile" element={<div className="p-10 text-center"><h1 className="text-xl font-bold">Profile</h1><p className="text-gray-400">Coming Soon</p></div>} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </React.Suspense>
  );
};

export default AppRoutes;
