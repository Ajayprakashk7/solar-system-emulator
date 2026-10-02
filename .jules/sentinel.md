## 2024-05-15 - Global Rate Limiting Vulnerability in Next.js 15
**Vulnerability:** The API rate limiter defaulted to a 'global' identifier, creating a single rate limit bucket for all users, which is a DoS risk.
**Learning:** Next.js 15 removed the `request.ip` property, causing previous IP extraction logic to fail or rely on the global default. Rate limiting must explicitly extract IP from headers. Additionally, HTTP headers for rate limit reset should be Unix timestamps, not ISO strings.
**Prevention:** Always extract `x-real-ip` or `x-forwarded-for` from `request.headers` for rate limit identifiers in Next.js 15+, and format the reset time correctly as a Unix timestamp.
