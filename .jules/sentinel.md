## 2024-05-24 - Rate Limiting Vulnerability
**Vulnerability:** The rate limiter implementation defaulted to a global bucket, leading to a DoS risk as all requests shared the same limit. Also, X-RateLimit-Reset was returning an ISO string instead of a Unix timestamp.
**Learning:** In Next.js edge/api routes, request.ip is removed, so we must correctly parse x-real-ip or x-forwarded-for (leftmost IP). The default parameter value for the identifier led to the unintentional global scope.
**Prevention:** Always verify the bucket identifier passed to rate limiters and correctly parse IP headers.
