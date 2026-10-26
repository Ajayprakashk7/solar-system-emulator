## 2024-10-26 - Fix rate limit bypass via IP spoofing
**Vulnerability:** Rate limit bypass via IP spoofing using the left-most IP in x-forwarded-for.
**Learning:** The left-most IP in x-forwarded-for can be easily spoofed by the client, allowing them to bypass rate limits.
**Prevention:** Always extract the right-most IP, which is appended by the closest trusted proxy.
