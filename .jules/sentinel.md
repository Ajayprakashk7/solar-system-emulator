## 2024-10-07 - Fix global rate limit vulnerability
**Vulnerability:** The rate limiter in NASA API routes was using a global bucket by default, allowing a single user to exhaust the quota for the entire application (DoS risk).
**Learning:** Always explicitly pass a unique identifier (like the client IP) to rate limiters to enforce per-user limits, especially on public-facing endpoints.
**Prevention:** When implementing rate limiting, verify that the limiting bucket is scoped appropriately (e.g., by IP or user ID) rather than globally.
