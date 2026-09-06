## 2024-05-24 - Prevent Global API Quota Exhaustion via Per-IP Rate Limiting
**Vulnerability:** External API proxy endpoints relied solely on a global rate limiter without per-IP rate limiting, allowing a single client to exhaust the entire application's quota and cause a global DoS.
**Learning:** Global rate limits on proxy endpoints create a shared resource vulnerability. A defense-in-depth approach is required, short-circuiting with strict per-IP limits before evaluating the global limit.
**Prevention:** Always implement sequential early returns for rate limiting: evaluate the ipRateLimiter first using x-forwarded-for, and only if successful, evaluate the global nasaRateLimiter.
