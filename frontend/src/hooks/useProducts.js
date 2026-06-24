import { useEffect, useState } from 'react';
import * as catalogApi from '../services/catalogApi';
import { getErrorMessage } from '../utils/apiHelpers';
import {
  mapProductForCard,
  mapProductForGradeCard,
  mapProductForMarketingCard,
  mapProductForSubcategoryList,
} from '../utils/mappers/productMapper';

const MAPPERS = {
  card: mapProductForCard,
  marketing: mapProductForMarketingCard,
  grade: mapProductForGradeCard,
  subcategory: mapProductForSubcategoryList,
};

export const useProducts = (query = {}, options = {}) => {
  const { enabled = true, mapperKey = 'card', categoryName = '' } = options;
  const queryKey = JSON.stringify(query);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const mapper = MAPPERS[mapperKey] || mapProductForCard;
    const fetcher =
      query.featured === true
        ? catalogApi.listFeaturedProducts(query)
        : query.offers === true
          ? catalogApi.listOfferProducts(query)
          : catalogApi.listProducts(query);

    fetcher
      .then(({ data, pagination: pageMeta }) => {
        if (cancelled) return;
        setProducts((data || []).map((item) => mapper(item, { categoryName })));
        setPagination(pageMeta);
      })
      .catch((err) => {
        if (!cancelled) {
          setProducts([]);
          setError(getErrorMessage(err, 'Unable to load products'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, queryKey, mapperKey, categoryName]);

  return { products, pagination, loading, error };
};
