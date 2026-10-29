## 2024-03-24 - [Add Content-Security-Policy]
**Vulnerability:** Missing Content-Security-Policy (CSP) headers exposing the application to Cross-Site Scripting (XSS) and data injection attacks.
**Learning:** Next.js applications require 'unsafe-inline' and 'unsafe-eval' in script-src for client-side hydration, and external domains such as NASA APIs must be explicitly whitelisted.
**Prevention:** Always implement a strict but functional CSP in next.config.mjs when developing Next.js applications, ensuring necessary external domains are included in connect-src and img-src.
