## 2024-10-25 - Fix rate limit bypass via IP spoofing
**Vulnerability:** The rate limiter extracted the left-most IP address from the `X-Forwarded-For` header. This allowed trivial IP spoofing by the client to bypass the rate limits.
**Learning:** In standard reverse proxy configurations, clients can inject arbitrary IPs into `X-Forwarded-For`. The proxy then appends the actual client IP to the end of the list. Therefore, the left-most IP is untrusted, and the right-most IP (appended by the closest trusted proxy) should be used.
**Prevention:** Always extract the right-most IP from `X-Forwarded-For`. Do not trust the left-most IP for rate limiting or security controls.
