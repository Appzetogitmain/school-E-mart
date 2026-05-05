import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/shared/ScrollToTop';
import { CartProvider } from './app/context/CartContext';
import { WishlistProvider } from './app/context/WishlistContext';

function App() {
  return (
    <BrowserRouter>
      <WishlistProvider>
        <CartProvider>
          <ScrollToTop />
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </CartProvider>
      </WishlistProvider>
    </BrowserRouter>
  );
}

export default App;
