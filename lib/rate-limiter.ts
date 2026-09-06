/**
 * Rate limiter to prevent API quota exhaustion
 * NASA API has 1000 requests/hour limit
 */

import { LRUCache } from 'lru-cache';

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
};

export class RateLimiter {
  private cache: LRUCache<string, number[]>;
  private limit: number;
  private window: number;

  constructor(limit: number = 1000, windowMs: number = 60 * 60 * 1000) {
    this.limit = limit;
    this.window = windowMs;
    this.cache = new LRUCache({
      max: 500,
      ttl: windowMs,
    });
  }

  check(identifier: string = 'global'): RateLimitResult {
    const now = Date.now();
    const timestamps = this.cache.get(identifier) || [];
    
    // Remove timestamps outside the current window
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.window
    );

    const remaining = this.limit - validTimestamps.length;
    const reset = new Date(
      validTimestamps[0] ? validTimestamps[0] + this.window : now + this.window
    );

    if (remaining <= 0) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset,
      };
    }

    validTimestamps.push(now);
    this.cache.set(identifier, validTimestamps);

    return {
      success: true,
      limit: this.limit,
      remaining: remaining - 1,
      reset,
    };
  }
}

// Export singleton instance - 900/hour to stay safely under NASA's 1000/hour limit
export const nasaRateLimiter = new RateLimiter(900, 60 * 60 * 1000);

// Export IP-based rate limiter - 60/minute per IP to prevent single-user quota exhaustion
export const ipRateLimiter = new RateLimiter(60, 60 * 1000);
