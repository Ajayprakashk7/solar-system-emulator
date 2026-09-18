## 2025-01-28 - Insecure Rate Limiter Identifier & Header Exceptions
**Vulnerability:** Rate limiter used 'global' identifier, allowing a single IP to exhaust quota for all users. Header reset property passed as a Date object string instead of Unix timestamp.
**Learning:** Next.js 15 requires explicit header conversion (Date to string) to prevent runtime exceptions. Client IP must be manually extracted (prefer x-real-ip, then leftmost x-forwarded-for) since request.ip is removed.
**Prevention:** Always extract client IP correctly in API routes for rate limiting, and format Date objects to Unix timestamps before passing to HTTP response headers.
