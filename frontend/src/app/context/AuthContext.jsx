import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => {
    const saved = localStorage.getItem('auth_state');
    return saved ? JSON.parse(saved) : {
      isLoggedIn: false,
      isGuest: false,
      user: null
    };
  });

  useEffect(() => {
    localStorage.setItem('auth_state', JSON.stringify(authState));
    
    if (authState.isLoggedIn && authState.user) {
      localStorage.setItem('childInfo', JSON.stringify(authState.user));
    } else if (authState.isGuest) {
      const existing = localStorage.getItem('childInfo');
      const isActuallyGuest = existing ? JSON.parse(existing).name === "Guest Parent" : false;
      
      if (!existing || !isActuallyGuest) {
        localStorage.setItem('childInfo', JSON.stringify({
          name: "Guest Parent",
          school: "Not Linked",
          grade: "Select Grade"
        }));
      }
    }
    window.dispatchEvent(new Event('storage'));
  }, [authState]);

  const login = (userData) => {
    setAuthState({
      isLoggedIn: true,
      isGuest: false,
      user: userData
    });
  };

  const logout = () => {
    setAuthState({
      isLoggedIn: false,
      isGuest: false,
      user: null
    });
    localStorage.removeItem('auth_state');
    localStorage.removeItem('childInfo');
    localStorage.removeItem('wishlist');
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('storage'));
  };

  const setGuestMode = () => {
    localStorage.setItem('childInfo', JSON.stringify({
      name: "Guest Parent",
      school: "Not Linked",
      grade: "Select Grade"
    }));
    setAuthState({
      isLoggedIn: false,
      isGuest: true,
      user: null
    });
  };

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      logout, 
      setGuestMode 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
