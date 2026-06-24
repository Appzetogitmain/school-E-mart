import { useEffect, useState } from 'react';
import * as catalogApi from '../services/catalogApi';
import { getErrorMessage } from '../utils/apiHelpers';
import { mapCategoryTree } from '../utils/mappers/categoryMapper';

let cachedTree = null;
let inflightRequest = null;

export const invalidateCategoryTreeCache = () => {
  cachedTree = null;
  inflightRequest = null;
};

export const useCategoryTree = () => {
  const [tree, setTree] = useState(cachedTree || []);
  const [loading, setLoading] = useState(!cachedTree);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedTree) {
      setTree(cachedTree);
      setLoading(false);
      return undefined;
    }

    if (!inflightRequest) {
      inflightRequest = catalogApi
        .getCategoryTree()
        .then((rawTree) => {
          cachedTree = mapCategoryTree(rawTree);
          return cachedTree;
        })
        .finally(() => {
          inflightRequest = null;
        });
    }

    let cancelled = false;
    setLoading(true);

    inflightRequest
      .then((mappedTree) => {
        if (!cancelled) {
          setTree(mappedTree);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load categories'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { tree, loading, error };
};
