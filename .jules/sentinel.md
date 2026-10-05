## 2024-05-15 - Global Rate Limiting DoS Risk
**Vulnerability:** Global rate limiting bucket due to omission of identifier in nasaRateLimiter.check().
**Learning:** Defaulting to a 'global' identifier in rate limiters creates a Denial of Service (DoS) risk where a single user can exhaust the API quota for all users. In Next.js 15, request.ip is removed, so the client IP must be extracted from x-real-ip or x-forwarded-for headers.
**Prevention:** Always pass a unique identifier (like client IP) to rate limiting functions to enforce per-user limits, and correctly extract IPs from request headers in Next.js 15 environments.
