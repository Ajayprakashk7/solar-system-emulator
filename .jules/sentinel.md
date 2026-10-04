## 2024-05-18 - Rate Limiting Vulnerability
**Vulnerability:** Global rate limiter bucket is used for all users, enabling easy DoS of the entire application. Also, X-RateLimit-Reset header is sending ISO strings instead of standard Unix timestamps.
**Learning:** Defaulting identifier to 'global' in check() means every request increments the same bucket.
**Prevention:** Explicitly extract the client IP (using x-real-ip or x-forwarded-for from request headers since request.ip is deprecated in Next 15) and pass it to check(clientIp). Convert reset date to Unix timestamp (Math.floor(reset.getTime() / 1000)) for HTTP headers.
