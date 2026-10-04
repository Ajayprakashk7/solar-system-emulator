## 2024-10-04 - Fix global rate limiting DoS risk
**Vulnerability:** Rate limiter defaulted to 'global' bucket, creating a DoS risk.
**Learning:** The identifier must be extracted from the request headers to enforce per-user limits.
**Prevention:** Always extract client IP from request.headers (checking x-real-ip then x-forwarded-for) to enforce per-user limits.
