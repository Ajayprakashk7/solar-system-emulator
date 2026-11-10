## 2024-11-10 - Update Dependencies for Security Vulnerabilities
**Vulnerability:** Next.js had a critical unauthenticated RCE and DoS vulnerability. Zod had a high severity memory exhaustion vulnerability.
**Learning:** `npm audit` flagged dependencies that were outdated in `package.json` that are known to have security flaws.
**Prevention:** Keep dependencies updated using dependabot or regular manual checks to ensure known vulnerabilities are patched.
