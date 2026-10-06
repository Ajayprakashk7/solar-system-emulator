## 2024-10-06 - Responsive Class Hiding Strips Accessible Names
**Learning:** Hiding button text on mobile via responsive Tailwind classes (e.g., hidden sm:inline) entirely removes the accessible name for mobile screen readers if the remaining content is only a decorative or icon element.
**Action:** Always verify that responsive text hiding is accompanied by an aria-label on the parent interactive element to preserve accessibility across all viewports.
