## 2024-05-24 - Circular Button Focus Rings
**Learning:** Global CSS in this repo applies a default 4px border-radius to focus-visible elements, which causes custom circular buttons with rounded-full to have broken, boxy focus outlines during keyboard navigation.
**Action:** Always explicitly apply focus-visible:outline-none focus-visible:ring-2 focus-visible:rounded-full to interactive elements that have rounded-full to override the global style and preserve the intended shape.
