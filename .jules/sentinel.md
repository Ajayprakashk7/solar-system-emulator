## 2024-05-24 - Missing IP-based Rate Limiting on Proxy Endpoints
**Vulnerability:** External API proxy endpoints implemented global rate limits to protect NASA API quotas, but lacked per-IP rate limiting, allowing a single malicious user to DoS the application by exhausting the global quota for all users.
**Learning:** In Next.js 15 edge/API routes, relying solely on global limits creates a DoS vector. Client IPs must be extracted from 'x-forwarded-for' headers since `request.ip` is removed.
**Prevention:** Always implement sequential rate limits: a restrictive per-IP limit checked FIRST (with early returns), followed by the global quota limit.
