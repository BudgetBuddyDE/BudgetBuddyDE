import { useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

/**
 * A custom hook for easily updating URL search query parameters.
 *
 * Example:
 * const { updateQueryParam } = useUpdateSearchParams();
 * updateQueryParam('sort', 'asc');
 */
export function useUpdateSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Create a new query string by merging current params with the new key/value pair
   */
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  /**
   * Update a single query parameter and push to the router
   */
  const updateQueryParam = useCallback(
    (name: string, value: string) => {
      const queryString = createQueryString(name, value);
      router.push(`${pathname}?${queryString}`);
    },
    [createQueryString, pathname, router]
  );

  /**
   * Remove a query parameter from the URL
   */
  const removeQueryParam = useCallback(
    (name: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(name);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return { updateQueryParam, removeQueryParam, createQueryString };
}
