## 2024-03-20 - Global Rate Limiting DoS Risk
**Vulnerability:** The API endpoints used global rate limiting by default (nasaRateLimiter.check()), allowing a single abusive IP to exhaust the global bucket and block all legitimate users.
**Learning:** In Next.js 15 API routes, request.ip is removed. To perform per-user rate limiting securely behind proxies like Vercel, you must manually extract the leftmost IP from the x-forwarded-for header or use x-real-ip.
**Prevention:** Always explicitly pass an extracted client identifier to rate limiter check() methods (e.g., check(clientIp)).
