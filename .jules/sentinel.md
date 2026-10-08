## 2025-02-12 - Fix Global Rate Limit DoS Vulnerability
**Vulnerability:** The rate limiter used a default 'global' identifier, creating a single global bucket that any user could exhaust, leading to a Denial of Service (DoS) for all users. The reset time was also exposed as an ISO string instead of a standard Unix timestamp.
**Learning:** Default arguments in security-critical components like rate limiters can cause severe vulnerabilities if not overridden with user-specific identifiers (like IP addresses) when used in public endpoints.
**Prevention:** Always explicitly pass user-identifying context (e.g., client IP extracted from headers) to rate limiters instead of relying on defaults.
