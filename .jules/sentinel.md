## 2024-05-24 - Fix Global Rate Limiting DoS Risk
**Vulnerability:** The rate limiter used a default 'global' identifier, creating a single shared bucket for all users.
**Learning:** Using a single global bucket for rate limiting creates a Denial of Service (DoS) vulnerability where one user can exhaust the API quota for everyone.
**Prevention:** Always extract a unique identifier (like client IP) from request headers and pass it to the rate limiter check function to enforce per-user limits.
