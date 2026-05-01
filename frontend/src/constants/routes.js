export const ROUTES = {
  // Public
  HOME: '/',
  MARKETPLACE: '/home',
  LOGIN: '/login',
  REGISTER: '/register',
  ABOUT: '/about',
  HOW_IT_WORKS: '/how-it-works',
  CATEGORY: '/category/:slug',
  SCHOOL_FAQ: '/school-faq',
  HELP_CENTER: '/help-center',
  TRACK_ORDER: '/track-order',
  REFUND_POLICY: '/refund-policy',
  SHOP_BY_GRADE: '/shop-by-grade',
  MY_SCHOOL: '/my-school',
  TERMS: '/terms-conditions',
  PRIVACY: '/privacy-policy',
  
  // Protected
  DASHBOARD: '/dashboard',
  
  // School Portal
  SCHOOL: {
    ROOT: '/school',
    PROFILE: '/school/profile',
    PRODUCTS: '/school/products',
    QUOTATIONS: '/school/quotations',
    ORDERS: '/school/orders',
  },
  
  // Vendor Portal
  VENDOR: {
    ROOT: '/vendor',
    PROFILE: '/vendor/profile',
    PRODUCTS: '/vendor/products',
    QUOTATIONS: '/vendor/quotations',
    ORDERS: '/vendor/orders',
    WALLET: '/vendor/wallet',
  },
  
  // Admin Panel
  ADMIN: {
    ROOT: '/admin',
    USERS: '/admin/users',
    CATEGORIES: '/admin/categories',
    ORDERS: '/admin/orders',
    REPORTS: '/admin/reports',
  }
};
