## 2025-03-09 - [IP Spoofing Vulnerability in Rate Limiter]
**Vulnerability:** The rate limiter blindly trusted the left-most IP in the `X-Forwarded-For` header.
**Learning:** The left-most IP is easily spoofable by clients, allowing them to bypass rate limiting or cause a denial of service. Without a trusted proxy configuration, the right-most IP should be extracted.
**Prevention:** Extract the right-most IP from the `X-Forwarded-For` header instead of the left-most IP.
