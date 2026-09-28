## 2024-05-15 - Fix Global Rate Limiting
**Vulnerability:** The API rate limiter was using a default global identifier, causing all users to share the same limit bucket. This creates a DoS risk where a single malicious user could exhaust the shared limit.
**Learning:** API rate limits must be applied per-user (via IP) rather than globally to prevent a single user or shared quota from exhausting access for everyone. Extract client IP using `x-real-ip` or the leftmost `x-forwarded-for` header in Next.js 15.
**Prevention:** Always extract and pass a unique client identifier (like the actual client IP) to rate limiting checks. Ensure header reset timestamps are formatted correctly to avoid runtime exceptions.
