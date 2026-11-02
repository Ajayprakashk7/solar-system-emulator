## 2024-11-02 - Insecure IP extraction in Rate Limiter
**Vulnerability:** Indiscriminately picking the left-most IP from `x-forwarded-for` header for rate limiting. This IP is trivially spoofable by the client, allowing for rate limit bypass or centralized DoS attacks.
**Learning:** When mitigating IP spoofing vulnerabilities in `X-Forwarded-For` headers without a trusted proxy list, prefer extracting the right-most IP (the one appended by the last proxy) rather than the left-most IP. The left-most IP is trivially spoofable by the client.
**Prevention:** Always extract the right-most IP from `X-Forwarded-For` unless an explicit trusted proxy list is configured to securely parse IPs right-to-left.
