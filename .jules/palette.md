## 2024-05-24 - Focus Indicators on Dark Mode UI Overlays
**Learning:** The default global `:focus-visible` outline in `globals.css` (blue) clashes with specific planet button colors (like purple) and lacks proper contrast on black backgrounds, making keyboard navigation less intuitive.
**Action:** Always apply explicit, component-specific Tailwind `focus-visible` utility classes (e.g., `focus-visible:ring-purple-400 focus-visible:ring-offset-black`) to custom UI overlay elements to ensure high-contrast, context-aware focus states.
