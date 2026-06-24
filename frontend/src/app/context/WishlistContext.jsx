import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import useAuthStore from '../../store/useAuthStore';
import * as wishlistApi from '../../services/wishlistApi';
import { mapProductForCard } from '../../utils/mappers/productMapper';
import {
  canSyncMarketplaceCart,
  getMarketplaceAudience,
} from '../../utils/marketplaceAudience';

const WishlistContext = createContext();
const LOCAL_WISHLIST_KEY = 'wishlist';

const loadLocalWishlist = () => {
  try {
    const saved = localStorage.getItem(LOCAL_WISHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveLocalWishlist = (items) => {
  localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(items));
};

const mapWishlistProducts = (products = []) =>
  products.map((product) => mapProductForCard(product));

export const WishlistProvider = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);
  const portal = useAuthStore((state) => state.portal);

  const canSync = isAuthenticated && canSyncMarketplaceCart();
  const [wishlistItems, setWishlistItems] = useState(loadLocalWishlist);
  const [loading, setLoading] = useState(false);
  const mergedRef = useRef(false);

  const syncFromServer = useCallback(async () => {
    if (!canSync) return;

    setLoading(true);
    try {
      const audience = getMarketplaceAudience();
      const result = await wishlistApi.getWishlist(audience);
      setWishlistItems(mapWishlistProducts(result?.products || []));
    } catch {
      // Keep current wishlist if sync fails.
    } finally {
      setLoading(false);
    }
  }, [canSync]);

  const mergeGuestWishlist = useCallback(async () => {
    const guestItems = loadLocalWishlist();
    if (!guestItems.length) return;

    const audience = getMarketplaceAudience();
    for (const item of guestItems) {
      const productId = item.productId || item.id;
      if (!productId) continue;
      try {
        await wishlistApi.addWishlistItem(audience, productId);
      } catch (error) {
        const code = error?.response?.data?.code;
        if (code !== 'WISHLIST_DUPLICATE') {
          // Ignore duplicates, skip other failures silently.
        }
      }
    }
    localStorage.removeItem(LOCAL_WISHLIST_KEY);
  }, []);

  useEffect(() => {
    if (!canSync) {
      mergedRef.current = false;
      setWishlistItems(loadLocalWishlist());
      return undefined;
    }

    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);
      try {
        if (!mergedRef.current) {
          await mergeGuestWishlist();
          mergedRef.current = true;
        }
        if (!cancelled) {
          const audience = getMarketplaceAudience();
          const result = await wishlistApi.getWishlist(audience);
          if (!cancelled) {
            setWishlistItems(mapWishlistProducts(result?.products || []));
          }
        }
      } catch {
        if (!cancelled) {
          setWishlistItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [canSync, userRole, portal, mergeGuestWishlist]);

  useEffect(() => {
    if (!canSync) {
      saveLocalWishlist(wishlistItems);
    }
  }, [wishlistItems, canSync]);

  const addToWishlist = async (product) => {
    const productId = String(product.productId || product.id);

    if (canSync) {
      setWishlistItems((prev) => {
        if (prev.some((item) => String(item.id) === productId)) return prev;
        return [...prev, mapProductForCard({ ...product, _id: productId })];
      });

      try {
        await wishlistApi.addWishlistItem(getMarketplaceAudience(), productId);
        await syncFromServer();
      } catch (error) {
        const code = error?.response?.data?.code;
        if (code !== 'WISHLIST_DUPLICATE') {
          await syncFromServer();
        }
      }
      return;
    }

    setWishlistItems((prev) => {
      if (prev.some((item) => String(item.id) === productId)) return prev;
      return [...prev, { ...product, id: productId }];
    });
  };

  const removeFromWishlist = async (productId) => {
    if (canSync) {
      setWishlistItems((prev) =>
        prev.filter((item) => String(item.id) !== String(productId))
      );

      try {
        await wishlistApi.removeWishlistItem(getMarketplaceAudience(), productId);
        await syncFromServer();
      } catch {
        await syncFromServer();
      }
      return;
    }

    setWishlistItems((prev) => prev.filter((item) => String(item.id) !== String(productId)));
  };

  const isInWishlist = (productId) =>
    wishlistItems.some((item) => String(item.id) === String(productId));

  const toggleWishlist = async (product) => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        loading,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        refreshWishlist: syncFromServer,
        totalWishlistItems: wishlistItems.length,
        isServerSynced: canSync,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
