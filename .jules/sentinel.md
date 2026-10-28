## 2025-02-28 - Insecure Rate Limit IP Extraction
**Vulnerability:** Rate limiting identifier extraction unconditionally trusts the left-most IP in `x-forwarded-for`.
**Learning:** Indiscriminately picking the left-most IP from `x-forwarded-for` without verifying trusted proxies allows a malicious client to easily bypass rate limits by injecting a fake `x-forwarded-for` header.
**Prevention:** If there is no specific trusted proxy list configured in the environment, the real client IP should be extracted by parsing from right to left, bypassing trusted proxies until an untrusted IP is found. If we cannot assume a proxy topology, it is better to rely on `x-real-ip` (if set correctly by the infrastructure) or avoid trusting `x-forwarded-for` directly without verification.
