## 2024-05-24 - Global Rate Limit Bucket DoS
**Vulnerability:** The rate limiter was using a global identifier for all requests, allowing a single malicious user to exhaust the API quota for the entire application.
**Learning:** In Next.js APIs, rate limiters must explicitly extract and use the client IP to bucket requests properly, as request.ip is often unavailable.
**Prevention:** Always extract x-real-ip or x-forwarded-for from request.headers and pass it to the rate limiter's check function.
