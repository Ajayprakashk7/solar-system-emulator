## 2024-10-24 - Rate Limiting Global DoS Vulnerability
**Vulnerability:** The application was using a global identifier for rate limiting instead of extracting the client IP.
**Learning:** In Next.js 15, `request.ip` has been removed. Falling back to a global identifier makes the application vulnerable to a global DoS attack where one malicious actor can exhaust the rate limit for all users. Extracting the client IP securely requires preferring `x-real-ip` or the leftmost IP from `x-forwarded-for`. Additionally, `Date` objects must be converted to Unix timestamps for HTTP headers.
**Prevention:** Always extract the client IP accurately using headers when implementing rate limiting to ensure per-user limits rather than global limits.
