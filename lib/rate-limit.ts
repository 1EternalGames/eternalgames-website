// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 1. Create the Redis connection
// This automatically looks for UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

const limiters = new Map<string, Ratelimit>();

const getLimiter = (limit: number, window: "10 s" | "60 s", prefix: string) => {
  const key = `${prefix}-${limit}`;
  
  if (!limiters.has(key)) {
    limiters.set(key, new Ratelimit({
      redis: redis, // <--- Using the native Redis client
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: key,
      analytics: true,
    }));
  }
  return limiters.get(key)!;
};

// 1. Standard Limiter (10s window)
export const standardLimiter = {
  check: async (identifier: string, limit: number = 10) => {
    try {
      const limiter = getLimiter(limit, "10 s", "@upstash/standard");
      const { success } = await limiter.limit(identifier);
      return { success };
    } catch (error) {
      console.error("Rate limit error:", error);
      return { success: true };
    }
  },
};

// 2. Sensitive Limiter (60s window)
export const sensitiveLimiter = {
  check: async (identifier: string, limit: number = 5) => {
    try {
      const limiter = getLimiter(limit, "60 s", "@upstash/sensitive");
      const { success } = await limiter.limit(identifier);
      return { success };
    } catch (error) {
      console.error("Rate limit error:", error);
      return { success: true };
    }
  },
};