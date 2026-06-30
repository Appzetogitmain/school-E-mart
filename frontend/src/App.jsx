import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/shared/ScrollToTop';
import FcmProvider from './components/notifications/FcmProvider';
import { CartProvider } from './app/context/CartContext';
import { WishlistProvider } from './app/context/WishlistContext';

function App() {
  return (
    <BrowserRouter>
      <WishlistProvider>
        <CartProvider>
          <FcmProvider>
            <ScrollToTop />
            <div className="min-h-screen bg-gray-50">
              <AppRoutes />
            </div>
          </FcmProvider>
        </CartProvider>
      </WishlistProvider>
    </BrowserRouter>
  );
}

export default App;
