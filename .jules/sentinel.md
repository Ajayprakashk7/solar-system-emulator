## 2026-09-13 - Dual Rate-Limiting with Next.js 15 IP Extraction
**Vulnerability:** Next.js 15 API routes lack rate-limiting on external NASA API proxy endpoints, allowing DoS and quota exhaustion attacks.
**Learning:** Next.js 15 removed `request.ip` from `NextRequest`, necessitating manual IP extraction from the leftmost entry of the `x-forwarded-for` header for per-IP tracking. Dual limiters (IP-specific and global) must evaluate sequentially—IP first—with early returns, avoiding simultaneous pre-evaluation that defeats short-circuiting.
**Prevention:** Always implement sequential IP and global rate limiting on external API proxy endpoints, extracting the actual client IP correctly from headers in Next.js 15.
## 2026-09-13 - Next.js Rate Limit Headers & Safe IP Extraction
**Vulnerability:** Trusting the leftmost IP in `x-forwarded-for` allows attackers to bypass rate limits or DoS specific users via IP spoofing. Additionally, `Date.toISOString()` on rate limit reset properties crashes responses.
**Learning:** Vercel securely populates the *rightmost* IP in `x-forwarded-for` and provides `x-real-ip`. We must parse the proxy chain correctly to prevent targeted DoS, and always convert Date objects to Unix timestamps (via `getTime() / 1000`) before passing them as HTTP headers to prevent runtime exceptions.
**Prevention:** Always use `x-real-ip` or the rightmost `x-forwarded-for` IP for rate-limiting, and ensure header values are safely stringified primitive types (like timestamps), avoiding object serialization methods that may fail or not be supported by HTTP standards.
