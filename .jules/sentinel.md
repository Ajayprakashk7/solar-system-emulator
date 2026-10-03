## 2024-05-18 - Enforce Per-User Rate Limiting
**Vulnerability:** The rate limiter defaults to a 'global' bucket, creating a DoS risk if one user hits the limit, blocking all users.
**Learning:** `check(identifier)` must use a unique client identifier (like IP address) to correctly enforce per-user limits, rather than defaulting to a shared bucket.
**Prevention:** Extract the client IP from request headers (`x-forwarded-for` or `x-real-ip`) and pass it to `check()`. Convert the `reset` Date object to a Unix timestamp before setting headers.
