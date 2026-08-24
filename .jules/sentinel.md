## 2024-05-24 - API Rate Limiting Bypass
**Vulnerability:** The NASA API proxy endpoints (`app/api/nasa/apod/route.ts` and `app/api/nasa/neo/route.ts`) are missing rate limiting checks.
**Learning:** External API proxy endpoints must implement global and per-IP rate limiting to prevent upstream API quota exhaustion and DoS attacks. The `nasaRateLimiter` is implemented but only used in a few routes.
**Prevention:** All external API proxy endpoints must implement `nasaRateLimiter.check()` before executing requests.
