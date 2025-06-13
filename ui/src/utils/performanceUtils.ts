// Performance utilities for optimizing React app performance
import React, { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Custom hook for managing intervals with proper cleanup
 * Prevents memory leaks from interval management
 */
export const useInterval = (callback: () => void, delay: number | null, dependency?: any[]) => {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay, ...(dependency || [])]);
};

/**
 * Custom hook for debouncing functions to reduce API call frequency
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    }) as T,
    [func, delay]
  );
};

/**
 * Custom hook for caching API responses
 */
export const useApiCache = <T>(key: string, defaultValue: T) => {
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const CACHE_DURATION = 30000; // 30 seconds

  const getCachedData = useCallback((cacheKey: string): T | null => {
    const cached = cache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  const setCachedData = useCallback((cacheKey: string, data: T) => {
    cache.current.set(cacheKey, { data, timestamp: Date.now() });
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  return { getCachedData, setCachedData, clearCache };
};

/**
 * Higher-order component for tab-based lazy loading
 */
export const withLazyTab = <P extends object>(
  Component: React.ComponentType<P>,
  tabIndex: number
) => {
  return React.memo((props: P & { activeTab: number }) => {
    const { activeTab, ...otherProps } = props;
    
    // Only render if this is the active tab or has been previously rendered
    const hasBeenRendered = useRef(false);
    
    if (activeTab === tabIndex) {
      hasBeenRendered.current = true;
    }
    
    if (!hasBeenRendered.current) {
      return null;
    }
    
    return React.createElement('div', 
      { style: { display: activeTab === tabIndex ? 'block' : 'none' } },
      React.createElement(Component, otherProps as P)
    );
  });
};

/**
 * Custom hook for managing component visibility to reduce unnecessary operations
 */
export const useVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
};

/**
 * Optimized API call wrapper with caching and deduplication
 */
export class ApiCallManager {
  private static instance: ApiCallManager;
  private cache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>();
  private pendingCalls = new Map<string, Promise<any>>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): ApiCallManager {
    if (!ApiCallManager.instance) {
      ApiCallManager.instance = new ApiCallManager();
    }
    return ApiCallManager.instance;
  }

  async call<T>(key: string, apiFunction: () => Promise<T>, forceRefresh = false): Promise<T> {
    // Check cache first
    if (!forceRefresh) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    // Check if there's already a pending call for this key
    const pending = this.pendingCalls.get(key);
    if (pending) {
      return pending;
    }

    // Make the API call
    const promise = apiFunction()
      .then((data) => {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.pendingCalls.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingCalls.delete(key);
        throw error;
      });

    this.pendingCalls.set(key, promise);
    return promise;
  }

  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  invalidatePattern(pattern: RegExp) {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

/**
 * Custom hook for batch API calls
 */
export const useBatchApi = () => {
  const batchQueue = useRef<Array<{
    key: string;
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>>([]);
  
  const executeBatch = useCallback(async () => {
    if (batchQueue.current.length === 0) return;
    
    const batch = [...batchQueue.current];
    batchQueue.current = [];
    
    // Execute all API calls in parallel
    const results = await Promise.allSettled(
      batch.map(({ fn }) => fn())
    );
    
    // Resolve/reject individual promises
    results.forEach((result, index) => {
      const { resolve, reject } = batch[index];
      if (result.status === 'fulfilled') {
        resolve(result.value);
      } else {
        reject(result.reason);
      }
    });
  }, []);

  const debouncedExecute = useDebounce(executeBatch, 100);

  const addToBatch = useCallback(<T>(key: string, fn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      batchQueue.current.push({ key, fn, resolve, reject });
      debouncedExecute();
    });
  }, [debouncedExecute]);

  return { addToBatch };
};

