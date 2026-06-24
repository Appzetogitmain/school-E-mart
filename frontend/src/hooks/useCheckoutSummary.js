import { useEffect, useState } from 'react';
import { getCheckoutSummary } from '../services/ordersApi';
import { getErrorMessage } from '../utils/apiHelpers';
import {
  buildCheckoutPayload,
  summaryTotalsToDisplay,
} from '../utils/mappers/orderMapper';
import { useCart } from '../app/context/CartContext';

export const useCheckoutSummary = ({
  deliveryType,
  paymentMethod,
  addressSource,
  schoolIdForPickup,
  gstin,
  audience,
  enabled = true,
}) => {
  const { cartItems } = useCart();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !cartItems.length) {
      setSummary(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getCheckoutSummary(
      buildCheckoutPayload({
        deliveryType,
        paymentMethod,
        addressSource,
        schoolIdForPickup,
        gstin,
      }),
      { audience }
    )
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setSummary(null);
          setError(getErrorMessage(err, 'Unable to load checkout summary'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    cartItems.length,
    deliveryType,
    paymentMethod,
    schoolIdForPickup,
    gstin,
    audience,
    addressSource,
  ]);

  return {
    summary,
    loading,
    error,
    totals: summaryTotalsToDisplay(summary),
    buildPayload: () =>
      buildCheckoutPayload({
        deliveryType,
        paymentMethod,
        addressSource,
        schoolIdForPickup,
        gstin,
        summary,
      }),
  };
};
