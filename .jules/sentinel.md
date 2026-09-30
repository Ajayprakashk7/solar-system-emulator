## YYYY-MM-DD - Fix Rate Limiter Scope and Header Serialization
**Vulnerability:** The rate limiter fell back to a global bucket because no user-specific IP was provided, leading to global rate limits and potential DoS. Returning un-serialized Date objects in headers caused runtime errors.
**Learning:** Always pass the leftmost extracted IP from x-forwarded-for or x-real-ip to the rate limiter to create user-specific buckets. Always convert Date objects to Unix timestamps before passing them as headers.
**Prevention:** Strictly enforce client IP extraction for API routes utilizing the rate limiter. Ensure all date objects are serialized to Unix timestamps in HTTP headers.
