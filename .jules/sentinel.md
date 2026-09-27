## 2025-01-27 - [Fix Global Rate Limit DoS]
**Vulnerability:** The rate limiter used a global bucket, allowing one user to exhaust the limit for everyone.
**Learning:** Next.js 15 removes `request.ip` from `NextRequest`. Client IPs must be extracted from `x-real-ip` or the leftmost value of `x-forwarded-for`.
**Prevention:** Always extract the client IP from headers manually and pass it to rate limiters instead of relying on default global behavior.
