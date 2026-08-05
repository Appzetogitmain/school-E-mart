import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import useAuthStore from '../../store/useAuthStore';
import * as cartApi from '../../services/cartApi';
import {
  mapCartItemsFromApi,
  productToCartPayload,
  findCartLine,
} from '../../utils/mappers/cartMapper';
import {
  canSyncMarketplaceCart,
  getMarketplaceAudience,
} from '../../utils/marketplaceAudience';

const CartContext = createContext();
const LOCAL_CART_KEY = 'cart';

const loadLocalCart = () => {
  try {
    const saved = localStorage.getItem(LOCAL_CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveLocalCart = (items) => {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
};

const applyCartResponse = (cart, products = []) =>
  mapCartItemsFromApi(cart?.items || [], products);

export const CartProvider = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);
  const portal = useAuthStore((state) => state.portal);

  const canSync = isAuthenticated && canSyncMarketplaceCart();
  const [cartItems, setCartItems] = useState(loadLocalCart);
  const [loading, setLoading] = useState(false);
  const mergedRef = useRef(false);

  const syncFromServer = useCallback(async () => {
    if (!canSync) return;

    setLoading(true);
    try {
      const audience = getMarketplaceAudience();
      const cart = await cartApi.getCart(audience);
      setCartItems(applyCartResponse(cart));
    } catch {
      // Keep the current cart if sync fails.
    } finally {
      setLoading(false);
    }
  }, [canSync]);

  const mergeGuestCart = useCallback(async () => {
    const guestItems = loadLocalCart();
    if (!guestItems.length) return;

    const audience = getMarketplaceAudience();
    for (const item of guestItems) {
      try {
        await cartApi.addCartItem(
          audience,
          productToCartPayload(item, item.quantity || 1)
        );
      } catch {
        // Skip items that fail validation during merge.
      }
    }
    localStorage.removeItem(LOCAL_CART_KEY);
  }, []);

  useEffect(() => {
    if (!canSync) {
      mergedRef.current = false;
      setCartItems(loadLocalCart());
      return undefined;
    }

    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);
      try {
        if (!mergedRef.current) {
          await mergeGuestCart();
          mergedRef.current = true;
        }
        if (!cancelled) {
          const audience = getMarketplaceAudience();
          const cart = await cartApi.getCart(audience);
          if (!cancelled) {
            setCartItems(applyCartResponse(cart));
          }
        }
      } catch {
        if (!cancelled) {
          setCartItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [canSync, userRole, portal, mergeGuestCart]);

  useEffect(() => {
    if (!canSync) {
      saveLocalCart(cartItems);
    }
  }, [cartItems, canSync]);

  const addToCart = async (product) => {
    const productId = String(product.productId || product.id);

    if (canSync) {
      setCartItems((prev) => {
        const existing = findCartLine(prev, productId, product.variantId);
        if (existing) {
          return prev.map((item) =>
            String(item.id) === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { ...product, id: productId, quantity: 1 }];
      });

      try {
        const audience = getMarketplaceAudience();
        const cart = await cartApi.addCartItem(audience, productToCartPayload(product, 1));
        setCartItems(applyCartResponse(cart));
      } catch (err) {
        await syncFromServer();
        throw err;
      }
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => String(item.id) === productId);
      if (existing) {
        return prev.map((item) =>
          String(item.id) === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, id: productId, quantity: 1 }];
    });
  };

  const removeFromCart = async (productId, variantId) => {
    if (canSync) {
      setCartItems((prev) =>
        prev.filter(
          (item) =>
            !(
              String(item.id) === String(productId) &&
              String(item.variantId || '') === String(variantId || '')
            )
        )
      );

      try {
        const audience = getMarketplaceAudience();
        const cart = await cartApi.removeCartItem(audience, productId, variantId);
        setCartItems(applyCartResponse(cart));
      } catch {
        await syncFromServer();
      }
      return;
    }

    setCartItems((prev) => prev.filter((item) => String(item.id) !== String(productId)));
  };

  const updateQuantity = async (productId, delta, variantId) => {
    const line = findCartLine(cartItems, productId, variantId);
    const currentQty = line?.quantity || 0;
    const nextQty = currentQty + delta;

    if (nextQty <= 0) {
      await removeFromCart(productId, variantId);
      return;
    }

    if (canSync) {
      setCartItems((prev) =>
        prev.map((item) =>
          String(item.id) === String(productId) &&
          String(item.variantId || '') === String(variantId || '')
            ? { ...item, quantity: nextQty }
            : item
        )
      );

      try {
        const audience = getMarketplaceAudience();
        const cart = await cartApi.updateCartItemQuantity(
          audience,
          productId,
          nextQty,
          variantId
        );
        setCartItems(applyCartResponse(cart));
      } catch {
        await syncFromServer();
      }
      return;
    }

    setCartItems((prev) =>
      prev
        .map((item) => {
          if (String(item.id) === String(productId)) {
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const getProductQuantity = (productId, variantId) => {
    const item = findCartLine(cartItems, productId, variantId);
    return item ? item.quantity : 0;
  };

  const clearCart = async () => {
    if (canSync) {
      try {
        const audience = getMarketplaceAudience();
        await cartApi.clearCart(audience);
      } catch {
        // Still clear local state after checkout.
      }
    } else {
      localStorage.removeItem(LOCAL_CART_KEY);
    }
    setCartItems([]);
  };

  const refreshCart = syncFromServer;

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        getProductQuantity,
        totalQuantity,
        clearCart,
        refreshCart,
        isServerSynced: canSync,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
