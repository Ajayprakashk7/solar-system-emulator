## 2024-10-24 - Missing IP Rate Limiting on Proxy Routes
**Vulnerability:** The NASA API proxy routes were missing per-IP rate limiting, allowing a single malicious client to quickly exhaust the shared global `nasaRateLimiter` quota (1000 req/hr), denying service to all other users.
**Learning:** External API proxy routes must implement client-specific rate limiting (using `x-forwarded-for` since `NextRequest.ip` is removed in Next.js 15) *before* checking the global shared quota to protect shared resources.
**Prevention:** Always pair shared global rate limiters with client-specific rate limiters using short-circuit evaluation in API endpoints.
