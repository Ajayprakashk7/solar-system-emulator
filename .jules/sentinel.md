## 2025-03-09 - IP Rate Limiting Security Gap
**Vulnerability:** API endpoints lacked IP-based rate limiting, exposing the backend API quota to exhaustion and potential DoS attacks.
**Learning:** The external API proxy endpoints require evaluating an IP limiter before the global limiter, using early returns, to properly enforce short-circuiting and protect quotas.
**Prevention:** Always implement sequential early returns for per-IP limits before global limits on proxy endpoints.
