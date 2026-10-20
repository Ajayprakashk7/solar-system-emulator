## 2025-03-03 - Next.js Missing Default Content Security Policy
**Vulnerability:** The Next.js application was completely missing a `Content-Security-Policy` header in its `next.config.mjs` security headers array, despite configuring others like `X-Frame-Options`.
**Learning:** Next.js does not enforce a strict CSP by default. While adding security headers, developers often overlook CSP because setting a strict one (with nonces) is complex and can break hydration or HMR. A pragmatic fallback is required.
**Prevention:** Always verify that a baseline CSP is explicitly defined in `next.config.mjs` (using `'unsafe-inline'`/`'unsafe-eval'` if necessary for React/Next.js) to restrict `img-src` and `connect-src` to known safe external domains (like NASA APIs).
