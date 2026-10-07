## 2024-05-24 - Rate Limiter Global Bucket DoS
**Vulnerability:** The custom NASA API rate limiter defaulted to a global bucket when no identifier was provided, allowing a single user to exhaust the quota for the entire application.
**Learning:** In Next.js App Router (v15), request.ip is removed, meaning IP extraction requires manually parsing x-real-ip and x-forwarded-for headers to enforce per-user limits correctly.
**Prevention:** Always explicitly pass a unique identifier (like client IP or user ID) to rate limiting functions instead of relying on default or global buckets.
