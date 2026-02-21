import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from '../../lib/rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(2, 1000); // 2 requests per 1000ms
  });

  it('should allow requests within limit', () => {
    const result1 = limiter.check('user1');
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(1);

    const result2 = limiter.check('user1');
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(0);
  });

  it('should block requests exceeding limit', () => {
    limiter.check('user2');
    limiter.check('user2');

    const result = limiter.check('user2');
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset limit after window', async () => {
    vi.useFakeTimers();

    limiter.check('user3');
    limiter.check('user3');
    expect(limiter.check('user3').success).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1100);

    // Should be allowed again
    const result = limiter.check('user3');
    expect(result.success).toBe(true);

    vi.useRealTimers();
  });

  it('should handle different identifiers independently', () => {
    limiter.check('userA');
    limiter.check('userA');
    expect(limiter.check('userA').success).toBe(false);

    // userB should still be allowed
    expect(limiter.check('userB').success).toBe(true);
  });
});
