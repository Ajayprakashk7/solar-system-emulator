## 2024-05-24 - Accessibility: Circular Button Focus States
**Learning:** Global CSS resets (like `*:focus-visible { border-radius: 4px; }`) can inadvertently break the shape of custom rounded UI elements, such as fully circular buttons (`rounded-full`), during keyboard navigation.
**Action:** When creating circular interactive elements, always apply explicit focus utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:rounded-full`) to override global resets and ensure focus rings maintain the intended shape.
