## 2024-05-30 - Fix Vulnerable Dependencies (next & zod)
**Vulnerability:** Next.js had a critical vulnerability (RCE) and zod had a high severity vulnerability (memory exhaustion).
**Learning:** These dependencies had known CVEs that were caught by `npm audit --omit=dev --audit-level=high`.
**Prevention:** Regularly run `npm audit` and proactively update dependencies. Also fix type-checking regressions introduced by newer major/minor versions (like `zod@4.6.7`).
