## 2024-03-24 - Missing Rate Limits on NASA API Proxy Endpoints
**Vulnerability:** The APOD and NEO proxy endpoints in the Next.js API were missing rate limit controls, allowing potential exhaustion of the server-side NASA API quota by malicious actors sending high volumes of requests.
**Learning:** Even though the NASA API limits usage per API key (1000/hour), an unprotected proxy endpoint essentially funnels all client traffic through a single backend API key, making the application vulnerable to DoS attacks that could disrupt service for all users.
**Prevention:** Always implement an internal rate limiter (e.g., using `nasaRateLimiter` from `lib/rate-limiter.ts`) on any proxy endpoint that relays requests to an external API with a shared quota.
