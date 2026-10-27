## 2023-10-27 - Prevent IP Spoofing in Rate Limiting
**Vulnerability:** Rate limiter relied on the left-most IP of `x-forwarded-for`, allowing clients to bypass limits by spoofing the header.
**Learning:** The left-most IP in `x-forwarded-for` is client-provided and easily spoofable. The right-most IP is appended by the closest trusted proxy.
**Prevention:** Always extract the right-most IP from `x-forwarded-for` (e.g., using `.at(-1)`) to ensure a reliable IP is used for rate limiting.

## 2023-10-27 - Safe IP Extraction with Trusted Proxies
**Vulnerability:** Indiscriminately picking the right-most IP from `x-forwarded-for` to prevent client spoofing grouped all traffic under the intermediate proxy's IP (e.g., CDN node), causing a system-wide rate limiting DoS.
**Learning:** The secure standard is to parse IPs from right to left, bypassing a specifically configured list of "trusted proxies", until an untrusted IP (the real client) is found.
**Prevention:** If the application lacks a trusted proxy configuration or you cannot be certain of the proxy topology, it is better to stick to a stable identifier or implement a proper trusted proxy allowlist before manipulating IP selection logic.
