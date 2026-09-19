## 2024-05-20 - Fix Rate Limiting DoS & Header Formatting
**Vulnerability:** Global rate limiting allowed a single malicious IP to DoS the entire app, and unhandled Date objects in headers posed a runtime exception risk.
**Learning:** In Next.js 15, `request.ip` is removed. Safely extracting client IP requires parsing `x-real-ip` or the leftmost IP from `x-forwarded-for` to prevent proxy spoofing. Additionally, Date objects must be converted to Unix timestamps for HTTP headers.
**Prevention:** Always use `x-real-ip` or `x-forwarded-for?.split(',')[0]` for IP-based rate limiting, and ensure `reset.getTime() / 1000` is used for rate limit headers.
