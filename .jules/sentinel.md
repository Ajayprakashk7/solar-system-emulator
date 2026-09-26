## 2024-05-24 - Global Rate Limiting DoS Vulnerability
**Vulnerability:** The rate limiter was defaulting to a 'global' bucket across all requests, allowing a single user to consume the entire API quota and cause a Denial of Service for all users.
**Learning:** In Next.js App Router route handlers, always extract the client IP securely using x-real-ip (or the leftmost IP of x-forwarded-for) rather than omitting the identifier for per-user limits.
**Prevention:** Always pass a uniquely identifying token (like client IP or user ID) to rate limiter check functions.
