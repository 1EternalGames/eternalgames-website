// lib/rate-limit.ts

type RateLimitEntry = {
    count: number;
    expiresAt: number;
};

interface RateLimitOptions {
    interval: number; // Window size in ms
    uniqueTokenPerInterval: number; // Max keys to store
}

class LRUCache<K, V> {
    private max: number;
    private cache: Map<K, V>;

    constructor(max: number) {
        this.max = max;
        this.cache = new Map();
    }

    get(key: K): V | undefined {
        const item = this.cache.get(key);
        if (item) {
            // Refresh key position (delete and re-add to end)
            this.cache.delete(key);
            this.cache.set(key, item);
        }
        return item;
    }

    set(key: K, value: V): void {
        // If key exists, update value and refresh position
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } 
        // If cache is full, delete oldest (first) item
        else if (this.cache.size >= this.max) {
            this.cache.delete(this.cache.keys().next().value);
        }
        this.cache.set(key, value);
    }
}

// Global store to persist across hot-reloads in dev, 
// though still reset on serverless cold start.
const globalStore = new Map<string, LRUCache<string, RateLimitEntry>>();

export function rateLimiter(options: RateLimitOptions) {
    const { interval, uniqueTokenPerInterval } = options;
    
    // Create a unique namespace for this limiter configuration
    const namespace = `limit-${interval}-${uniqueTokenPerInterval}`;
    
    if (!globalStore.has(namespace)) {
        globalStore.set(namespace, new LRUCache(uniqueTokenPerInterval));
    }
    
    const tokenCache = globalStore.get(namespace)!;

    return {
        check: async (identifier: string, limit: number) => {
            const now = Date.now();
            const record = tokenCache.get(identifier);

            if (!record) {
                tokenCache.set(identifier, {
                    count: 1,
                    expiresAt: now + interval,
                });
                return { success: true };
            }

            if (now > record.expiresAt) {
                // Window expired, reset count but keep entry to maintain LRU warmth
                tokenCache.set(identifier, {
                    count: 1,
                    expiresAt: now + interval,
                });
                return { success: true };
            }

            if (record.count >= limit) {
                return { success: false };
            }

            // Increment count
            record.count += 1;
            // Update in cache to refresh LRU position
            tokenCache.set(identifier, record);
            
            return { success: true };
        },
    };
}

// 10 requests per 10 seconds
export const standardLimiter = rateLimiter({
    interval: 10 * 1000, 
    uniqueTokenPerInterval: 500,
});

// 3 requests per minute (Login/Signup)
export const sensitiveLimiter = rateLimiter({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
});