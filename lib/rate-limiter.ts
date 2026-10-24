/**
 * Lightweight in-process rate limiting for the NASA proxy routes.
 *
 * Two limits are intentionally applied:
 * 1. A per-client budget prevents one client from exhausting the app quota.
 * 2. A shared upstream budget keeps this process below NASA's hourly quota.
 *
 * This is deliberately dependency-free. In a multi-instance deployment each
 * process has its own counters, while NASA still enforces the final upstream
 * quota for the API key.
 */

import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  scope?: 'client' | 'upstream';
};

export class RateLimiter {
  private cache: LRUCache<string, number[]>;
  private limit: number;
  private window: number;

  constructor(limit: number, windowMs: number = 60 * 60 * 1000) {
    this.limit = limit;
    this.window = windowMs;
    this.cache = new LRUCache({
      max: 1000,
      ttl: windowMs,
    });
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const timestamps = this.cache.get(identifier) ?? [];
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.window
    );

    const reset = new Date(
      validTimestamps[0] ? validTimestamps[0] + this.window : now + this.window
    );

    if (validTimestamps.length >= this.limit) {
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
      remaining: Math.max(0, this.limit - validTimestamps.length),
      reset,
    };
  }
}

const WINDOW_MS = 60 * 60 * 1000;
const CLIENT_REQUESTS_PER_HOUR = 120;
const UPSTREAM_REQUESTS_PER_HOUR = 900;

const nasaClientRateLimiter = new RateLimiter(CLIENT_REQUESTS_PER_HOUR, WINDOW_MS);
const nasaUpstreamRateLimiter = new RateLimiter(UPSTREAM_REQUESTS_PER_HOUR, WINDOW_MS);

/**
 * Resolve a stable-enough client identifier from headers supplied by a reverse
 * proxy. Prefer x-real-ip because it should be normalized by the hosting layer;
 * fall back to the left-most forwarded address when needed.
 */
export function getClientIdentifier(request: NextRequest): string {
  // Prefer x-real-ip because it should be normalized by the hosting layer
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp.slice(0, 128);

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // When falling back to x-forwarded-for, use the right-most IP.
    // A spoofed left-most IP can bypass rate limits. The right-most
    // is appended by the proxy closest to the server.
    const ips = forwardedFor.split(',');
    const rightMostIp = ips[ips.length - 1].trim();
    if (rightMostIp) return rightMostIp.slice(0, 128);
  }

  // Local development and direct requests may not contain proxy headers.
  const userAgent = request.headers.get('user-agent')?.trim() || 'unknown-client';
  return `anonymous:${userAgent.slice(0, 96)}`;
}

export function checkNasaRateLimit(request: NextRequest): RateLimitResult {
  const clientIdentifier = getClientIdentifier(request);
  const clientResult = nasaClientRateLimiter.check(`client:${clientIdentifier}`);

  if (!clientResult.success) {
    return { ...clientResult, scope: 'client' };
  }

  const upstreamResult = nasaUpstreamRateLimiter.check('nasa-upstream');
  if (!upstreamResult.success) {
    return { ...upstreamResult, scope: 'upstream' };
  }

  return {
    success: true,
    limit: clientResult.limit,
    remaining: Math.min(clientResult.remaining, upstreamResult.remaining),
    reset:
      clientResult.reset.getTime() > upstreamResult.reset.getTime()
        ? clientResult.reset
        : upstreamResult.reset,
    scope: 'client',
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const resetSeconds = Math.floor(result.reset.getTime() / 1000);
  const retryAfterSeconds = Math.max(0, Math.ceil((result.reset.getTime() - Date.now()) / 1000));

  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': resetSeconds.toString(),
    ...(result.success ? {} : { 'Retry-After': retryAfterSeconds.toString() }),
  };
}
