## 2024-05-24 - DoS Protection & Rate Limiting in Next.js 15
**Vulnerability:** External API proxies (NEO and APOD endpoints) lacked rate limiting, making the application vulnerable to DoS attacks and global API quota exhaustion.
**Learning:** Next.js 15 removes `request.ip` from the `NextRequest` object. We must parse `x-forwarded-for` to get the client IP. Crucially, we must sequentially evaluate the IP rate limit *before* the global rate limit to ensure attackers don't drain the global quota before getting blocked.
**Prevention:** Always wrap external API calls in dual (per-IP and global) rate limiters, evaluating the IP limit first. Use `request.headers.get('x-forwarded-for')` for IP extraction in Next.js 15+.
