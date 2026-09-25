## 2024-05-24 - Rate Limiter Global Bucket DoS Risk
**Vulnerability:** The API rate limiter was using a global bucket by default, allowing a single attacker to exhaust the rate limit and cause a Denial of Service (DoS) for all users.
**Learning:** The rate limiter defaulted to a 'global' identifier when no IP was provided, and Next.js 15 removed request.ip, making it easy to forget to extract and pass the client IP.
**Prevention:** Always explicitly extract the client IP using x-real-ip or the leftmost IP from x-forwarded-for, and pass it to the rate limiter to enforce per-user limits. Convert date objects to Unix timestamps before passing them to headers to prevent runtime exceptions.
