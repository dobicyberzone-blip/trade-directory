/**
 * Query Cache Utility
 * 
 * Provides in-memory caching for database queries to reduce database load.
 * Use Redis for production deployments; this is suitable for serverless environments.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string;
}

const globalCache = new Map<string, CacheEntry<unknown>>();

// Default TTL: 30 seconds — fast enough for near-real-time sync
const DEFAULT_TTL = 30 * 1000;

// Maximum cache size
const MAX_CACHE_SIZE = 500;

/**
 * Get a value from cache
 */
export function getCached<T>(key: string): T | null {
  const entry = globalCache.get(key);
  
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    globalCache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Set a value in cache
 */
export function setCached<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  // Evict oldest entries if cache is full
  if (globalCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = globalCache.keys().next().value;
    if (oldestKey) {
      globalCache.delete(oldestKey);
    }
  }

  globalCache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Delete a specific cache entry
 */
export function deleteCached(key: string): void {
  globalCache.delete(key);
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  globalCache.clear();
}

/**
 * Clear cache entries matching a pattern
 */
export function clearCachePattern(pattern: string): void {
  const regex = new RegExp(pattern);
  for (const key of globalCache.keys()) {
    if (regex.test(key)) {
      globalCache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: number;
} {
  // Note: For proper hit rate tracking, we'd need additional instrumentation
  return {
    size: globalCache.size,
    maxSize: MAX_CACHE_SIZE,
    hitRate: 0, // Would need hit/miss tracking
  };
}

/**
 * Create a cached query function
 */
export function cachedQuery<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL } = options;

  // Check cache first
  const cached = getCached<T>(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  // Fetch fresh data
  return fetchFn().then(data => {
    setCached(key, data, ttl);
    return data;
  });
}

/**
 * Cache wrapper for Next.js API routes
 */
export async function withCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL } = options;

  // Check if request should bypass cache
  const shouldBypassCache = options.key === 'no-cache';

  if (!shouldBypassCache) {
    const cached = getCached<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const data = await fetchFn();
  setCached(cacheKey, data, ttl);
  
  return data;
}

/**
 * Generate a cache key from parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');

  return `${prefix}${sortedParams ? `?${sortedParams}` : ''}`;
}

// Auto-cleanup expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of globalCache.entries()) {
      if (now > entry.expiresAt) {
        globalCache.delete(key);
      }
    }
  }, 60000);
}

export default {
  getCached,
  setCached,
  deleteCached,
  clearCache,
  clearCachePattern,
  getCacheStats,
  cachedQuery,
  withCache,
  generateCacheKey,
};
