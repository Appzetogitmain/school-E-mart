import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/shared/ScrollToTop';
import { CartProvider } from './app/context/CartContext';
import { WishlistProvider } from './app/context/WishlistContext';
import { AuthProvider } from './app/context/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <ScrollToTop />
            <div className="min-h-screen bg-gray-50">
              <AppRoutes />
            </div>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
