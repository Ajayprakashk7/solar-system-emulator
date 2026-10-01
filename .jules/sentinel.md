## 2024-05-24 - Per-User Rate Limiting Fix
**Vulnerability:** The API routes were using a global rate limiter bucket, creating a Denial of Service (DoS) risk where one user could exhaust the API quota for everyone.
**Learning:** Default arguments in rate limiter checks (like 'global') can lead to unintentional global state. In Next.js 15, request.ip is removed, so we must securely extract it from headers like x-real-ip or the leftmost IP in x-forwarded-for.
**Prevention:** Always extract and pass the client IP to the rate limiter to enforce per-user limits, and ensure standard Unix timestamps are used for rate limit headers.
