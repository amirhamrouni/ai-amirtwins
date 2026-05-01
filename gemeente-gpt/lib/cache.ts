/**
 * GemeenteGPT Local — Cache Layer
 * Uses node-cache with SHA256 keys
 * Key = sha256(userId + question + fileIds)
 * TTL = 24h (saves tokens on repeated questions)
 */

import NodeCache from 'node-cache';
import { createHash } from 'crypto';

// TTL: 24 hours in seconds
const CACHE_TTL = 24 * 60 * 60;

const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: 600, // check for expired keys every 10 min
  useClones: false,
});

/**
 * Generate SHA256 cache key
 */
export function generateCacheKey(
  userId: string,
  question: string,
  fileIds: string[] = []
): string {
  const input = `${userId}:${question}:${fileIds.sort().join(',')}`;
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Get cached response (returns null if miss or expired)
 */
export function getCached(key: string): string | null {
  const value = cache.get<string>(key);
  return value ?? null;
}

/**
 * Set cached response
 */
export function setCached(key: string, value: string, ttl = CACHE_TTL): void {
  cache.set(key, value, ttl);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cache.getStats();
}

/**
 * Clear all cache (for testing)
 */
export function clearCache(): void {
  cache.flushAll();
}
