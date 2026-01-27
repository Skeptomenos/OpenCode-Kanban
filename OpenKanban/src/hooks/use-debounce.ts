'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that debounces a value by the specified delay.
 * 
 * WHY: Prevents excessive API calls when user types in search inputs.
 * The value only updates after the user stops typing for the delay period.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default 300ms per spec)
 * @returns The debounced value
 * 
 * @see ralph-wiggum/specs/5.4-search-cleanup.md:L16
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
