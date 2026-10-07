## 2024-03-20 - Missing ARIA labels on UI Controls
**Learning:** Found several floating UI buttons (ExitButton, MobileInstructions) that lack proper ARIA labels and focus indicators, making them difficult for screen reader and keyboard users to navigate.
**Action:** Add explicit `aria-label` attributes and `focus-visible` styling to all icon-only or functionally important floating UI buttons.
