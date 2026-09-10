## 2024-03-24 - Rate Limiting Bypass via Missing IP Check
**Vulnerability:** The public API proxy endpoints either completely lacked rate limits (/apod, /neo) or only implemented a global limit without IP checking, making the API vulnerable to DoS attacks and quota exhaustion.
**Learning:** In Next.js 15, request.ip is removed, so IP must be parsed from x-forwarded-for. Using the rightmost IP is critical to prevent spoofing by malicious users who might inject fake IPs into the left side of the header.
**Prevention:** Implement sequential rate limiting: first validate per-IP limits using the securely extracted rightmost IP, then validate global limits. This ensures early exit for malicious IPs and protects the shared global quota.
