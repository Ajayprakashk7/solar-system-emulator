## 2024-10-31 - Missing Content Security Policy
**Vulnerability:** The application was missing a Content-Security-Policy (CSP) header, which is a critical defense-in-depth mechanism against Cross-Site Scripting (XSS) and data injection attacks.
**Learning:** Next.js applications require specific CSP directives (`'unsafe-inline'` and `'unsafe-eval'` for scripts, `'unsafe-inline'` for styles) to function correctly with client-side hydration and HMR. External domains configured in `next.config.mjs` (like NASA API domains) must also be explicitly whitelisted in the CSP.
**Prevention:** Always implement a baseline CSP in `next.config.mjs` and ensure any newly added external image or API domains are added to both `remotePatterns` and the CSP header.
