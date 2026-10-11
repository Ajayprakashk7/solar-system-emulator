## 2024-05-23 - Fix Global Rate Limit Bucket DoS
**Vulnerability:** The rate limiter defaulted to a 'global' identifier, enabling a global bucket Denial of Service (DoS) where one malicious actor could exhaust the API quota for all users. The reset header was also an ISO string instead of a Unix timestamp.
**Learning:** In Next.js 15, request.ip is unavailable. Rate limit identifiers must explicitly extract IP from request.headers (x-real-ip or x-forwarded-for) to ensure per-client limits.
**Prevention:** Always extract client IP from headers when implementing rate limiting in Next.js App Router, and ensure rate limit reset headers follow standard Unix timestamp format.
