## 2025-02-23 - Missing Content-Security-Policy Header
**Vulnerability:** The application was missing a Content-Security-Policy (CSP) header, which is a critical defense-in-depth measure against Cross-Site Scripting (XSS) and data injection attacks.
**Learning:** Next.js requires specific CSP directives (`script-src 'unsafe-inline' 'unsafe-eval'` and `style-src 'unsafe-inline'`) to ensure that client-side hydration, Webpack HMR, and styled components do not break.
**Prevention:** Always implement a baseline CSP in `next.config.mjs` for all Next.js projects while adhering to framework-specific requirements.
