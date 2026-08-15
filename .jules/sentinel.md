## 2023-10-24 - Missing Rate Limiting on External API Proxies
**Vulnerability:** The NASA API proxy endpoints (`/api/nasa/neo` and `/api/nasa/apod`) were missing rate limiting, allowing unauthenticated users to make unlimited requests.
**Learning:** This exposes the application's backend NASA API key to quota exhaustion and potential denial of service from the upstream provider, as the `nasaRateLimiter` was only applied to the `planet` and `moon` endpoints.
**Prevention:** All external API proxy routes must implement the centralized `nasaRateLimiter` to protect the backend API quota, regardless of their specific functionality or caching strategy.
