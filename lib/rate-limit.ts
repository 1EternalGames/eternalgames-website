// lib/rate-limit.ts

type RateLimitEntry = {
    count: number;
    expiresAt: number;
};

// In-memory store for rate limiting (Per Serverless Instance)
// Note: This resets when the serverless function cold starts. 
// For distributed strict enforcement, use Redis (Upstash/Vercel KV).
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
    interval: number;
    uniqueTokenPerInterval: number;
}

export function rateLimiter(options: RateLimitOptions) {
    const { interval, uniqueTokenPerInterval } = options;

    return {
        check: async (identifier: string, limit: number) => {
            const now = Date.now();
            const record = rateLimitStore.get(identifier);

            // Cleanup old records if map gets too big
            if (rateLimitStore.size > uniqueTokenPerInterval) {
                rateLimitStore.clear();
            }

            if (!record) {
                rateLimitStore.set(identifier, {
                    count: 1,
                    expiresAt: now + interval,
                });
                return { success: true };
            }

            if (now > record.expiresAt) {
                // Window expired, reset
                rateLimitStore.set(identifier, {
                    count: 1,
                    expiresAt: now + interval,
                });
                return { success: true };
            }

            if (record.count >= limit) {
                return { success: false };
            }

            // Increment
            record.count += 1;
            return { success: true };
        },
    };
}

// 10 requests per 10 seconds for general actions
export const standardLimiter = rateLimiter({
    interval: 10 * 1000, 
    uniqueTokenPerInterval: 500,
});

// 3 requests per minute for sensitive actions (Login, Sign up, Commenting)
export const sensitiveLimiter = rateLimiter({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
});