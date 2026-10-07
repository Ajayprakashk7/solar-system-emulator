## 2023-10-24 - Global Rate Limiting DoS Risk
**Vulnerability:** The rate limiter was defaulting to a 'global' identifier, creating a shared bucket for all users.
**Learning:** This is a DoS risk where one malicious user can exhaust the API quota for everyone. In Next.js 15, request.ip is removed, so IP must be extracted from headers (x-real-ip or x-forwarded-for).
**Prevention:** Always extract client IP from headers and pass it explicitly to rate limiter checks.
