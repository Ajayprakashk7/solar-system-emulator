## 2025-05-24 - Missing Rate Limiting on External APIs
**Vulnerability:** External APIs like `app/api/nasa/apod/route.ts` and `app/api/nasa/neo/route.ts` lack the global `nasaRateLimiter` implementation which is used in `app/api/nasa/moon/[name]/route.ts` and `app/api/nasa/planet/[name]/route.ts`. Additionally, they do not have a per-IP rate limiter.
**Learning:** External API routes were not universally protected by the existing `nasaRateLimiter` implementation, leading to potential DoS attacks and upstream quota exhaustion.
**Prevention:** All external API routes (e.g. `app/api/nasa/...`) must consistently implement the global `nasaRateLimiter` for upstream quotas, as defined in memory.
## 2025-05-24 - Next.js Request IP Deprecation
**Vulnerability:** Attempted to use `request.ip` for IP rate limiting in Next.js 15.
**Learning:** `request.ip` has been removed from `NextRequest` types in recent Next.js versions. We must rely exclusively on headers like `x-forwarded-for` to derive the client IP for rate limiting.
**Prevention:** Always use `request.headers.get('x-forwarded-for')` instead of `request.ip` for IP identification in Next.js edge/API routes.
