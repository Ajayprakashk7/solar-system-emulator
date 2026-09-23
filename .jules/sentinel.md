## 2024-05-24 - Rate Limiter Global Bucket DoS
**Vulnerability:** Global rate limiting bucket used by default, allowing a single user to DoS the application.
**Learning:** `nasaRateLimiter.check()` without an identifier defaults to 'global'. Next.js 15 removes `request.ip`, so `x-real-ip` or the leftmost `x-forwarded-for` must be used.
**Prevention:** Always extract and pass client IP to `check()` and convert `reset` to a Unix timestamp.
