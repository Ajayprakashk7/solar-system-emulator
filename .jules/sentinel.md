## 2024-10-26 - Prevent IP Spoofing Rate Limit Bypass
**Vulnerability:** The rate limiter extracted the left-most IP address from the `x-forwarded-for` header.
**Learning:** The left-most IP can be easily spoofed by the client, allowing an attacker to bypass rate limits by sending random IPs in the header. The right-most IP is added by the closest trusted proxy and is reliable.
**Prevention:** Always extract the right-most IP from the `x-forwarded-for` header or rely on a trustworthy normalized header like `x-real-ip` set by your infrastructure.
