import { unstable_cache } from 'next/cache';

// Helper to cache expensive DB operations
// refreshInterval is in seconds
export const cacheDb = <T, P extends any[]>(
  fn: (...params: P) => Promise<T>,
  keyParts: string[],
  tags: string[],
  refreshInterval: number = 300 // Default 5 minutes
) => {
  return unstable_cache(fn, keyParts, {
    tags: tags,
    revalidate: refreshInterval,
  });
};