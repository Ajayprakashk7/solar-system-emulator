## 2024-05-24 - Rate Limiting Missing on Educational API
**Vulnerability:** Missing rate limiting on the `/api/nasa/educational/[body]` endpoint.
**Learning:** The application implements a custom rate limiter for NASA proxy routes but it was completely missing from the educational endpoint, potentially allowing API abuse or DoS by a single client requesting educational content rapidly.
**Prevention:** Ensure all public-facing API routes have the checkNasaRateLimit logic implemented.
