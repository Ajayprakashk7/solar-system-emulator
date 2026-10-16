## 2025-02-27 - Explicit programmatic associations in disclosure patterns
**Learning:** Users of assistive technologies rely on explicit programmatic associations for disclosure patterns like expandable lists. The existing implementation lacks this connection.
**Action:** Always pair aria-expanded on a disclosure toggle button with aria-controls="[id]", and ensure the target expandable container has the matching id="[id]" attribute.
