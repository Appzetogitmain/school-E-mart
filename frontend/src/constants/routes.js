export const ROUTES = {
  // Public
  HOME: '/',
  MARKETPLACE: '/home',
  LOGIN: '/user/login',
  REGISTER: '/user/login',
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
    LOGIN: '/vendor/login',
    PROFILE: '/vendor/profile',
    PRODUCTS: '/vendor/products',
    QUOTATIONS: '/vendor/quotations',
    ORDERS: '/vendor/orders',
    WALLET: '/vendor/wallet',
  },
  
  // Admin Panel — these are aliases of the Super Admin console below, which is
  // where the pages actually live. /admin/* redirects there; point links at the
  // real paths so they resolve in one hop instead of bouncing through a redirect.
  ADMIN: {
    ROOT: '/superadmin',
    USERS: '/superadmin/users',
    CATEGORIES: '/superadmin/category',
    ORDERS: '/superadmin/orders',
  },
  
  // Super Admin Console
  SUPER_ADMIN: {
    ROOT: '/superadmin',
    LOGIN: '/superadmin/login',
    DASHBOARD: '/superadmin/dashboard',
  }
};
