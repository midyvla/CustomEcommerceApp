import type { ProductDetail } from '../types/bundle'; // Ensure the path accurately navigates to src/types/bundle.ts
import { useState, useEffect } from 'react';

export const useBundle = (productId: number) => {
  const [data, setData] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Prevents race conditions if component unmounts mid-request
    const abortController = new AbortController(); // Cleans up network threads safely

    const fetchBundleData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Points directly to our C# API backend port running on your C: drive loop
        const response = await fetch(`http://localhost:5201/api/bundles/${productId}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP Error Status: ${response.status}`);
        }

        const jsonData: ProductDetail = await response.json();

        if (isMounted) {
          setData(jsonData);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          setError(err.message || 'An unexpected networking error occurred.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBundleData();

    // Cleanup function executes automatically if the user clicks away or reloads
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [productId]);

  return { data, loading, error };
};