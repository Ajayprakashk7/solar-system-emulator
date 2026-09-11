## 2024-05-18 - Missing IP Rate Limiting in Next.js 15
**Vulnerability:** External API proxy endpoints lacked per-IP rate limiting, relying solely on a global rate limit, making the application vulnerable to Denial of Service (DoS) attacks and API quota exhaustion from a single malicious IP.
**Learning:** In Next.js 15 API/edge routes, `request.ip` has been removed from the `NextRequest` object. To determine the client IP, it must be extracted from the 'x-forwarded-for' header.
**Prevention:** Always implement both global and per-IP rate limiting on external API proxy endpoints. Extract the leftmost IP from 'x-forwarded-for' to get the actual client IP, and check the IP limit before the global limit to ensure short-circuiting.
