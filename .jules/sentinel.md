## 2026-10-15 - Prevent API Key Leak in Fetch Errors
**Vulnerability:** Upstream fetch errors log the full URL, exposing the API key.
**Learning:** Default error messages from `fetch` can leak sensitive query parameters when URLs fail to parse or network errors occur.
**Prevention:** Sanitize error messages to mask sensitive query parameters like `api_key` before passing them to application error handlers and loggers.
